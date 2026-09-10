import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import OpenAI from 'openai';
import { ResponsesWS } from 'openai/resources/responses/ws';

const MODEL = process.env.VOICE_COACH_REALTIME_MODEL || 'openai/gpt-5.6-luna';

const INSTRUCTIONS = `You are the live answer engine for a D. E. Shaw Systems Administrator interview coach for Ricardo Flores.

Speak peer-to-peer, like two experienced systems administrators who have both done this work for years. Think like a strong operator and explain in plain, operational language. Never sound like a certification textbook, glossary, vendor documentation, or someone teaching a beginner.

If the interviewer asks a technical question, be technical enough to prove competence. Include the commands, ports, logs, services, dependencies, permissions, policies, paths, or protocol details that actually matter. But keep the wording simple, direct, and natural. Explain what each technical detail tells you and how it changes the next move; do not dump facts or commands just to sound technical.

Use this troubleshooting mindset when relevant: scope -> impact -> evidence -> isolate the failing layer -> safest useful action -> verify -> root cause/prevention. In urgent situations, separate restoring productivity from root-cause investigation.

Direct work-experience claims must stay within these resume facts only:
- 7 years supporting Windows/Mac endpoints, Windows Server, Microsoft 365, Active Directory, networking, business applications, escalation, endpoint compliance, patching, infrastructure maintenance, documentation, and on-call support.
- Integris Systems Administrator: primary on-site admin for about 350 users; Windows Server, AD, GPO, DNS, DHCP, file shares, security groups/permissions, print services, M365/Entra, MFA/conditional access, Intune, networking; patch compliance 84% to 97%; recurring incidents reduced 25%; led 200-device refresh; engineering/SOC/NOC escalations; weekly on-call.
- Skadden Junior Systems Administrator: about 500 employees; AD, groups/OUs/password policy/shared folders/mapped drives/M365; Windows Server patching, service checks, Event Logs, disk capacity, backup verification; DNS/DHCP/VPN/Wi-Fi/authentication/remote-access troubleshooting; infra projects and escalations.
- Maimonides IT Support Specialist: L1/L2 for 250+ employees; Windows, printers/scanners/mobile/Office/Outlook/VPN/business apps; AD/M365 provisioning/access/offboarding; hardware/software/authentication/wireless/network troubleshooting; assisted with server patching, backup checks, app deployment and infrastructure maintenance.
Never invent unsupported employers, incidents, technologies, projects, or metrics.

Style:
- Start with the answer, not a heading.
- Simple follow-up: 1-2 sentences.
- Normal technical question: 2-4 sentences.
- Scenario: 3-5 concise sentences.
- Behavioral: compact context -> action -> reasoning -> result, using only resume facts.
- Lead with what you would check/do first and why.
- Assume the interviewer understands normal IT terminology; do not define basics unless asked.
- Technical depth may increase, but the voice never changes: always calm, concise, peer-to-peer, and practical.
- Leave room for follow-up instead of over-explaining.`;

function safeSend(ws, obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function buildInput(question, depth) {
  const depthText = depth === 'deep'
    ? 'Deep mode: reason further and include meaningful technical detail and tradeoffs, but keep the same experienced peer-to-peer voice.'
    : depth === 'technical'
      ? 'Technical mode: include the technical detail needed to prove competence, but keep the same plainspoken experienced-admin tone.'
      : 'Turbo simple: keep this concise and operational. If the question is technical, still include the key technical details needed for a correct answer; simple means clear and short, not shallow.';
  return `${depthText}\n\nInterviewer question:\n${question}`;
}

const server = createServer((req, res) => {
  res.writeHead(426, { 'Content-Type': 'text/plain' });
  res.end('Upgrade Required');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (browser) => {
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    safeSend(browser, { type: 'fatal', error: 'AI gateway token missing' });
    browser.close();
    return;
  }

  const client = new OpenAI({ apiKey: token, baseURL: 'https://ai-gateway.vercel.sh/v1' });
  const ai = new ResponsesWS(client, {
    headers: { 'OpenAI-Beta': 'responses_websockets=2026-02-06' },
  });

  let lastCompletedResponseId = null;
  let activeResponseId = null;
  let activeQuestion = '';
  let activeDepth = 'simple';
  let connectedAt = Date.now();
  let pendingAfterActive = null;

  const fail = (message) => safeSend(browser, { type: 'ai.error', error: String(message || 'AI WebSocket error') });

  function createResponse(question, depth) {
    activeQuestion = question;
    activeDepth = depth;
    const payload = {
      type: 'response.create',
      model: MODEL,
      instructions: INSTRUCTIONS,
      input: buildInput(question, depth),
      stream: true,
    };
    if (lastCompletedResponseId) payload.previous_response_id = lastCompletedResponseId;
    ai.send(payload);
  }

  function steerActive(question, depth) {
    if (!activeResponseId) return false;
    activeQuestion = question;
    activeDepth = depth;
    try {
      ai.send({
        type: 'response.steer',
        previous_response_id: activeResponseId,
        input: buildInput(question, depth),
      });
      safeSend(browser, { type: 'ai.steer.sent', responseId: activeResponseId, question });
      return true;
    } catch (e) {
      fail(e?.message || e);
      return false;
    }
  }

  ai.on('error', (err) => fail(err?.message || err));
  ai.on('response.created', (event) => {
    activeResponseId = event.response?.id || null;
    safeSend(browser, { type: 'ai.created', responseId: activeResponseId, question: activeQuestion, connectedMs: Date.now() - connectedAt });
  });
  ai.on('response.output_text.delta', (event) => {
    safeSend(browser, { type: 'ai.delta', delta: event.delta || '', responseId: activeResponseId });
  });
  ai.on('response.output_text.done', () => {
    safeSend(browser, { type: 'ai.text_done', responseId: activeResponseId });
  });
  ai.on('event', (event) => {
    if (event.type === 'response.completed') {
      const id = event.response?.id || activeResponseId;
      if (id) lastCompletedResponseId = id;
      safeSend(browser, { type: 'ai.done', responseId: id, status: 'completed' });
      activeResponseId = null;
      activeQuestion = '';
      if (pendingAfterActive) {
        const next = pendingAfterActive;
        pendingAfterActive = null;
        createResponse(next.question, next.depth);
      }
    } else if (event.type === 'response.incomplete' || event.type === 'response.failed') {
      const error = event.response?.error || event.response?.incomplete_details || event.type;
      safeSend(browser, { type: 'ai.error', responseId: event.response?.id || activeResponseId, error: typeof error === 'string' ? error : JSON.stringify(error) });
      activeResponseId = null;
      activeQuestion = '';
      if (pendingAfterActive) {
        const next = pendingAfterActive;
        pendingAfterActive = null;
        createResponse(next.question, next.depth);
      }
    } else if (event.type === 'response.steer.accepted') {
      safeSend(browser, { type: 'ai.steer.accepted', responseId: activeResponseId });
    } else if (event.type === 'response.steer.failed') {
      safeSend(browser, { type: 'ai.steer.failed', responseId: activeResponseId, error: event.error || null });
      if (activeQuestion) pendingAfterActive = { question: activeQuestion, depth: activeDepth };
    }
  });

  safeSend(browser, { type: 'bridge.ready', model: MODEL });

  browser.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.type === 'ping') {
      safeSend(browser, { type: 'pong', t: msg.t || Date.now() });
      return;
    }
    const question = String(msg.question || '').trim();
    if (!question) return;
    const depth = ['simple', 'technical', 'deep'].includes(msg.depth) ? msg.depth : 'simple';

    if (activeResponseId) {
      if (!steerActive(question, depth)) pendingAfterActive = { question, depth };
      return;
    }

    createResponse(question, depth);
  });

  browser.on('close', () => {
    try { ai.close(); } catch {}
  });
  browser.on('error', () => {
    try { ai.close(); } catch {}
  });
});

export default server;
