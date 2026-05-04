import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const promptPath = resolve(here, "..", "ocr_system_prompt.txt");

export const OCR_SYSTEM_PROMPT = readFileSync(promptPath, "utf-8");
