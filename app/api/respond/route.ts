import { NextResponse } from "next/server";
import { generateReply, type PersonaConfig, type ConversationMessage } from "@/lib/replyEngine";

interface RequestPayload {
  config?: PersonaConfig;
  message?: string;
  history?: ConversationMessage[];
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as RequestPayload;
    const config = data.config;
    const message = data.message ?? "";
    const history = data.history ?? [];

    if (!config) {
      return NextResponse.json(
        { error: "Missing persona configuration." },
        { status: 400 }
      );
    }

    const result = generateReply(config, message, history);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate response." },
      { status: 500 }
    );
  }
}
