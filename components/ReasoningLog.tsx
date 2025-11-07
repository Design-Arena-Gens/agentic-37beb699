interface ReasoningLogProps {
  items: string[];
}

export function ReasoningLog({ items }: ReasoningLogProps) {
  if (!items.length) {
    return (
      <div className="log">
        Awaiting first message. Reasoning steps will appear here to explain how
        the auto twin shaped its reply.
      </div>
    );
  }

  return (
    <div className="log">
      {items.map((item, index) => (
        <div key={`${item}-${index}`}>• {item}</div>
      ))}
    </div>
  );
}
