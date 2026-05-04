import { z } from "zod";

/**
 * Schema mirroring the JSON contract from src/ocr_system_prompt.txt.
 *
 * Numbers must be JSON numbers (never strings).
 * Player IDs are "XXXX-XXXX" or null.
 * If the screenshot is not a game data screen, Claude returns
 * { error, description } instead — handled separately.
 */

const playerIdRegex = /^\d{4}-\d{4}$/;

export const ocrTableSchema = z.object({
  name: z.string().nullable(),
  game_type: z.string().nullable(),
  blinds: z.string().nullable(),
  buy_in_min: z.number().nullable(),
  buy_in_max: z.number().nullable(),
  fee_percent: z.number().nullable(),
  total_players: z.number().nullable(),
  period_start: z.string().nullable(),
  period_end: z.string().nullable(),
  creator_name: z.string().nullable(),
  creator_id: z.string().nullable(),
  status: z.string().nullable(),
});

export const ocrPlayerSchema = z.object({
  name: z.string(),
  id: z.string().regex(playerIdRegex).nullable(),
  profit_loss: z.number(),
  fee: z.number(),
});

export const ocrValidationSchema = z.object({
  sum_profit_loss: z.number(),
  balance_ok: z.boolean(),
});

export const ocrResultSchema = z.object({
  table: ocrTableSchema,
  players: z.array(ocrPlayerSchema),
  validation: ocrValidationSchema,
});

export const ocrErrorSchema = z.object({
  error: z.string(),
  description: z.string().optional(),
});

export type OcrResult = z.infer<typeof ocrResultSchema>;
export type OcrError = z.infer<typeof ocrErrorSchema>;
