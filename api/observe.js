const PRIMARY=process.env.VOICE_OBSERVER_MODEL||'openai/gpt-5.6-luna';
const FALLBACK='openai/gpt-5.4';

const SYSTEM=`You are the live conversation observer for a candidate-side Medidata Senior Implementation Consultant - Enablement interview coach.
You receive a rolling transcript plus the newest speech segment. Your job is NOT to answer the interview question. Your job is to decide whether the newest turn requires a candidate response.

Return ONLY compact JSON:
{"speaker":"INTERVIEWER"|"CANDIDATE"|"UNKNOWN","action":"ANSWER"|"WAIT"|"IGNORE","question":"string","confidence":0.0,"reason":"short string"}

Behavior rules:
- Follow the whole conversation. Short prompts depend on prior context: "why?", "what next?", "how so?", "what if that fails?", "what if the sponsor insists?", "how would you verify that?", "give me an example" can be valid interviewer questions.
- ANSWER when the interviewer asks a substantive recruiter, behavioral, eCOA, clinical-trial, enablement, UAT, product, release, defect, data-flow, mentoring, or client-consultation question; presents a scenario and expects the candidate to respond; or clearly hands over the floor.
- WAIT when the newest interviewer turn is obviously unfinished, trails off, ends in a setup phrase, or sounds like the interviewer is still building the scenario.
- IGNORE greetings, acknowledgments, filler, company explanation with no ask, and the candidate's own answer.
- Candidate language often begins with first-person execution language such as: "I would", "I'd", "I usually", "my approach", "the first thing I'd check", "at Signant", "at Clario", "at IQVIA".
- Interviewer language often frames hypotheticals, asks for reasoning, probes sequence, or tests consulting judgment: "walk me through", "let's say", "suppose", "why", "what next", "how would you know", "what if", "how would you handle".
- Speaker detection is soft. Infer from wording and context; never require certainty.
- If multiple tightly related questions are asked in one turn, cluster them into one natural question preserving every required part.
- If action=ANSWER, question must contain enough context to answer correctly. Preserve important details such as protocol/SoA requirements, assessment type, patient/site role, timing/window, reminders, translations, validated instruments, UAT, data integrity, EDC/downstream flow, whether the study is live, and client or operational risk.
- If action is WAIT or IGNORE, question may be empty.
- confidence is 0 to 1.
- reason is a very short debug explanation.
- Prefer ANSWER over IGNORE only when there is a real indication the interviewer expects the candidate to respond. Do not answer ordinary candidate speech just because it contains eCOA or clinical terminology.`;

async function callGateway(token,model,prompt){
  return fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
    method:'POST',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({model,stream:false,messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}]})
  });
}
function parse(text){try{return JSON.parse(text)}catch{}const s=text.indexOf('{'),e=text.lastIndexOf('}');if(s>=0&&e>s){try{return JSON.parse(text.slice(s,e+1))}catch{}}return null}
module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const {latest='',rollingTranscript='',recentContext=[]}=req.body||{};
  if(!latest||typeof latest!=='string')return res.status(400).json({error:'latest is required'});
  const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!token)return res.status(500).json({error:'AI gateway token missing'});
  const qa=Array.isArray(recentContext)?recentContext.slice(-5).map((x,i)=>`${i+1}. Interviewer: ${String(x?.question||'').slice(0,320)}\nCandidate: ${String(x?.answer||'').slice(0,420)}`).join('\n'):'';
  const prompt=[qa&&`Recent answered turns:\n${qa}`,rollingTranscript&&`Rolling live transcript:\n${String(rollingTranscript).slice(-6000)}`,`Newest speech segment:\n${latest}`].filter(Boolean).join('\n\n');
  let last='Observer unavailable';
  for(const model of [PRIMARY,FALLBACK]){
    try{
      const r=await callGateway(token,model,prompt);
      if(!r.ok){last=await r.text();continue}
      const j=await r.json();const text=j?.choices?.[0]?.message?.content||'';const out=parse(text);if(!out)continue;
      const speaker=['INTERVIEWER','CANDIDATE','UNKNOWN'].includes(out.speaker)?out.speaker:'UNKNOWN';
      const action=['ANSWER','WAIT','IGNORE'].includes(out.action)?out.action:'IGNORE';
      return res.status(200).json({speaker,action,question:String(out.question||''),confidence:Math.max(0,Math.min(1,Number(out.confidence)||0)),reason:String(out.reason||''),model});
    }catch(e){last=e?.message||last}
  }
  return res.status(502).json({error:last});
};