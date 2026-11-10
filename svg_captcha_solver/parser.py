"""
SVG Parser module for extracting and analyzing path elements in CAPTCHA images.
"""

from dataclasses import dataclass
import re
import xml.etree.ElementTree as ET
from typing import List, Optional, Tuple


@dataclass
class PathElement:
    """Represents an extracted path element from an SVG with geometric properties."""
    d: str
    pattern: str
    min_x: float
    max_x: float
    min_y: float
    max_y: float
    width: float
    height: float
    center_x: float
    center_y: float
    fill: Optional[str] = None
    stroke: Optional[str] = None

    @property
    def aspect_ratio(self) -> float:
        """Width / Height ratio."""
        return self.width / max(self.height, 1e-6)

    @property
    def bbox(self) -> Tuple[float, float, float, float]:
        """(min_x, max_x, min_y, max_y)"""
        return (self.min_x, self.max_x, self.min_y, self.max_y)


def extract_coordinates(d: str) -> Tuple[List[float], List[float]]:
    """Extract all x and y coordinates from an SVG path 'd' attribute."""
    # Matches float/integer numbers including negative and scientific notation
    numbers = [float(x) for x in re.findall(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', d)]
    xs = numbers[0::2]
    ys = numbers[1::2]
    return xs, ys


def compute_bbox(xs: List[float], ys: List[float]) -> Tuple[float, float, float, float, float, float, float, float]:
    """Compute bounding box and dimensions from coordinate lists."""
    if not xs or not ys:
        return 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    width = max_x - min_x
    height = max_y - min_y
    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0
    return min_x, max_x, min_y, max_y, width, height, center_x, center_y


def extract_command_pattern(d: str) -> str:
    """
    Extract the sequence of path commands (letters only) from path data.
    e.g. 'M10 20L30 40Q...Z' -> 'MLQ...Z'
    """
    return re.sub(r'[^A-Za-z]', '', d)


def is_noise_path(path: PathElement, svg_width: Optional[float] = None) -> bool:
    """
    Determine if a path is a noise line rather than a character glyph.
    svg-captcha noise lines:
    1. Have stroke but fill='none' or empty fill.
    2. Lack 'Z' (closed path) command.
    3. Are typically long bezier curves (C commands) stretching across the image.
    """
    # Character glyphs are closed shapes that must have 'Z'
    if 'Z' not in path.pattern.upper():
        return True

    # If explicitly fill="none", it's a line/stroke
    if path.fill and path.fill.strip().lower() in ('none', 'transparent'):
        return True

    # Stroke without fill is typically a line
    if path.stroke and not path.fill:
        return True

    # Check for excessive width (e.g. noise lines spanning across the entire canvas)
    if svg_width and path.width > svg_width * 0.75 and path.height < 10:
        return True

    return False


def parse_svg(svg_content: str) -> List[PathElement]:
    """
    Parse an SVG string and return a list of character PathElements,
    sorted horizontally from left to right (by min_x).
    """
    # Normalize escaped quotes (e.g. from JSON payloads or raw strings like \" or \')
    if r'\"' in svg_content or r"\'" in svg_content:
        svg_content = svg_content.replace(r'\"', '"').replace(r"\'", "'")

    # Extract canvas width if present
    svg_width = None
    width_match = re.search(r'width\s*=\s*["\']([0-9.]+)', svg_content)
    if width_match:
        try:
            svg_width = float(width_match.group(1))
        except ValueError:
            pass

    raw_paths = []

    # Attempt XML parsing first
    try:
        root = ET.fromstring(svg_content)
        # Find all path elements regardless of namespace
        for elem in root.iter():
            if elem.tag.endswith('path'):
                d = elem.attrib.get('d', '')
                fill = elem.attrib.get('fill', None)
                stroke = elem.attrib.get('stroke', None)
                if d:
                    raw_paths.append((d, fill, stroke))
    except ET.ParseError:
        # Fallback to regex-based extraction if XML parsing fails
        pattern = re.compile(r'<path\b([^>]*)/?>', re.IGNORECASE)
        for match in pattern.finditer(svg_content):
            attrs = match.group(1)
            d_match = re.search(r'd\s*=\s*\\?["\']([^"\'\\]+)[\\]?["\']', attrs)
            if d_match:
                d = d_match.group(1)
                fill_m = re.search(r'fill\s*=\s*\\?["\']([^"\'\\]+)[\\]?["\']', attrs)
                stroke_m = re.search(r'stroke\s*=\s*\\?["\']([^"\'\\]+)[\\]?["\']', attrs)
                fill = fill_m.group(1) if fill_m else None
                stroke = stroke_m.group(1) if stroke_m else None
                raw_paths.append((d, fill, stroke))

    # Convert to PathElement objects
    candidate_paths: List[PathElement] = []
    for d, fill, stroke in raw_paths:
        xs, ys = extract_coordinates(d)
        if not xs or not ys:
            continue
        min_x, max_x, min_y, max_y, width, height, cx, cy = compute_bbox(xs, ys)
        pattern = extract_command_pattern(d)
        pe = PathElement(
            d=d,
            pattern=pattern,
            min_x=min_x,
            max_x=max_x,
            min_y=min_y,
            max_y=max_y,
            width=width,
            height=height,
            center_x=cx,
            center_y=cy,
            fill=fill,
            stroke=stroke
        )

        if not is_noise_path(pe, svg_width):
            candidate_paths.append(pe)

    # Sort characters from left to right by their horizontal position
    candidate_paths.sort(key=lambda p: p.min_x)

    return candidate_paths
