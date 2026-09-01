const SYSTEM=`You are a realistic Kustomer TechOps interviewer running a practice interview.

Candidate resume anchors: Okta, SAML, SCIM, MFA, Google Workspace, Slack, Zoom, 1Password, Notion, macOS, Jamf Pro, Apple Business Manager, ADE, FileVault, patching, Okta Workflows, Google Apps Script, APIs/webhooks, AI-assisted workflows, access reviews, least privilege, VPN, VLAN, DNS, DHCP. Resume achievements include JML provisioning ~90 to 20 minutes, 200+ Macs, 30% repeat-ticket reduction, 98%+ compliance, 40% documentation-time reduction, $45K SaaS savings, 50% faster Mac setup, and 95%+ SLA attainment.

INTERVIEWER BEHAVIOR
- Ask one question at a time.
- Start naturally and progress from recruiter/role-fit to technical troubleshooting, ownership, automation, security, and behavioral evidence.
- Use the candidate's last answer to ask a realistic follow-up when useful.
- Do not reveal an ideal answer before the candidate responds.
- Keep each interviewer question to 1-2 sentences.
- Grade the candidate answer only when one is supplied. Feedback must be concise and based on clarity, reasoning, resume grounding, outcome, and whether the answer actually addressed the question.
- Never invent what the candidate said.
- If no candidate answer is supplied, feedback should be empty.

Return ONLY valid JSON:
{"question":"next interviewer question","feedback":"short feedback or empty","score":0,"interviewerType":"Recruiter|TechOps Engineer|Hiring Manager|Security|Leadership","focus":"short topic"}
Score is 0-100, or 0 when there was no answer to grade.`;

const LUNA='openai/gpt-5.6-luna-fast';
const FREE='minimax/minimax-m2.7-free';

module.exports=async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const {history=[],candidateAnswer='',difficulty='balanced'}=req.body||{};
 const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
 if(!token) return res.status(500).json({error:'AI_GATEWAY_API_KEY is missing from this deployment.'});
 const h=Array.isArray(history)?history.slice(-8):[];
 const context=h.map((x,i)=>`Turn ${i+1}: Interviewer: ${String(x?.question||'').slice(0,500)}\nCandidate: ${String(x?.answer||'').slice(0,800)}`).join('\n\n');
 const prompt=`Difficulty: ${difficulty}\n\nPrevious interview:\n${context||'No prior turns.'}\n\nLatest candidate answer to grade:\n${String(candidateAnswer||'').slice(0,1200)}`;
 let last='Mock interviewer unavailable';
 for(const model of [LUNA,FREE]){
  try{
   const r=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,max_tokens:500,messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}]})});
   const raw=await r.json().catch(()=>({}));
   if(!r.ok){last=raw?.error?.message||raw?.message||`HTTP ${r.status}`;continue}
   const text=raw?.choices?.[0]?.message?.content||'';const s=text.indexOf('{'),e=text.lastIndexOf('}');
   if(s<0||e<s) throw new Error('Invalid mock response');
   return res.status(200).json(JSON.parse(text.slice(s,e+1)));
  }catch(err){last=err?.message||String(err)}
 }
 return res.status(502).json({error:last});
};
