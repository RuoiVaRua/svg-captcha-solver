#!/usr/bin/env python3
"""
Command-line interface for SVG Captcha Solver (Python).
"""

import argparse
import json
import sys
from pathlib import Path

from .solver import SvgCaptchaSolver


def main():
    parser = argparse.ArgumentParser(
        description="Solve SVG captchas using vector path analysis."
    )
    parser.add_argument(
        "input",
        nargs="?",
        help="Path to an SVG file or a directory of SVG files.",
    )
    parser.add_argument(
        "-d", "--detail",
        action="store_true",
        help="Display detailed analysis for each character (coordinates, pattern, confidence).",
    )
    parser.add_argument(
        "-j", "--json",
        action="store_true",
        help="Output results in JSON format.",
    )

    args = parser.parse_args()

    if not args.input:
        parser.print_help()
        sys.exit(1)

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Path '{args.input}' does not exist.", file=sys.stderr)
        sys.exit(1)

    solver = SvgCaptchaSolver()

    if input_path.is_file():
        svg_files = [input_path]
    elif input_path.is_dir():
        svg_files = sorted(list(input_path.glob("*.svg")))
        if not svg_files:
            print(f"No .svg files found in directory '{args.input}'.", file=sys.stderr)
            sys.exit(0)
    else:
        print(f"Error: Invalid file/directory path '{args.input}'.", file=sys.stderr)
        sys.exit(1)

    results = []
    for file_path in svg_files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            analysis = solver.analyze(content)
            res_entry = {
                "file": str(file_path),
                "text": analysis.text,
                "characters": [
                    {
                        "char": c.char,
                        "confidence": c.confidence,
                        "bbox": {
                            "min_x": round(c.bbox[0], 2),
                            "max_x": round(c.bbox[1], 2),
                            "min_y": round(c.bbox[2], 2),
                            "max_y": round(c.bbox[3], 2),
                        },
                        "exact_match": c.exact_match
                    }
                    for c in analysis.characters
                ]
            }
            results.append(res_entry)

            if not args.json:
                if len(svg_files) > 1:
                    print(f"[{file_path.name}] => {analysis.text}")
                else:
                    print(f"Captcha Result: {analysis.text}")

                if args.detail:
                    print("-" * 50)
                    for i, c in enumerate(analysis.characters):
                        print(f"  Character {i + 1}: '{c.char}' (Confidence: {c.confidence * 100:.1f}%)")
                        print(f"    Bounding Box: X=[{c.bbox[0]:.2f}, {c.bbox[1]:.2f}], Y=[{c.bbox[2]:.2f}, {c.bbox[3]:.2f}]")
                        print(f"    Path Pattern: {c.pattern[:35]}... (length={len(c.pattern)})")
                    print("-" * 50)
        except Exception as e:
            print(f"Error processing {file_path}: {e}", file=sys.stderr)

    if args.json:
        if len(results) == 1 and input_path.is_file():
            print(json.dumps(results[0], indent=2))
        else:
            print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
