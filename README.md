# WhatsAuto Twin

A Vercel-ready Next.js agent that mirrors your personal WhatsApp tone whenever you are away. Configure persona DNA, simulate incoming chats, and inspect the reasoning trail powering each automated reply.

## Features

- Persona builder for tone, availability, signature phrases, and escalation triggers.
- Live simulator that crafts replies using a deterministic heuristics engine.
- Audit log explaining every decision so you can trust and tune the bot.
- REST endpoint (`/api/respond`) ready to receive WhatsApp webhook payloads.

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to adjust your persona and test the agent.

## Production Build

```bash
npm run build
npm start
```

## Deploying to Vercel

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-37beb699
```

## Hooking To WhatsApp

1. Register a webhook with WhatsApp Cloud API or Twilio WhatsApp Sandbox.
2. Transform incoming payloads into:
   ```json
   {
     "config": { ...personaConfig },
     "message": "incoming text",
     "history": [{ "author": "contact", "text": "...", "timestamp": 0 }]
   }
   ```
3. Forward the generated reply back through your provider’s send API.

## Configuration Schema

The persona object expected by `/api/respond`:

```ts
type PersonaConfig = {
  alias: string;
  persona: string;
  tone: "warm" | "direct" | "playful" | "professional";
  availability: string;
  signature: string;
  fallback: string;
  samplePhrases: string[];
  escalateKeywords: string[];
  responseDelayMinutes: number;
  autoIntro: string;
};
```

## License

MIT © 2024
