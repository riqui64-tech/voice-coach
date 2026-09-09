import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import OpenAI from 'openai';
import { ResponsesWS } from 'openai/resources/responses/ws';

const MODEL = process.env.VOICE_COACH_REALTIME_MODEL || 'openai/gpt-5.6-luna';

const INSTRUCTIONS = `You are the live answer engine for a D. E. Shaw Systems Administrator interview coach for Ricardo Flores.

Answer as an experienced systems administrator speaking naturally to an interviewer. Think like a strong operator, but explain like an experienced coworker talking to another competent coworker. Never sound like a certification textbook, glossary, or vendor documentation.

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
- Mention commands/protocol details only when they add value.
- Leave room for follow-up instead of over-explaining.`;

function safeSend(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function buildInput(question, depth) {
  const depthText = depth === 'deep' ? 'Give a deeper but still concise answer.' : depth === 'technical' ? 'Include slightly more technical depth.' : 'Keep this very concise and fast.';
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

  const fail = (message) => safeSend(browser, { type: 'ai.error', error: String(message || 'AI WebSocket error') });

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
    } else if (event.type === 'response.incomplete' || event.type === 'response.failed') {
      safeSend(browser, { type: 'ai.done', responseId: event.response?.id || activeResponseId, status: event.type, error: event.response?.error || event.response?.incomplete_details || null });
      activeResponseId = null;
      activeQuestion = '';
    } else if (event.type === 'response.steer.accepted') {
      safeSend(browser, { type: 'ai.steer.accepted', responseId: activeResponseId });
    } else if (event.type === 'response.steer.failed') {
      safeSend(browser, { type: 'ai.steer.failed', responseId: activeResponseId, error: event.error || null });
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

    if (msg.type === 'steer' && activeResponseId) {
      activeQuestion = question;
      activeDepth = depth;
      ai.send({
        type: 'response.steer',
        previous_response_id: activeResponseId,
        input: buildInput(question, depth),
      });
      return;
    }

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
  });

  browser.on('close', () => {
    try { ai.close(); } catch {}
  });
  browser.on('error', () => {
    try { ai.close(); } catch {}
  });
});

export default server;
