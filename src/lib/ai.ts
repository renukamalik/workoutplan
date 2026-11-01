import { cleanPlan, type PlanData } from './plan';

// Which AI is used: Google Gemini (free key from Google AI Studio) or Anthropic Claude (paid). GitHub's free model service was retired on 30 July 2026.
const provider = (): 'gemini' | 'anthropic' | null => {
  const want = (process.env.AI_PROVIDER || '').toLowerCase();
  if (want === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (want === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
};
export const aiReady = () => provider() !== null;
// Free AI services may use what you send to improve their products, so a client's health notes are only sent to a paid provider, or when you set AI_SHARE_HEALTH=true.
export const sendsHealthNotes = () => provider() === 'anthropic' || process.env.AI_SHARE_HEALTH === 'true';

async function ask(system: string, user: string, maxTokens: number, json = false): Promise<string> {
  const pv = provider();
  if (!pv) throw new Error('AI is not set up yet. Add GEMINI_API_KEY on Render (free key from aistudio.google.com).');
  if (pv === 'gemini') return gemini(system, user, maxTokens, json);
  return claude(system, user, maxTokens);
}

async function gemini(system: string, user: string, maxTokens: number, json: boolean): Promise<string> {
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const res = await fetch(`${process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'}/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY as string, 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: Math.max(maxTokens, 8192), temperature: 0.6, ...(json ? { responseMimeType: 'application/json' } : {}) },
    }),
  });
  if (!res.ok) {
    if (res.status === 400 || res.status === 403) throw new Error('The Gemini key was rejected. Check GEMINI_API_KEY on Render.');
    if (res.status === 404) throw new Error('That Gemini model name is not available. Set GEMINI_MODEL on Render to a current model from aistudio.google.com.');
    if (res.status === 429) throw new Error('The free AI limit was reached. Wait a minute (or until tomorrow) and try again.');
    throw new Error(`The AI could not answer (${res.status}).`);
  }
  const j: any = await res.json();
  const text = (j.candidates?.[0]?.content?.parts || []).map((x: any) => x.text || '').join('').trim();
  if (!text) throw new Error('The AI returned nothing. Try again.');
  return text;
}

async function claude(system: string, user: string, maxTokens: number): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY as string;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('The Claude API key was rejected. Check ANTHROPIC_API_KEY on Render.');
    if (res.status === 429) throw new Error('Claude is busy right now. Try again in a minute.');
    throw new Error(`Claude could not answer (${res.status}).`);
  }
  const j: any = await res.json();
  return (j.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim();
}

function parseJson(text: string): any {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b < 0) throw new Error('The AI did not return a plan. Try again.');
  return JSON.parse(text.slice(a, b + 1));
}

const SCHEMA = `Return ONLY valid JSON, no commentary, in this exact shape:
{"title": string, "week": "1 of 4", "phase": string, "days": [{"name": string (e.g. "Monday" or "Opener"), "tag": string (e.g. "Lower A"), "focus": string (one line), "note": string (progression note, may be empty), "items": [{"name": string, "tag": string (muscle or purpose), "sets": string (a range like "1-3"), "reps": string (a range like "8-12"), "rest": string (like "60s"), "cue": string (one or two plain sentences), "video": ""}]}]}`;

const COACH_RULES = `You are writing a plan for Renuka, a fitness and nutrition coach whose clients are women aged 40 and above in Delhi NCR, India. Write in simple, warm, plain English.
Rules you must follow:
- Strength goal first. Train each muscle group twice per week. Keep similar muscle groups together on the same day. Remove anything extra: no filler exercises.
- Every exercise has a sets range and a reps range, and a rest time. Never a single fixed number.
- Include an "Opener" day block (about 8 minutes: breathing, neck, hip activation) that the client does before every strength day.
- Include hip and shoulder mobility on training days (for example hip 90/90, quadruped knee circles, hip airplane, shoulder dislocates with a band, shoulder internal and external rotation).
- Use equipment a woman can find at home or in a basic gym: dumbbells, resistance bands, a chair, a wall, a mat.
- Respect the client's notes. If she has back or sciatic pain that is worse bending forward, use a supported hip hinge with a small range, avoid loaded forward bending and avoid deep spinal flexion. If there is a pelvic or endometriosis history, avoid heavy bracing and breath-holding and keep core work gentle.
- Do not diagnose or promise medical outcomes. Do not mention hormone therapy.
- Leave "video" as an empty string.`;

export type ClientBrief = { age?: number | null; goal: string; health: string; kind: string; notes: string; days: number };

export async function generatePlan(b: ClientBrief): Promise<{ title: string; data: PlanData }> {
  const user = `Create a ${b.kind === 'quarterly' ? 'first-month block of a quarterly (3 month)' : 'monthly (4 week)'} plan.
Training days per week: ${b.days}.
Client age: ${b.age ?? 'not given'}. Goal: ${b.goal}.
Client notes: ${b.health || 'none'}.
Coach's extra instructions: ${b.notes || 'none'}.
Start with the Opener block, then ${b.days} training days named Monday to Friday style as needed, each with a tag and focus.
${SCHEMA}`;
  const j = parseJson(await ask(COACH_RULES, user, 9000, true));
  const data = cleanPlan(j);
  if (!data.days.length) throw new Error('The AI returned an empty plan. Try again.');
  return { title: String(j.title || 'Strength plan').slice(0, 120), data };
}

export async function revisePlan(current: PlanData, instruction: string): Promise<PlanData> {
  const user = `Here is the current plan as JSON:\n${JSON.stringify(current)}\n\nChange it as the coach asks, and keep everything else the same. Coach's request: ${instruction}\n${SCHEMA}`;
  const j = parseJson(await ask(COACH_RULES, user, 9000, true));
  const data = cleanPlan({ ...j, week: j.week || current.week, phase: j.phase || current.phase });
  if (!data.days.length) throw new Error('The AI returned an empty plan. Try again.');
  return data;
}

export async function weeklyBriefing(facts: unknown): Promise<string> {
  const system = `You are the assistant to Renuka, a fitness and nutrition coach for women aged 40+ in Delhi NCR. Write a short weekly briefing from the facts you are given. Use plain English. Start with the one thing that matters most this week, then up to five short bullet points with clear actions (who to message, who is due a renewal, who to check on). Do not diagnose anyone. Do not invent facts that are not in the data. Under 180 words.`;
  return ask(system, `Facts as JSON:\n${JSON.stringify(facts)}`, 700);
}
