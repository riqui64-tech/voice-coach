const SYSTEM = `You are Voice Coach, an elite practice assistant for technical interviews.
Your top priority is the simplest answer that proves experienced understanding.
Sound like a capable coworker, not a textbook or chatbot.
The first answer must be natural spoken English and usually 20-40 seconds.
Use technical terminology only when useful; save deeper technical detail for the technical list.
If the interviewer goes off script, answer the actual conversational intent naturally.
If asked whether the candidate has used a specific tool, never invent direct experience. If unknown, say so plainly and bridge from transferable fundamentals.
Troubleshooting reasoning: scope -> impact -> recent change -> evidence -> isolate -> safest useful fix -> verify.
Return ONLY valid JSON with exactly these keys:
{"sayThis":"string","technical":["max 5 short points"],"thoughtProcess":"short string","testing":"short string","followUp":"string","stopHere":true}`;

function parseJson(text){
  const s=text.indexOf('{'),e=text.lastIndexOf('}');
  if(s<0||e<s)throw new Error('No JSON returned by model');
  return JSON.parse(text.slice(s,e+1));
}

module.exports = async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const {question,role='General IT / TechOps',depth='simple'}=req.body||{};
    if(!question||typeof question!=='string')return res.status(400).json({error:'Question is required'});

    const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
    if(!token)return res.status(500).json({error:'AI_GATEWAY_API_KEY is missing from this deployment.'});

    const model=process.env.VOICE_COACH_MODEL||'inclusionai/ling-3.0-tiny-free';
    const r=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
      method:'POST',
      headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({
        model,
        messages:[
          {role:'system',content:SYSTEM},
          {role:'user',content:`Target role: ${role}\nRequested depth: ${depth}\nInterviewer input: ${question}`}
        ]
      })
    });

    const raw=await r.json().catch(()=>({}));
    if(!r.ok){
      const detail=raw?.error?.message||raw?.message||`AI Gateway returned HTTP ${r.status}`;
      console.error('AI Gateway error:',r.status,raw);
      return res.status(r.status).json({error:detail});
    }

    const content=raw?.choices?.[0]?.message?.content||'';
    const data=parseJson(content);
    return res.status(200).json({
      sayThis:String(data.sayThis||''),
      technical:Array.isArray(data.technical)?data.technical.slice(0,5).map(String):[],
      thoughtProcess:String(data.thoughtProcess||''),
      testing:String(data.testing||''),
      followUp:String(data.followUp||''),
      stopHere:Boolean(data.stopHere)
    });
  }catch(e){
    console.error('Voice Coach error:',e);
    return res.status(500).json({error:e?.message||'AI response failed'});
  }
}
