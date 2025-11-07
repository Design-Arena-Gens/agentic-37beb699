interface StatusDashboardProps {
  nextWindow: string;
  avgDelayMinutes: number;
  escalation: boolean;
  intents: string[];
}

export function StatusDashboard({
  nextWindow,
  avgDelayMinutes,
  escalation,
  intents
}: StatusDashboardProps) {
  return (
    <div className="status-grid">
      <div className="status-card">
        <h3>Next manual window</h3>
        <span>{nextWindow}</span>
      </div>
      <div className="status-card">
        <h3>Auto-reply delay</h3>
        <span>{avgDelayMinutes} min</span>
      </div>
      <div className="status-card">
        <h3>Escalation flag</h3>
        <span>{escalation ? "Triggered" : "Clear"}</span>
      </div>
      <div className="status-card">
        <h3>Latest intents</h3>
        <span>{intents.length ? intents.join(", ") : "n/a"}</span>
      </div>
    </div>
  );
}
