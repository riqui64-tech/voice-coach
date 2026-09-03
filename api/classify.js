const LUNA='openai/gpt-5.6-luna-fast';
const FREE='minimax/minimax-m2.7-free';

const SYSTEM=`You classify live interview transcript segments for a candidate-side voice coach.
Return ONLY compact JSON with this schema:
{"intent":"ANSWER"|"WAIT"|"IGNORE","question":"string","confidence":0.0}

Rules:
- ANSWER when the latest speech asks the candidate a real interview question, requests an explanation/example, gives a scenario and asks what they would do, or clearly invites a substantive response.
- IGNORE for candidate-style answers, acknowledgments, filler, company explanation without an ask, greetings, "okay", "right", "does that make sense?", or conversational chatter that does not require a substantive interview answer.
- WAIT only when the latest speech clearly sounds unfinished or cut off.
- If ANSWER, question should preserve the actual ask in natural wording. Include enough scenario context to answer correctly.
- Do not require a question mark. Phrases like "walk me through...", "tell me about...", "let's say...", "I'm curious how...", "take me through..." are questions.
- Prefer ANSWER over WAIT when the thought is complete enough to respond to.
- Never invent details not present in the transcript.`;

async function callGateway(token,model,body){
  return fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
    method:'POST',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({
      model,
      stream:false,
      max_tokens:120,
      temperature:0,
      messages:[{role:'system',content:SYSTEM},{role:'user',content:body}]
    })
  });
}

function parseJSON(text){
  try{return JSON.parse(text)}catch{}
  const s=text.indexOf('{'),e=text.lastIndexOf('}');
  if(s>=0&&e>s){try{return JSON.parse(text.slice(s,e+1))}catch{}}
  return null;
}

module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const {segment='',recentSegments=[],recentContext=[]}=req.body||{};
  if(!segment||typeof segment!=='string')return res.status(400).json({error:'segment is required'});
  const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!token)return res.status(500).json({error:'AI gateway token missing'});

  const conversation=Array.isArray(recentContext)?recentContext.slice(-3).map((x,i)=>`${i+1}. Q: ${String(x?.question||'').slice(0,220)}\nA: ${String(x?.answer||'').slice(0,260)}`).join('\n'):'';
  const segments=Array.isArray(recentSegments)?recentSegments.slice(-4).map((x,i)=>`${i+1}. ${String(x||'').slice(0,320)}`).join('\n'):'';
  const prompt=[conversation&&`Recent answered interview turns:\n${conversation}`,segments&&`Recent speech segments before the newest one:\n${segments}`,`Newest speech segment:\n${segment}`].filter(Boolean).join('\n\n');

  let lastError='Classifier unavailable';
  for(const model of [process.env.VOICE_CLASSIFIER_MODEL||LUNA,FREE]){
    try{
      const r=await callGateway(token,model,prompt);
      if(!r.ok){lastError=await r.text();continue}
      const data=await r.json();
      const text=data?.choices?.[0]?.message?.content||'';
      const out=parseJSON(text);
      if(!out)continue;
      const intent=['ANSWER','WAIT','IGNORE'].includes(out.intent)?out.intent:'IGNORE';
      return res.status(200).json({intent,question:String(out.question||''),confidence:Number(out.confidence)||0,model});
    }catch(e){lastError=e?.message||lastError}
  }
  return res.status(502).json({error:lastError});
};