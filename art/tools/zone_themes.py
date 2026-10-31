#!/usr/bin/env python3
"""Canonical zone-primary assignments and muted ramps. No gameplay content is declared here.

Each primary has one muted shade, then joins an existing house-palette ramp. Build writes the minimal
runtime assignment object to public/art/zone-themes.json and registers the zone-themes manifest data key.
The game resolves each primary token through palette.json for map and progress colours.

Usage: zone_themes.py build
Run from the repository root.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Route order carries meaning. Materials and atmosphere determine each destination's single primary.
THEMES = {
    "blue-cityscape": {"primary": "zone-blue", "colour": "a8bfd4", "shade": "7d98b4", "end": "slate"},
    "industrial": {"primary": "zone-purple", "colour": "b6aecb", "shade": "90869f", "end": "purple"},
    "countryside": {"primary": "zone-yellow", "colour": "d8c994", "shade": "b2a16e", "end": "brown"},
    "woodland": {"primary": "zone-green", "colour": "a9bea0", "shade": "7c9673", "end": "forest"},
    "home-city": {"primary": "zone-peach", "colour": "d6b39d", "shade": "ae8b75", "end": "brown"},
    "apartment": {"primary": "zone-red", "colour": "d0a7aa", "shade": "aa7d83", "end": "dbrown"},
}
OUT = "public/art/zone-themes.json"


def colours():
    return {name: colour for theme in THEMES.values()
            for name, colour in ((theme["primary"], theme["colour"]),
                                 (theme["primary"] + "-shade", theme["shade"]))}


def ramps(house):
    return {colour: darker for theme in THEMES.values()
            for colour, darker in ((theme["colour"], theme["shade"]), (theme["shade"], house[theme["end"]]))}


def assignments():
    return {destination: {"primary": theme["primary"]} for destination, theme in THEMES.items()}


def build():
    import pixel

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as out:
        json.dump(assignments(), out, indent=2, sort_keys=True)
        out.write("\n")
    pixel.update_manifest("data", [{"key": "zone-themes", "json": "zone-themes.json"}])
    print("built zone themes")


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "build":
        build()
    else:
        raise SystemExit("Usage: zone_themes.py build")
