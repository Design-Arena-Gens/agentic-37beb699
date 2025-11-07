"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  defaultPersona,
  type ConversationMessage,
  type PersonaConfig
} from "@/lib/replyEngine";
import { ChipInput } from "@/components/ChipInput";
import { ConversationPreview } from "@/components/ConversationPreview";
import { StatusDashboard } from "@/components/StatusDashboard";
import { ReasoningLog } from "@/components/ReasoningLog";

type ReplyMeta = {
  mood: string;
  matchedIntents: string[];
  escalationTriggered: boolean;
  usedSample?: string;
};

export default function HomePage() {
  const [config, setConfig] = useState<PersonaConfig>(() => defaultPersona());
  const [draftMessage, setDraftMessage] = useState(
    "Hey Alex, can we push our product sync to tomorrow afternoon? Need to know before tonight if possible."
  );
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [pendingReply, setPendingReply] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [meta, setMeta] = useState<ReplyMeta>({
    mood: config.tone,
    matchedIntents: [],
    escalationTriggered: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const headline = useMemo(
    () =>
      `${config.alias}'s WhatsApp auto twin`.replace(/\s+/g, " ").trim(),
    [config.alias]
  );

  const updateConfig = (next: Partial<PersonaConfig>) => {
    setConfig((prev) => ({ ...prev, ...next }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draftMessage.trim();
    if (!content) return;

    const incoming: ConversationMessage = {
      author: "contact",
      text: content,
      timestamp: Date.now()
    };

    const updatedHistory = [...history, incoming];
    setHistory(updatedHistory);
    setDraftMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          message: content,
          history: updatedHistory
        })
      });

      if (!response.ok) {
        throw new Error("Unable to craft reply");
      }

      const payload = (await response.json()) as {
        reply: string;
        reasoning: string[];
        meta: ReplyMeta;
      };

      setPendingReply(payload.reply);
      setHistory((prev) => [
        ...prev,
        {
          author: "agent",
          text: payload.reply,
          timestamp: Date.now() + 1
        }
      ]);
      setReasoning(payload.reasoning);
      setMeta(payload.meta);
    } catch (error) {
      console.error(error);
      setPendingReply(config.fallback);
      setReasoning([
        "API request failed, falling back to static response template."
      ]);
      setHistory((prev) => [
        ...prev,
        {
          author: "agent",
          text: config.fallback,
          timestamp: Date.now() + 1
        }
      ]);
      setMeta({
        mood: config.tone,
        matchedIntents: [],
        escalationTriggered: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetThread = () => {
    setHistory([]);
    setReasoning([]);
    setPendingReply(null);
    setMeta({
      mood: config.tone,
      matchedIntents: [],
      escalationTriggered: false
    });
  };

  return (
    <main className="app-shell">
      <header>
        <div className="pill">Away mode safeguard</div>
        <h1 style={{ marginBottom: "8px", color: "#0f172a" }}>{headline}</h1>
        <p style={{ color: "#475569", maxWidth: "720px" }}>
          Configure how your WhatsApp auto responder mirrors your tone whenever
          you're AFK. Tailor the voice, safety checks, and reasoning audit log
          so you stay in control while your twin keeps the thread alive.
        </p>
      </header>

      <section className="grid">
        <form className="panel" onSubmit={handleSubmit}>
          <h2>Persona DNA</h2>
          <p>Fine-tune how your auto twin sounds and what it promises.</p>
          <div className="input-group">
            <label htmlFor="alias">Display name</label>
            <input
              id="alias"
              value={config.alias}
              onChange={(event) => updateConfig({ alias: event.target.value })}
              placeholder="How should the agent refer to you?"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="persona">Voice overview</label>
            <textarea
              id="persona"
              className="small"
              value={config.persona}
              onChange={(event) =>
                updateConfig({ persona: event.target.value })
              }
              placeholder="Short description of how you usually text, priorities, and vibe."
            />
          </div>

          <div className="input-group">
            <label htmlFor="tone">Tone preset</label>
            <select
              id="tone"
              value={config.tone}
              onChange={(event) =>
                updateConfig({ tone: event.target.value as PersonaConfig["tone"] })
              }
            >
              <option value="warm">Warm & friendly</option>
              <option value="direct">Direct & concise</option>
              <option value="playful">Playful & upbeat</option>
              <option value="professional">Professional & calm</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="availability">Reply window</label>
            <input
              id="availability"
              value={config.availability}
              onChange={(event) =>
                updateConfig({ availability: event.target.value })
              }
            />
          </div>

          <ChipInput
            label="Signature phrases"
            items={config.samplePhrases}
            onChange={(items) => updateConfig({ samplePhrases: items })}
            placeholder="e.g. I'll circle back before EOD"
          />

          <ChipInput
            label="Escalation triggers"
            items={config.escalateKeywords}
            onChange={(items) => updateConfig({ escalateKeywords: items })}
            placeholder="urgent"
          />

          <div className="input-group">
            <label htmlFor="autointro">Intro line</label>
            <textarea
              id="autointro"
              className="small"
              value={config.autoIntro}
              onChange={(event) =>
                updateConfig({ autoIntro: event.target.value })
              }
              placeholder="Explain why the auto twin is replying."
            />
          </div>

          <div className="input-group">
            <label htmlFor="fallback">Fallback answer</label>
            <textarea
              id="fallback"
              className="small"
              value={config.fallback}
              onChange={(event) =>
                updateConfig({ fallback: event.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label htmlFor="delay">Manual follow-up (minutes)</label>
            <input
              type="number"
              id="delay"
              min={5}
              value={config.responseDelayMinutes}
              onChange={(event) =>
                updateConfig({
                  responseDelayMinutes: Number.parseInt(event.target.value, 10)
                })
              }
            />
          </div>

          <div className="divider" />

          <h2>Simulate incoming ping</h2>
          <textarea
            className="small"
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            placeholder="Paste the latest WhatsApp message here..."
          />

          <button type="submit" className="primary">
            Generate reply
          </button>
          <button
            type="button"
            style={{ alignSelf: "flex-start", marginTop: "8px" }}
            onClick={handleResetThread}
          >
            Reset thread
          </button>
        </form>

        <div className="panel" style={{ gap: "24px" }}>
          <h2>Conversation preview</h2>
          <ConversationPreview
            messages={history}
            pendingReply={pendingReply ?? undefined}
            isLoading={isLoading}
          />
          <div className="divider" />
          <StatusDashboard
            nextWindow={config.availability}
            avgDelayMinutes={config.responseDelayMinutes}
            escalation={meta.escalationTriggered}
            intents={meta.matchedIntents}
          />
          {meta.usedSample && (
            <div className="pill" style={{ alignSelf: "flex-start" }}>
              Sample phrase reused: {meta.usedSample}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Audit trail</h2>
        <p>
          Every auto reply explains itself so you can trust the tone and
          commitments before letting it ship live.
        </p>
        <ReasoningLog items={reasoning} />
      </section>

      <section className="panel">
        <h2>Hook it to WhatsApp</h2>
        <p>
          Deploy this Next.js app, then connect the `/api/respond` endpoint to
          WhatsApp Cloud API or Twilio&apos;s WhatsApp sandbox. Point your
          webhook to <code>/api/respond</code>, transform incoming payloads into
          the request schema, and forward the generated reply back through the
          provider&apos;s send API.
        </p>
        <div className="divider" />
        <div className="phase-grid">
          <div className="phase-card">
            <strong>1. Register webhook</strong>
            <span>Meta Developers → WhatsApp Cloud → configure callback.</span>
          </div>
          <div className="phase-card">
            <strong>2. Map payload</strong>
            <span>
              Normalize sender, message body, inject your persona config.
            </span>
          </div>
          <div className="phase-card">
            <strong>3. Relay response</strong>
            <span>Use the send message API to post the auto reply.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
