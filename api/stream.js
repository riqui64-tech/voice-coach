const SYSTEM = `You are Voice Coach, an elite practice assistant for technical interview practice.

PRIMARY GOAL
Give the simplest spoken answer that proves experienced understanding. The candidate should sound like a capable coworker, not a textbook, chatbot, or memorized script.

BEHAVIOR
- Answer the actual conversational intent, even when the interviewer goes off script.
- Default SAY THIS length: about 20-40 seconds spoken, but shorter when a short answer is enough.
- Use technical terminology only when it helps clarity.
- Never invent direct experience. If exact experience is unknown, say so naturally and bridge from transferable fundamentals.
- Troubleshooting reasoning: scope -> impact -> recent change -> evidence -> isolate -> safest useful fix -> verify.
- If the interviewer is casual, respond naturally rather than forcing an interview framework.
- If the question is ambiguous, answer the most likely interpretation without rambling.

OUTPUT FORMAT — EXACTLY
Start immediately with the candidate's spoken answer. Do not write a heading before it.
Then output this exact delimiter on its own line:
<<<DETAILS_JSON>>>
Then output one compact valid JSON object with exactly these keys:
{"thoughtProcess":"short string","testing":"short string","technical":["max 5 short points"],"followUp":"short string","stopHere":true}

Do not use markdown fences. Do not output anything after the JSON.`;

module.exports = async function handler(req,res){
  if(req.method!=='POST') return res.status(405).send('Method not allowed');

  const {question,role='General IT / TechOps',depth='simple'} = req.body || {};
  if(!question || typeof question!=='string') return res.status(400).send('Question is required');

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if(!token) return res.status(500).send('AI_GATEWAY_API_KEY is missing from this deployment.');

  const model = process.env.VOICE_COACH_MODEL || 'minimax/minimax-m2.7-free';

  try {
    const upstream = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method:'POST',
      headers:{
        'Authorization':'Bearer '+token,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        model,
        stream:true,
        messages:[
          {role:'system',content:SYSTEM},
          {role:'user',content:`Target role: ${role}\nRequested depth: ${depth}\nInterviewer input: ${question}`}
        ]
      })
    });

    if(!upstream.ok){
      const text = await upstream.text();
      let detail = text;
      try {
        const parsed = JSON.parse(text);
        detail = parsed?.error?.message || parsed?.message || text;
      } catch {}
      return res.status(upstream.status).send(detail || `AI Gateway returned HTTP ${upstream.status}`);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    res.setHeader('Cache-Control','no-cache, no-transform');
    res.setHeader('X-Accel-Buffering','no');

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while(true){
      const {done,value} = await reader.read();
      if(done) break;
      buffer += decoder.decode(value,{stream:true});
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for(const rawLine of lines){
        const line = rawLine.trim();
        if(!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if(!payload || payload==='[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content;
          if(typeof delta==='string' && delta) res.write(delta);
        } catch {}
      }
    }

    res.end();
  } catch (error) {
    console.error('Voice Coach stream error:',error);
    if(!res.headersSent) return res.status(500).send(error?.message || 'Streaming response failed');
    res.end();
  }
};
