const KUSTOMER_RESUME = `KUSTOMER TECHOPS RESUME — ONLY RESUME SOURCE OF TRUTH

Professional profile:
Systems Administrator with 5+ years of experience owning Mac-first IT operations, identity, Google Workspace, SaaS administration, endpoint security, automation, self-service documentation, and secure lifecycle workflows.

Core technologies explicitly supported by the resume:
- Identity & SaaS: Okta, SAML, SCIM, MFA, Google Workspace, Slack, Zoom, 1Password, Notion
- Apple & Endpoint: macOS, Jamf Pro, Apple Business Manager, Automated Device Enrollment, FileVault, patching
- Automation & Operations: Okta Workflows, Google Apps Script, APIs/webhooks, AI-assisted workflows, zero-touch onboarding
- Security & Networking: access reviews, audit evidence, least privilege, CIA triad, VPN, VLAN, DNS, DHCP, routers

Systems Administrator — Braze, 2023-present:
- Own Google Workspace, Okta, Jamf Pro, Slack, Zoom, 1Password, and Notion administration for 250+ employees across the U.S. and U.K.
- Automated joiner/mover/leaver workflows with Okta Workflows, SCIM, and Google Apps Script; provisioning reduced from about 90 minutes to 20 minutes and recurring access errors were eliminated.
- Manage 200+ Macs through Apple Business Manager and Jamf Pro: zero-touch enrollment, configuration profiles, FileVault escrow, patching, repairs, remote shipping, and inventory lifecycle.
- Reduced repeat support volume 30% through ticket-pattern analysis, task-based Notion guides, and self-service fixes.
- Partner with Security on quarterly access reviews, endpoint compliance, audit evidence, and remediation tracking; encryption and critical-patch compliance reached 98%+.
- Built AI-assisted ticket triage and knowledge drafting with human approval, cutting documentation time 40% while protecting confidential data.
- Established a SaaS catalog covering owners, renewals, contracts, SSO status, data sensitivity, and user counts; identified $45K annual savings.

IT Systems Specialist — Electric, 2021-2023:
- Administered Google Workspace, Okta, Slack, Zoom, and macOS for 150+ users.
- Resolved identity, SSO, endpoint, VPN, and collaboration issues while meeting 95%+ SLA attainment.
- Standardized Mac deployment and recovery, cutting new-hire setup time 50%.
- Created SOPs/runbooks for MFA resets, account recovery, application access, device replacement, and offboarding.
- Troubleshot VPN, Wi-Fi, DNS, DHCP, and VLAN issues and coordinated escalations with network/security teams.

IT Support Specialist — Maimonides, 2019-2021:
- Level 1/2 support for macOS and Windows endpoints, user accounts, conferencing tools, printers, and business applications.
- Owned incidents through resolution and documented root cause and follow-up actions.

TRUTH RULE:
This Kustomer TechOps resume is the only resume you may use. Never use or reference D. E. Shaw, Integris, Skadden, D365, Murex, or another resume/profile. Never invent experience outside the resume above. Distinguish direct resume experience from general technical knowledge.`;

const STORY_BANK = [
  {id:'jml-automation',label:'JML automation — 90 min to 20 min',domain:'Automation & Identity',strengths:['automation','ownership','process improvement','scale'],triggers:/(improv|automat|manual process|onboard|offboard|joiner|mover|leaver|provision|efficien|repetitive|scale|process|biggest accomplishment|proud)/i,signals:[/90 minutes/i,/20 minutes/i,/joiner/i,/mover/i,/leaver/i,/okta workflows/i],story:'At Braze, automated joiner/mover/leaver workflows using Okta Workflows, SCIM, and Google Apps Script. Provisioning fell from about 90 minutes to 20 minutes and recurring access errors were eliminated.',bestFor:'process improvement, automation, scaling, ownership, reducing errors'},
  {id:'ticket-reduction',label:'Repeat-ticket reduction — 30%',domain:'Support & Self-Service',strengths:['proactive support','root cause','documentation','user experience'],triggers:/(ticket|self.?service|documentation|repeat issue|prevent|knowledge|support volume|root cause|proactive|customer experience)/i,signals:[/30%/i,/repeat support/i,/notion guides/i,/self-service/i],story:'At Braze, analyzed ticket patterns, published task-based Notion guides, and created self-service fixes, reducing repeat support volume by 30%.',bestFor:'proactive support, documentation, root cause, customer experience, prioritization'},
  {id:'security-compliance',label:'Security partnership — 98%+ compliance',domain:'Security & Compliance',strengths:['judgment','security partnership','audit readiness','least privilege'],triggers:/(security|audit|least privilege|compliance|risk|confidential|privilege|access review|patch|encryption|filevault)/i,signals:[/98%/i,/access review/i,/audit evidence/i,/endpoint compliance/i],story:'Partnered with Security on quarterly access reviews, endpoint compliance, audit evidence, and remediation tracking; encryption and critical-patch compliance reached 98%+.',bestFor:'security partnership, judgment, audit readiness, access control, endpoint compliance'},
  {id:'mac-lifecycle',label:'Mac fleet — 200+ devices',domain:'Apple & Endpoint',strengths:['endpoint ownership','reliability','lifecycle management','remote support'],triggers:/(jamf|mac|macos|apple business|ade|device|laptop|endpoint|filevault|patch|zero.?touch|shipping|repair)/i,signals:[/200\+? mac/i,/apple business manager/i,/jamf pro/i,/filevault escrow/i],story:'Managed 200+ Macs through Apple Business Manager and Jamf Pro, including zero-touch enrollment, configuration profiles, FileVault escrow, patching, repairs, remote shipping, and lifecycle controls.',bestFor:'device lifecycle, Jamf, Mac administration, remote support, reliability'},
  {id:'ai-workflow',label:'AI-assisted triage — 40% documentation gain',domain:'AI & Automation',strengths:['innovation','responsible AI','controls','productivity'],triggers:/(ai|artificial intelligence|triage|knowledge draft|responsible use|human approval|automation with ai|innovation)/i,signals:[/40%/i,/ai-assisted/i,/human approval/i,/knowledge drafting/i],story:'Built AI-assisted ticket triage and knowledge drafting with human approval, cutting documentation time by 40% while protecting confidential data.',bestFor:'AI use, innovation, controls, responsible automation, productivity'},
  {id:'saas-savings',label:'SaaS catalog — $45K annual savings',domain:'SaaS Governance',strengths:['cost ownership','governance','vendor management','business impact'],triggers:/(saas|license|vendor|renewal|cost|saving|shadow it|application owner|catalog|contract|spend|business impact)/i,signals:[/45k/i,/\$45/i,/saas catalog/i,/redundant licenses/i],story:'Established a SaaS catalog with owners, renewals, contracts, SSO status, data sensitivity, and user counts; removed redundant licenses and identified $45K in annual savings.',bestFor:'SaaS ownership, cost control, governance, vendor management, shadow IT'},
  {id:'deployment-recovery',label:'Mac deployment — 50% faster setup',domain:'Onboarding & Operations',strengths:['standardization','onboarding','documentation','operational improvement'],triggers:/(new hire|first day|deployment|recovery|setup time|readiness|standardiz|procedure|runbook)/i,signals:[/50%/i,/deployment and recovery/i,/first-day readiness/i],story:'At Electric, standardized Mac deployment and recovery procedures, cutting new-hire setup time by 50% and improving first-day readiness.',bestFor:'standardization, onboarding, documentation, operational improvement'},
  {id:'sla-support',label:'IT support — 95%+ SLA attainment',domain:'Support Operations',strengths:['prioritization','urgency','communication','incident ownership'],triggers:/(urgent|priority|prioritiz|sla|incident|support pressure|multiple issue|user impact|escalat|customer service|executive)/i,signals:[/95%/i,/sla attainment/i,/150\+? users/i],story:'At Electric, supported 150+ users across identity, SSO, endpoint, VPN, and collaboration issues while maintaining 95%+ SLA attainment.',bestFor:'prioritization, urgency, support quality, escalation, user communication'},
  {id:'network-troubleshooting',label:'Network troubleshooting — VPN/DNS/DHCP/VLAN',domain:'Networking',strengths:['troubleshooting','evidence gathering','escalation','remote support'],triggers:/(vpn|wifi|wi-fi|dns|dhcp|vlan|network|connectivity|internet|remote access)/i,signals:[/vpn/i,/dns/i,/dhcp/i,/vlan/i],story:'At Electric, troubleshot VPN, Wi-Fi, DNS, DHCP, and VLAN-related issues and coordinated escalations with network and security teams.',bestFor:'network troubleshooting, escalation, evidence gathering, remote support'}
];

function historyText(recentContext){
  if(!Array.isArray(recentContext)) return '';
  return recentContext.map(x=>`${x?.question||''}\n${x?.answer||''}`).join('\n').toLowerCase();
}

function usedStoryIds(recentContext){
  const text=historyText(recentContext);
  return STORY_BANK.filter(s=>s.signals.some(rx=>rx.test(text))).map(s=>s.id);
}

function coveredDomains(recentContext){
  const ids=new Set(usedStoryIds(recentContext));
  return STORY_BANK.filter(s=>ids.has(s.id)).map(s=>s.domain);
}

function coveredStrengths(recentContext){
  const ids=new Set(usedStoryIds(recentContext));
  return [...new Set(STORY_BANK.filter(s=>ids.has(s.id)).flatMap(s=>s.strengths))];
}

function isExplicitRevisit(question){
  return /(go back|earlier|before|you mentioned|that example|same example|same project|previous|tell me more about that|expand on that|what you said about)/i.test(String(question||''));
}

function pickStory(question,recentContext){
  const q=String(question||'');
  const behavioral=/(tell me about|give me an example|describe a time|walk me through a time|time when|example of|challenge|difficult|mistake|conflict|improved|accomplishment|proud|initiative|ownership|project|strength|impact)/i.test(q);
  const used=new Set(usedStoryIds(recentContext));
  const candidates=STORY_BANK.filter(s=>s.triggers.test(q));
  if(!candidates.length && !behavioral) return null;

  if(isExplicitRevisit(q)){
    const usedCandidate=candidates.find(s=>used.has(s.id));
    if(usedCandidate) return {...usedCandidate,behavioral,reused:true};
  }

  const freshCandidate=candidates.find(s=>!used.has(s.id));
  if(freshCandidate) return {...freshCandidate,behavioral,reused:false};

  if(candidates.length) return {...candidates[0],behavioral,reused:used.has(candidates[0].id)};

  const freshFallback=STORY_BANK.find(s=>!used.has(s.id));
  return freshFallback?{...freshFallback,behavioral:true,reused:false}:{...STORY_BANK[0],behavioral:true,reused:true};
}

function resumeMatch(question,story){
  if(story)return{level:'Direct',label:story.label};
  const q=String(question||'').toLowerCase();
  const directTerms=['okta','saml','scim','mfa','google workspace','slack','zoom','1password','notion','jamf','macos','apple business manager','filevault','patch','vpn','dns','dhcp','vlan','api','webhook','onboarding','offboarding','saas'];
  const found=directTerms.find(t=>q.includes(t));
  if(found)return{level:'Direct',label:found};
  return{level:'General bridge',label:'Use resume-adjacent fundamentals only'};
}

const SYSTEM=`You are Voice Coach, an elite practice assistant for a Kustomer TechOps interview.

${KUSTOMER_RESUME}

PRIMARY GOAL
Give the fastest useful spoken answer that proves experienced understanding while staying fully grounded in the Kustomer TechOps resume above. Sound like a capable coworker, not a textbook, chatbot, or memorized script.

INTERVIEW INTELLIGENCE ENGINE
- Treat recent interview history as a coverage map, not just conversation memory.
- Prefer a fresh resume story when the interviewer asks for another example, accomplishment, strength, project, challenge, or behavioral story.
- Avoid repeating an already-used story, metric, or strength unless the interviewer explicitly asks to revisit or deepen it.
- If a topic requires the same technical domain, you may reuse domain knowledge without mechanically repeating the same accomplishment.
- Use the supplied USED STORIES, COVERED DOMAINS, and COVERED STRENGTHS to diversify evidence.
- If SELECTED STORY says reused=false, deliberately make that story the primary evidence.
- If SELECTED STORY says reused=true because no better fresh story exists, keep the reference brief and add a different angle rather than repeating the prior answer word-for-word.

PERSONAL STORY BRAIN
- When a behavioral or example-based question is asked, use the SELECTED STORY supplied in the user message if one is provided.
- Build a compact STAR-style response from that story: context -> action -> reasoning -> result.
- Do not add details that are not in the selected story or resume.
- If the question asks for failure/conflict/mistake and the resume does not contain a factual failure/conflict event, do NOT fabricate one. Use a truthful related example and state the lesson/process without inventing a failure.

RESUME GROUNDING
- For experience questions, use only facts supported by KUSTOMER_RESUME.
- Prefer the closest relevant resume example instead of generic filler.
- If the interviewer asks about a technology not listed in the resume, do not imply production ownership. Bridge from closely related fundamentals and explain the approach.
- Never fabricate metrics, project scope, incidents, responsibilities, tools, employers, or outcomes.
- The JSON testing field must begin with the supplied RESUME MATCH status, then briefly state what the interviewer is testing.

BEHAVIOR
- Answer the newest interviewer input directly, including follow-ups, corrections, challenges, small talk, scheduling, company/role discussion, and behavioral questions.
- TURBO DEFAULT: SAY THIS should usually be 1-3 sentences and about 8-15 seconds spoken. Get to the answer immediately.
- If requested depth is technical, keep SAY THIS concise and put specifics in the technical list.
- Only Deep mode may justify a longer answer.
- Use technical terminology only when it improves clarity.
- For troubleshooting use: scope -> impact -> evidence -> isolate -> safest useful fix -> verify.
- For behavioral answers use: context -> action -> reasoning -> result, briefly.
- For security-sensitive scenarios prioritize identity verification, least privilege, device trust, auditability, and safe escalation.
- For urgent support restore productivity safely first, then investigate root cause.

OUTPUT FORMAT — EXACTLY
Start immediately with the candidate's spoken answer. Do not write a heading before it.
Then output this exact delimiter on its own line:
<<<DETAILS_JSON>>>
Then output one compact valid JSON object with exactly these keys:
{"thoughtProcess":"short string","testing":"short string","technical":["max 5 short points"],"followUp":"short string","stopHere":true}
Do not use markdown fences. Do not output anything after the JSON.`;

const LUNA_FAST='openai/gpt-5.6-luna-fast';
const SOL_FAST='openai/gpt-5.6-sol-fast';
const FREE_FALLBACK='minimax/minimax-m2.7-free';

function chooseModel(depth){
  if(process.env.VOICE_COACH_MODEL)return process.env.VOICE_COACH_MODEL;
  return depth==='deep'?SOL_FAST:LUNA_FAST;
}

function compactContext(input){
  if(!Array.isArray(input))return'';
  return input.slice(-6).map((x,i)=>{
    const q=String(x?.question||'').slice(0,420);
    const a=String(x?.answer||'').slice(0,520);
    return`${i+1}. Interviewer: ${q}\nCandidate: ${a}`;
  }).filter(Boolean).join('\n');
}

async function openGatewayStream({token,model,question,depth,recentContext,selectedStory,match,usedStories,domains,strengths}){
  const context=compactContext(recentContext);
  const userContent=[
    'Target role: Kustomer TechOps',
    `Requested depth: ${depth}`,
    `RESUME MATCH: ${match.level} — ${match.label}`,
    `USED STORIES: ${usedStories.length?usedStories.join(', '):'none yet'}`,
    `COVERED DOMAINS: ${domains.length?domains.join(', '):'none yet'}`,
    `COVERED STRENGTHS: ${strengths.length?strengths.join(', '):'none yet'}`,
    selectedStory?`SELECTED STORY: ${selectedStory.label}\nStory ID: ${selectedStory.id}\nAlready used: ${selectedStory.reused?'yes':'no'}\nUse for: ${selectedStory.bestFor}\nResume facts: ${selectedStory.story}`:'SELECTED STORY: none — answer directly from resume or general technical knowledge without inventing experience.',
    context?`Recent conversation:\n${context}`:'',
    `Newest interviewer input: ${question}`
  ].filter(Boolean).join('\n\n');

  return fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
    method:'POST',
    headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({model,stream:true,max_tokens:depth==='deep'?420:280,messages:[{role:'system',content:SYSTEM},{role:'user',content:userContent}]})
  });
}

module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).send('Method not allowed');
  const{question,depth='simple',recentContext=[]}=req.body||{};
  if(!question||typeof question!=='string')return res.status(400).send('Question is required');

  const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!token)return res.status(500).send('AI_GATEWAY_API_KEY is missing from this deployment.');

  const usedStories=usedStoryIds(recentContext);
  const domains=coveredDomains(recentContext);
  const strengths=coveredStrengths(recentContext);
  const selectedStory=pickStory(question,recentContext);
  const match=resumeMatch(question,selectedStory);
  const chosenModel=chooseModel(depth);
  const models=[...new Set([chosenModel,chosenModel===SOL_FAST?LUNA_FAST:null,FREE_FALLBACK].filter(Boolean))];

  try{
    let upstream=null,selectedModel=null,selectedTier=null,lastError='No AI model was available.',lastStatus=502;
    for(const model of models){
      const attempt=await openGatewayStream({token,model,question,depth,recentContext,selectedStory,match,usedStories,domains,strengths});
      if(attempt.ok){upstream=attempt;selectedModel=model;selectedTier=model===SOL_FAST?'Sol Fast':model===LUNA_FAST?'Luna Fast':model.includes('-free')?'Free fallback':'Custom';break;}
      lastStatus=attempt.status;
      const text=await attempt.text();
      try{const parsed=JSON.parse(text);lastError=parsed?.error?.message||parsed?.message||text||lastError}catch{lastError=text||lastError}
      console.warn('Voice Coach model attempt failed:',model,attempt.status,lastError);
    }
    if(!upstream)return res.status(lastStatus).send(lastError);

    res.statusCode=200;
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    res.setHeader('Cache-Control','no-cache, no-transform');
    res.setHeader('X-Accel-Buffering','no');
    res.setHeader('X-Voice-Model',selectedModel);
    res.setHeader('X-Voice-Tier',`${selectedTier} • Resume ${match.level}`);
    res.setHeader('X-Resume-Profile','Kustomer TechOps only');
    res.setHeader('X-Resume-Match',match.level);
    res.setHeader('X-Used-Stories',String(usedStories.length));
    res.setHeader('X-Covered-Domains',String(domains.length));
    if(selectedStory){res.setHeader('X-Resume-Story',selectedStory.id);res.setHeader('X-Story-Fresh',selectedStory.reused?'no':'yes')}

    const reader=upstream.body.getReader();
    const decoder=new TextDecoder();
    let buffer='';
    while(true){
      const{done,value}=await reader.read();if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      const lines=buffer.split('\n');buffer=lines.pop()||'';
      for(const rawLine of lines){
        const line=rawLine.trim();if(!line.startsWith('data:'))continue;
        const payload=line.slice(5).trim();if(!payload||payload==='[DONE]')continue;
        try{const json=JSON.parse(payload);const delta=json?.choices?.[0]?.delta?.content;if(typeof delta==='string'&&delta)res.write(delta)}catch{}
      }
    }
    res.end();
  }catch(error){
    console.error('Voice Coach stream error:',error);
    if(!res.headersSent)return res.status(500).send(error?.message||'Streaming response failed');
    res.end();
  }
};
