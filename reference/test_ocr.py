"""
Тестовый прогон OCR на скринах ClubGG через Claude Vision API.
Запуск: python3 test_ocr.py <image1> [<image2> ...]
"""

import sys
import json
import base64
import os
from pathlib import Path
import anthropic


def load_system_prompt():
    with open("/home/claude/system_prompt.txt", "r", encoding="utf-8") as f:
        return f.read()


def encode_image(path):
    with open(path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def detect_media_type(path):
    suffix = Path(path).suffix.lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(suffix, "image/jpeg")


def parse_response(raw_text):
    """Робастный парсинг — снимаем возможные markdown-фенсы."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        # снимаем ```json или просто ```
        first_newline = cleaned.find("\n")
        if first_newline > 0:
            cleaned = cleaned[first_newline + 1:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].rstrip()
    # отрезаем всё до первой { и после последней }
    fb = cleaned.find("{")
    lb = cleaned.rfind("}")
    if fb > 0 or (lb >= 0 and lb < len(cleaned) - 1):
        cleaned = cleaned[fb:lb + 1]
    return json.loads(cleaned)


def validate(parsed):
    """Валидация структуры + пересчёт баланса с гибридными порогами."""
    issues = []
    severity = "ok"  # ok / info / warn / block

    if "error" in parsed:
        return [f"OCR returned error: {parsed['error']}"], None, "block"

    if "table" not in parsed:
        issues.append("missing 'table' key")
        severity = "block"
    if "players" not in parsed or not isinstance(parsed["players"], list):
        issues.append("missing or invalid 'players' key")
        return issues, None, "block"

    players = parsed["players"]
    if len(players) > 7:
        issues.append(f"more than 7 players detected ({len(players)}) — possible hallucination")
        severity = "warn"
    declared = parsed.get("table", {}).get("total_players")
    if declared is not None and len(players) != declared:
        issues.append(f"player count mismatch: list has {len(players)}, total_players={declared}")
        severity = "warn"

    # Пересчитываем сумму у себя
    our_sum = sum(p.get("profit_loss", 0) for p in players)
    api_sum = parsed.get("validation", {}).get("sum_profit_loss")

    if api_sum is not None and abs(our_sum - api_sum) > 0.01:
        issues.append(
            f"API claims sum={api_sum}, recomputed={our_sum:.2f} — model is inconsistent"
        )
        severity = "warn"

    # Гибридный порог расхождения баланса
    abs_off = abs(our_sum)
    if abs_off > 10:
        issues.append(f"BLOCK: balance off by {our_sum:+.2f} (>10) — manual review required")
        severity = "block"
    elif abs_off > 1:
        issues.append(f"WARN: balance off by {our_sum:+.2f} (1-10) — confirm manually")
        if severity == "ok":
            severity = "warn"
    elif abs_off > 0.01:
        issues.append(f"INFO: rounding noise {our_sum:+.4f} (<1, auto-passed)")
        if severity == "ok":
            severity = "info"

    # Проверка ID-формата
    import re
    id_pattern = re.compile(r"^\d{4}-\d{4}$")
    for p in players:
        if p.get("id") and not id_pattern.match(p["id"]):
            issues.append(f"player {p.get('name')} has malformed id: {p['id']}")
            if severity == "ok":
                severity = "warn"

    return issues, our_sum, severity


def process_image(client, image_path, system_prompt):
    print(f"\n{'='*70}")
    print(f"Processing: {image_path}")
    print(f"{'='*70}")

    image_data = encode_image(image_path)
    media_type = detect_media_type(image_path)

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2000,
        temperature=0,
        system=system_prompt,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Extract the game data from this screenshot.",
                    },
                ],
            }
        ],
    )

    raw_text = response.content[0].text
    usage = response.usage

    print(f"\nUsage: input={usage.input_tokens}, output={usage.output_tokens}")
    cost = usage.input_tokens * 3 / 1_000_000 + usage.output_tokens * 15 / 1_000_000
    print(f"Approx cost: ${cost:.4f}")

    print(f"\n--- Raw response ---\n{raw_text}\n")

    try:
        parsed = parse_response(raw_text)
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON: {e}")
        return None

    print(f"--- Parsed JSON ---\n{json.dumps(parsed, ensure_ascii=False, indent=2)}\n")

    issues, our_sum, severity = validate(parsed)
    severity_icons = {"ok": "✅", "info": "ℹ️", "warn": "⚠️", "block": "🛑"}
    print(f"\n{severity_icons[severity]} Severity: {severity.upper()}")
    if issues:
        for i in issues:
            print(f"   - {i}")
    if our_sum is not None:
        print(f"Balance sum = {our_sum:+.2f}")

    return parsed


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 test_ocr.py <image1> [<image2> ...]")
        sys.exit(1)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY env var not set")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    system_prompt = load_system_prompt()

    results = []
    for path in sys.argv[1:]:
        if not Path(path).exists():
            print(f"❌ File not found: {path}")
            continue
        result = process_image(client, path, system_prompt)
        if result:
            results.append((path, result))

    # Если два или более скринов — посчитаем агрегат P&L
    if len(results) >= 2:
        print(f"\n{'='*70}")
        print("Aggregate P&L across all screenshots (по нашей модели B):")
        print(f"{'='*70}")
        agg = {}
        for path, parsed in results:
            for p in parsed.get("players", []):
                key = (p.get("name"), p.get("id"))
                agg[key] = agg.get(key, 0) + p.get("profit_loss", 0)
        total = 0
        for (name, pid), pnl in agg.items():
            total += pnl
            sign = "+" if pnl >= 0 else ""
            print(f"  {name:20} ({pid})  {sign}{pnl:.2f}")
        print(f"  {'─'*50}")
        print(f"  {'Total':20} {' ':12}  {total:+.2f}")


if __name__ == "__main__":
    main()
