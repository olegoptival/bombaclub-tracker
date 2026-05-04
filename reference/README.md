# Reference materials

These are reference artifacts from the project's "bot era" (before the pivot to web).
Kept here for porting / consultation, not for direct use.

- `settle_up.py` — Python implementation of the settle-up algorithm.
  To be ported to TypeScript in `packages/core/src/settle-up.ts` (Stage 4).
- `ocr_system_prompt.txt` — system prompt for Claude Vision, tested on real ClubGG screens.
  To be used as-is in `packages/core/src/ocr/system-prompt.txt` (Stage 4).
- `test_ocr.py` — Python script for ad-hoc OCR debugging.
  Useful when an OCR run misbehaves and you want to test prompt changes.
