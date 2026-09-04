const PRIMARY=process.env.VOICE_OBSERVER_MODEL||'openai/gpt-5.6-luna-fast';
const FALLBACK='minimax/minimax-m2.7-free';

const SYSTEM=`You are the live conversation observer for a candidate-side technical interview coach.
You receive a rolling transcript plus the newest speech segment. Your job is NOT to answer the interview question. Your job is to decide whether the newest interviewer turn requires a candidate response.

Return ONLY compact JSON:
{"speaker":"INTERVIEWER"|"CANDIDATE"|"UNKNOWN","action":"ANSWER"|"WAIT"|"IGNORE","question":"string","confidence":0.0,"reason":"short string"}

Behavior rules:
- Follow the entire conversation. Short prompts can depend on earlier context: "why?", "what next?", "and Jamf?", "how so?", "walk me through that", "what would you check first?" are valid interviewer questions when context makes them meaningful.
- ANSWER whenever the interviewer asks a substantive question, requests an example/explanation, presents a scenario and asks what the candidate would do, or clearly hands the floor to the candidate for a substantive response.
- WAIT only when the newest turn is obviously unfinished or the interviewer is still building the question.
- IGNORE greetings, acknowledgments, filler, company explanation without an ask, and the candidate's own answer.
- Speaker detection is soft. Infer from wording and context; never require certainty.
- If the interviewer asks multiple tightly related questions in one turn, cluster them into one natural question that preserves all required parts.
- If unsure between ANSWER and IGNORE and there is a reasonable chance the interviewer expects a response, prefer ANSWER.
- If action=ANSWER, question must contain enough context to answer correctly. Do not over-summarize away technical scenario details.
- If action is WAIT or IGNORE, question may be empty.
- confidence is 0 to 1.
- reason is a very short debug explanation.`;

async function callGateway(token,model,prompt){
  return fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
    method:'POST',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({model,stream:false,max_tokens:150,temperature:0,messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}]})
  });
}
function parse(text){try{return JSON.parse(text)}catch{}const s=text.indexOf('{'),e=text.lastIndexOf('}');if(s>=0&&e>s){try{return JSON.parse(text.slice(s,e+1))}catch{}}return null}
module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const {latest='',rollingTranscript='',recentContext=[]}=req.body||{};
  if(!latest||typeof latest!=='string')return res.status(400).json({error:'latest is required'});
  const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!token)return res.status(500).json({error:'AI gateway token missing'});
  const qa=Array.isArray(recentContext)?recentContext.slice(-4).map((x,i)=>`${i+1}. Interviewer: ${String(x?.question||'').slice(0,280)}\nCandidate: ${String(x?.answer||'').slice(0,360)}`).join('\n'):'';
  const prompt=[qa&&`Recent answered turns:\n${qa}`,rollingTranscript&&`Rolling live transcript:\n${String(rollingTranscript).slice(-5000)}`,`Newest speech segment:\n${latest}`].filter(Boolean).join('\n\n');
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