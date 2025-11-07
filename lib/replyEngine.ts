export type TonePreset = "warm" | "direct" | "playful" | "professional";

export interface PersonaConfig {
  alias: string;
  persona: string;
  tone: TonePreset;
  availability: string;
  signature: string;
  fallback: string;
  samplePhrases: string[];
  escalateKeywords: string[];
  responseDelayMinutes: number;
  autoIntro: string;
}

export type Author = "contact" | "agent";

export interface ConversationMessage {
  author: Author;
  text: string;
  timestamp: number;
}

export interface ReplyResult {
  reply: string;
  reasoning: string[];
  meta: {
    mood: string;
    matchedIntents: string[];
    escalationTriggered: boolean;
    usedSample?: string;
  };
}

const TONE_TEMPLATES: Record<
  TonePreset,
  {
    opener: string;
    acknowledgement: string;
    assurance: string;
    closer: string;
  }
> = {
  warm: {
    opener: "Hey",
    acknowledgement: "Thanks so much for the message.",
    assurance: "I'm heads-down right now but didn't want to leave you hanging.",
    closer: "Appreciate you!"
  },
  direct: {
    opener: "Hi",
    acknowledgement: "Got your note.",
    assurance: "Unavailable at the moment, looping back as soon as I can.",
    closer: "Talk soon."
  },
  playful: {
    opener: "Heey 👋",
    acknowledgement: "I see you sliding into my chats.",
    assurance: "Currently away from WhatsApp but I promise I'll bounce back ASAP.",
    closer: "Hold it down till then!"
  },
  professional: {
    opener: "Hello",
    acknowledgement: "Thank you for reaching out.",
    assurance:
      "I'm in focus mode away from WhatsApp but I will review this shortly.",
    closer: "Best regards."
  }
};

const INTENT_KEYWORDS: Record<string, string[]> = {
  greeting: ["hey", "hello", "hi", "good morning", "good evening"],
  urgency: ["urgent", "asap", "immediately", "right now", "emergency"],
  scheduling: ["meeting", "schedule", "call", "calendar", "book"],
  followUp: ["any update", "checking in", "follow up", "reminder"],
  gratitude: ["thanks", "thank you", "appreciate"],
  delivery: ["send", "deliver", "ready", "finished"],
  social: ["coffee", "drink", "hang", "party", "dinner"]
};

const SLOT_KEYWORDS: Record<string, string[]> = {
  morning: ["morning", "am"],
  afternoon: ["afternoon", "pm"],
  evening: ["evening", "tonight"],
  weekend: ["saturday", "sunday", "weekend"]
};

export function defaultPersona(): PersonaConfig {
  return {
    alias: "Alex",
    persona:
      "Product-minded designer, upbeat and reliable friend who keeps things clear and kind.",
    tone: "warm",
    availability: "Weekdays 09:00-18:00 (GMT)",
    signature: "- Alex",
    fallback: "I'll circle back with a thoughtful reply as soon as I'm back online.",
    samplePhrases: [
      "appreciate you being patient",
      "I'll loop back with details before the day ends",
      "feel free to drop anything else here"
    ],
    escalateKeywords: ["urgent", "deadline", "emergency", "production"],
    responseDelayMinutes: 45,
    autoIntro:
      "I'm in focus mode away from WhatsApp right now, so you are chatting with my auto-responder twin."
  };
}

export function detectIntents(message: string): string[] {
  const normalized = message.toLowerCase();
  const intents = new Set<string>();

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      intents.add(intent);
    }
  }

  if (normalized.includes("?")) {
    intents.add("question");
  }

  if (normalized.split(/\s+/).length <= 3) {
    intents.add("shortPing");
  }

  return Array.from(intents);
}

function detectTimeHints(message: string): string | undefined {
  const normalized = message.toLowerCase();
  for (const [slot, keywords] of Object.entries(SLOT_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return slot;
    }
  }
  return undefined;
}

function pickSamplePhrase(phrases: string[], intents: string[]): string | null {
  if (!phrases.length) return null;
  const normalized = intents.join(" ");

  const targeted = phrases.find((phrase) => {
    const sanitized = phrase.toLowerCase();
    return sanitized.split(/\s+/).some((word) => normalized.includes(word));
  });

  if (targeted) {
    return targeted;
  }

  return phrases[0];
}

function shouldSendIntro(history: ConversationMessage[]): boolean {
  if (!history.length) return true;
  return !history.some(
    (entry) =>
      entry.author === "agent" &&
      entry.text.toLowerCase().includes("auto-responder")
  );
}

type ReplyContext = {
  intents: string[];
  urgencyMentioned: boolean;
  samplePhrase: string | null;
  timeHint?: string;
};

function buildContext(
  config: PersonaConfig,
  message: string
): ReplyContext {
  const intents = detectIntents(message);
  const urgencyMentioned = config.escalateKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword.toLowerCase())
  );

  const samplePhrase = pickSamplePhrase(config.samplePhrases, intents);
  const timeHint = detectTimeHints(message);

  return { intents, urgencyMentioned, samplePhrase, timeHint };
}

export function generateReply(
  config: PersonaConfig,
  message: string,
  history: ConversationMessage[]
): ReplyResult {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      reply: config.fallback,
      reasoning: ["Incoming message was empty, using fallback response."],
      meta: {
        mood: config.tone,
        matchedIntents: [],
        escalationTriggered: false
      }
    };
  }

  const context = buildContext(config, trimmed);
  const template = TONE_TEMPLATES[config.tone];
  const reasoning: string[] = [];

  reasoning.push(`Tone preset: ${config.tone}`);

  if (context.intents.length) {
    reasoning.push(`Detected intents: ${context.intents.join(", ")}`);
  } else {
    reasoning.push("No explicit intent detected, relying on fallback tone.");
  }

  if (context.urgencyMentioned) {
    reasoning.push("Escalation keywords detected, adding prioritisation line.");
  }

  if (context.samplePhrase) {
    reasoning.push(`Reinforcing familiarity via sample phrase "${context.samplePhrase}".`);
  }

  if (context.timeHint) {
    reasoning.push(`Recipient referenced ${context.timeHint}, mirroring in reply.`);
  }

  const parts: string[] = [];

  if (shouldSendIntro(history)) {
    parts.push(config.autoIntro);
  }

  parts.push(
    `${template.opener}! ${template.acknowledgement} ${template.assurance}`
  );

  if (context.intents.includes("scheduling")) {
    parts.push(
      `If this is about timing, I'm back online around ${config.availability}.`
    );
  } else {
    parts.push(`My next reply window is ${config.availability}.`);
  }

  if (context.timeHint) {
    const mirrorMap: Record<string, string> = {
      morning: "tomorrow morning",
      afternoon: "this afternoon",
      evening: "this evening",
      weekend: "over the weekend"
    };
    parts.push(`I'll aim to follow up ${mirrorMap[context.timeHint] ?? "soon"}.`);
  }

  if (context.urgencyMentioned) {
    parts.push(
      "Flagged as priority — I'll jump back in ahead of schedule or call if needed."
    );
  }

  if (context.samplePhrase) {
    parts.push(context.samplePhrase);
  }

  parts.push(template.closer);

  const reply = `${parts.join(" ")} ${config.signature}`.trim();

  return {
    reply,
    reasoning,
    meta: {
      mood: config.tone,
      matchedIntents: context.intents,
      escalationTriggered: context.urgencyMentioned,
      usedSample: context.samplePhrase ?? undefined
    }
  };
}
