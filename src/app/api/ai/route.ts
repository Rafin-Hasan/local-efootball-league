import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { SYSTEM_PROMPT, buildLeagueContext } from "@/lib/ai/context";
import { mockAnswer, mockRecap } from "@/lib/ai/mock";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { getLeagueOverview } from "@/lib/queries";

// The Anthropic SDK and Prisma both need Node APIs.
export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";
const MAX_QUESTION = 600;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  // Each call costs money, so cap it well below anything a human would type.
  const limit = rateLimit(`ai:${clientIp(request.headers)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Slow down — try again in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let body: { question?: string; preset?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const question = (body.question ?? "").trim().slice(0, MAX_QUESTION);
  if (!question) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }

  const overview = await getLeagueOverview(session.tournamentId);
  if (!overview) {
    return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  }

  // No key configured: answer from the same numbers with a templated briefing
  // rather than failing. The client labels this as offline.
  if (!process.env.ANTHROPIC_API_KEY) {
    const text =
      body.preset === "recap"
        ? mockRecap(overview)
        : mockAnswer(question, overview);
    return new Response(text, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-copilot-mode": "offline",
      },
    });
  }

  const client = new Anthropic();

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 2000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          // The system prompt is byte-stable across requests; the volatile
          // league briefing lives in the user turn, after the breakpoint.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `${buildLeagueContext(overview)}\n\n---\n\nQuestion: ${question}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (error) {
          // The response has already begun, so surface the failure inline
          // instead of a status code the client can no longer see.
          controller.enqueue(
            encoder.encode(
              `\n\n[The copilot stopped early: ${messageOf(error)}]`,
            ),
          );
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-copilot-mode": "live",
      },
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is set but was rejected." },
        { status: 502 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Anthropic rate limit reached. Try again shortly." },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: messageOf(error) }, { status: 502 });
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error.";
}
