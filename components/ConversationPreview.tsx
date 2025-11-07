import type { ConversationMessage } from "@/lib/replyEngine";
import clsx from "clsx";

interface ConversationPreviewProps {
  messages: ConversationMessage[];
  pendingReply?: string;
  isLoading?: boolean;
}

export function ConversationPreview({
  messages,
  pendingReply,
  isLoading = false
}: ConversationPreviewProps) {
  return (
    <div className="transcript" aria-live="polite">
      {messages.map((message) => (
        <div
          key={message.timestamp}
          className={clsx("message", {
            incoming: message.author === "contact",
            outgoing: message.author === "agent"
          })}
        >
          <span>{message.text}</span>
          <span
            className="badge"
            style={{ alignSelf: "flex-end", marginTop: "6px" }}
          >
            {message.author === "contact" ? "Contact" : "Auto Twin"}
          </span>
        </div>
      ))}

      {isLoading && (
        <div className="message outgoing">
          <span>Typing…</span>
        </div>
      )}

      {pendingReply && !isLoading && (
        <div className="message outgoing">
          <span>{pendingReply}</span>
          <span className="badge" style={{ alignSelf: "flex-end" }}>
            Auto Twin
          </span>
        </div>
      )}

      {!messages.length && !pendingReply && (
        <div
          className="message incoming"
          style={{ background: "rgba(14,165,233,0.08)", color: "#0f172a" }}
        >
          <strong>Preview</strong>
          <span>
            Incoming messages will show up here. Hit "Generate reply" to see
            what your auto twin would send back.
          </span>
        </div>
      )}
    </div>
  );
}
