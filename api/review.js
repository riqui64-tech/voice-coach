const REVIEW_SYSTEM = `You are a concise senior TechOps interview coach reviewing a Kustomer TechOps practice session.

The session data contains interviewer questions and the coach answers that were generated during the session. It does NOT contain the candidate's actual spoken delivery. Never claim to score tone, fluency, confidence, pacing, or exact spoken performance.

Evaluate only what the available data supports:
- topic coverage
- resume grounding
- variety of evidence/stories
- repetition
- strength of answer structure
- likely missing Kustomer TechOps areas
- what to practice next

Kustomer TechOps resume anchors available to the candidate include: Okta, SAML, SCIM, MFA, Google Workspace, Slack, Zoom, 1Password, Notion, macOS, Jamf Pro, Apple Business Manager, ADE, FileVault, patching, Okta Workflows, Google Apps Script, APIs/webhooks, AI-assisted workflows, access reviews, audit evidence, least privilege, VPN, VLAN, DNS, DHCP; JML provisioning reduced ~90 to 20 minutes; 200+ Macs; repeat support volume reduced 30%; endpoint compliance 98%+; AI documentation time reduced 40%; SaaS catalog identified $45K savings; Mac setup reduced 50%; 95%+ SLA attainment.

Return ONLY valid JSON with exactly these keys:
{"overall":"short assessment","coverageScore":0,"resumeGroundingScore":0,"varietyScore":0,"strengths":["max 4"],"gaps":["max 4"],"repetition":["max 3"],"nextPractice":["max 5"],"note":"short limitation note"}
Scores are integers 0-100.`;

const LUNA_FAST='openai/gpt-5.6-luna-fast';
const FREE_FALLBACK='minimax/minimax-m2.7-free';

module.exports=async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const {recentContext=[]}=req.body||{};
  if(!Array.isArray(recentContext)||!recentContext.length) return res.status(400).json({error:'No interview turns to review'});

  const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!token) return res.status(500).json({error:'AI_GATEWAY_API_KEY is missing from this deployment.'});

  const transcript=recentContext.slice(-12).map((x,i)=>`Turn ${i+1}\nInterviewer: ${String(x?.question||'').slice(0,700)}\nCoach answer: ${String(x?.answer||'').slice(0,1000)}`).join('\n\n');

  let lastError='Review model unavailable';
  for(const model of [LUNA_FAST,FREE_FALLBACK]){
    try{
      const r=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
        method:'POST',
        headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({model,stream:false,max_tokens:700,messages:[{role:'system',content:REVIEW_SYSTEM},{role:'user',content:`Review this Kustomer TechOps interview session:\n\n${transcript}`}]})
      });
      const raw=await r.json().catch(()=>({}));
      if(!r.ok){lastError=raw?.error?.message||raw?.message||`HTTP ${r.status}`;continue}
      const text=raw?.choices?.[0]?.message?.content||'';
      const s=text.indexOf('{'),e=text.lastIndexOf('}');
      if(s<0||e<s) throw new Error('Review model returned invalid JSON');
      const data=JSON.parse(text.slice(s,e+1));
      return res.status(200).json(data);
    }catch(err){lastError=err?.message||String(err)}
  }
  return res.status(502).json({error:lastError});
};
