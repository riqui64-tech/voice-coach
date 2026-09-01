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
This Kustomer TechOps resume is the only resume you may use. Do not use or reference any D. E. Shaw, Integris, Skadden, D365, Murex, or other resume/profile unless the interviewer asks a general knowledge question that does not require claiming personal experience. Never invent experience outside the resume above. Distinguish direct resume experience from general technical knowledge.`;

const SYSTEM = `You are Voice Coach, an elite practice assistant for a Kustomer TechOps interview.

${KUSTOMER_RESUME}

PRIMARY GOAL
Give the fastest useful spoken answer that proves experienced understanding while staying fully grounded in the Kustomer TechOps resume above. Sound like a capable coworker, not a textbook, chatbot, or memorized script.

RESUME GROUNDING
- For experience questions, use only facts supported by KUSTOMER_RESUME.
- Prefer the closest relevant resume example instead of generic filler.
- If the interviewer asks about a technology not listed in the resume, do not imply production ownership. Say the exact experience is not on the resume, then bridge from closely related fundamentals and explain the approach.
- Do not mention employer/resume details unless they naturally strengthen the answer.
- Never fabricate metrics, project scope, incidents, responsibilities, tools, employers, or outcomes.

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
- If the interviewer corrects the premise, accept the correction and answer the corrected question.
- Recent conversation context is context only. Do not repeat earlier answers unless the newest question requires it.

OUTPUT FORMAT — EXACTLY
Start immediately with the candidate's spoken answer. Do not write a heading before it.
Then output this exact delimiter on its own line:
<<<DETAILS_JSON>>>
Then output one compact valid JSON object with exactly these keys:
{"thoughtProcess":"short string","testing":"short string","technical":["max 5 short points"],"followUp":"short string","stopHere":true}

Do not use markdown fences. Do not output anything after the JSON.`;

const LUNA_FAST = 'openai/gpt-5.6-luna-fast';
const SOL_FAST = 'openai/gpt-5.6-sol-fast';
const FREE_FALLBACK = 'minimax/minimax-m2.7-free';

function chooseModel(depth) {
  if (process.env.VOICE_COACH_MODEL) return process.env.VOICE_COACH_MODEL;
  return depth === 'deep' ? SOL_FAST : LUNA_FAST;
}

function compactContext(input) {
  if (!Array.isArray(input)) return '';
  return input.slice(-4).map((x, i) => {
    const q = String(x?.question || '').slice(0, 420);
    const a = String(x?.answer || '').slice(0, 520);
    return `${i + 1}. Interviewer: ${q}\nCandidate: ${a}`;
  }).filter(Boolean).join('\n');
}

async function openGatewayStream({ token, model, question, depth, recentContext }) {
  const context = compactContext(recentContext);
  const userContent = [
    'Target role: Kustomer TechOps',
    `Requested depth: ${depth}`,
    context ? `Recent conversation:\n${context}` : '',
    `Newest interviewer input: ${question}`
  ].filter(Boolean).join('\n\n');

  return fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: depth === 'deep' ? 420 : 280,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userContent }
      ]
    })
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { question, depth = 'simple', recentContext = [] } = req.body || {};
  if (!question || typeof question !== 'string') return res.status(400).send('Question is required');

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) return res.status(500).send('AI_GATEWAY_API_KEY is missing from this deployment.');

  const chosenModel = chooseModel(depth);
  const models = [...new Set([
    chosenModel,
    chosenModel === SOL_FAST ? LUNA_FAST : null,
    FREE_FALLBACK
  ].filter(Boolean))];

  try {
    let upstream = null;
    let selectedModel = null;
    let selectedTier = null;
    let lastError = 'No AI model was available.';
    let lastStatus = 502;

    for (const model of models) {
      const attempt = await openGatewayStream({ token, model, question, depth, recentContext });
      if (attempt.ok) {
        upstream = attempt;
        selectedModel = model;
        selectedTier = model === SOL_FAST ? 'Sol Fast' : model === LUNA_FAST ? 'Luna Fast' : model.includes('-free') ? 'Free fallback' : 'Custom';
        break;
      }

      lastStatus = attempt.status;
      const text = await attempt.text();
      try {
        const parsed = JSON.parse(text);
        lastError = parsed?.error?.message || parsed?.message || text || lastError;
      } catch {
        lastError = text || lastError;
      }
      console.warn('Voice Coach model attempt failed:', model, attempt.status, lastError);
    }

    if (!upstream) return res.status(lastStatus).send(lastError);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Voice-Model', selectedModel);
    res.setHeader('X-Voice-Tier', selectedTier);
    res.setHeader('X-Resume-Profile', 'Kustomer TechOps only');

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) res.write(delta);
        } catch {}
      }
    }

    res.end();
  } catch (error) {
    console.error('Voice Coach stream error:', error);
    if (!res.headersSent) return res.status(500).send(error?.message || 'Streaming response failed');
    res.end();
  }
};
