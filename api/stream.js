const SYSTEM = `You are Voice Coach, an elite practice assistant for technical interview practice.

PRIMARY GOAL
Give the simplest spoken answer that proves experienced understanding. Sound like a capable coworker, not a textbook, chatbot, or memorized script.

BEHAVIOR
- Answer the newest interviewer input directly, including follow-ups, corrections, challenges, small talk, scheduling, role/company discussion, and behavioral questions.
- Default SAY THIS length: roughly 15-30 seconds spoken. Expand only when the question genuinely needs it or depth requests it.
- Lead with the answer. Do not ramble, over-qualify, or dump technical detail before it is needed.
- Use technical terminology only when it improves clarity.
- Never invent direct experience, employers, projects, metrics, tools used in production, or responsibilities. If exact experience is unknown, say so naturally and bridge from transferable fundamentals.
- For troubleshooting use: scope -> impact -> recent change -> evidence -> isolate -> safest useful fix -> verify.
- For behavioral answers use: context -> action -> reasoning -> result, briefly.
- For security-sensitive scenarios prioritize identity verification, least privilege, device trust, auditability, and safe escalation.
- For urgent/executive support restore productivity safely first, then investigate root cause.
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

function chooseModel(question, depth) {
  if (process.env.VOICE_COACH_MODEL) return { model: process.env.VOICE_COACH_MODEL, tier: 'custom' };
  if (depth === 'deep') return { model: SOL_FAST, tier: 'sol-fast' };

  const q = question.toLowerCase();
  let score = depth === 'technical' ? 1 : 0;
  if (question.length > 260) score += 1;
  const hard = /(architecture|design a|designing|trade-?off|root cause|security incident|company[- ]wide|multiple systems|integration|api\b|webhook|saml|scim|conditional access|certificate|network segmentation|packet capture|automation|automate|script|powershell|bash|python|migration|migrate|scale|high availability|disaster recovery|conflicting evidence|logs.*contradict|zero trust)/i;
  if (hard.test(q)) score += 2;
  return score >= 3 ? { model: SOL_FAST, tier: 'sol-fast' } : { model: LUNA_FAST, tier: 'luna-fast' };
}

function compactContext(input) {
  if (!Array.isArray(input)) return '';
  return input.slice(-4).map((x, i) => {
    const q = String(x?.question || '').slice(0, 500);
    const a = String(x?.answer || '').slice(0, 700);
    return `${i + 1}. Interviewer: ${q}\nCandidate: ${a}`;
  }).filter(Boolean).join('\n');
}

async function openGatewayStream({ token, model, question, role, depth, recentContext }) {
  const context = compactContext(recentContext);
  const userContent = [
    `Target role: ${role}`,
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
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userContent }
      ]
    })
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { question, role = 'General IT / TechOps', depth = 'simple', recentContext = [] } = req.body || {};
  if (!question || typeof question !== 'string') return res.status(400).send('Question is required');

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) return res.status(500).send('AI_GATEWAY_API_KEY is missing from this deployment.');

  const chosen = chooseModel(question, depth);
  const models = [...new Set([
    chosen.model,
    chosen.model === SOL_FAST ? LUNA_FAST : null,
    FREE_FALLBACK
  ].filter(Boolean))];

  try {
    let upstream = null;
    let selectedModel = null;
    let selectedTier = null;
    let lastError = 'No AI model was available.';
    let lastStatus = 502;

    for (const model of models) {
      const attempt = await openGatewayStream({ token, model, question, role, depth, recentContext });
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
