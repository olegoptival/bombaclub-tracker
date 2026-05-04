import Anthropic from "@anthropic-ai/sdk";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../s3";
import { log } from "../log";
import { OCR_SYSTEM_PROMPT } from "./prompt";
import { ocrResultSchema, ocrErrorSchema, type OcrResult } from "./schema";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 2000;

const MIME_BY_EXT: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export type OcrOutcome =
  | { kind: "success"; result: OcrResult; rawText: string }
  | { kind: "not_a_game_screen"; description: string; rawText: string }
  | { kind: "invalid_response"; rawText: string; reason: string };

export async function runOcr(imageUrl: string): Promise<OcrOutcome> {
  // Parse s3:// URL
  const m = /^s3:\/\/([^/]+)\/(.+)$/.exec(imageUrl);
  if (!m) throw new Error(`Bad image_url: ${imageUrl}`);
  const [, bucket, key] = m;
  if (!bucket || !key) throw new Error(`Bad image_url: ${imageUrl}`);

  // Download from MinIO
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!obj.Body) throw new Error(`Empty object: ${imageUrl}`);
  const chunks: Uint8Array[] = [];
  // @ts-expect-error: Body is a Node Readable in this SDK build
  for await (const chunk of obj.Body) {
    chunks.push(chunk);
  }
  const buf = Buffer.concat(chunks);

  // Determine media type from key extension
  const ext = key.split(".").pop()?.toLowerCase() ?? "jpg";
  const mediaType = MIME_BY_EXT[ext] ?? "image/jpeg";

  // Call Claude
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: 0,
    system: OCR_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: buf.toString("base64"),
            },
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return {
      kind: "invalid_response",
      rawText: "",
      reason: "no text block in response",
    };
  }
  const rawText = textBlock.text.trim();

  // Strip optional markdown code fence (```json ... ``` or ``` ... ```)
  // The system prompt says "no fences" but models occasionally add them anyway.
  const stripped = rawText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  // Try parse as JSON
  let json: unknown;
  try {
    json = JSON.parse(stripped);
  } catch (e) {
    log.warn({ rawText, error: e }, "OCR response is not valid JSON");
    return {
      kind: "invalid_response",
      rawText,
      reason: "not valid JSON",
    };
  }

  // First try error shape
  const errorParse = ocrErrorSchema.safeParse(json);
  if (errorParse.success) {
    return {
      kind: "not_a_game_screen",
      description: errorParse.data.description ?? errorParse.data.error,
      rawText,
    };
  }

  // Then try result shape
  const resultParse = ocrResultSchema.safeParse(json);
  if (!resultParse.success) {
    log.warn(
      { rawText, issues: resultParse.error.issues },
      "OCR response failed schema validation"
    );
    return {
      kind: "invalid_response",
      rawText,
      reason: resultParse.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  return { kind: "success", result: resultParse.data, rawText };
}
