"""Produce a browser-openable copy with local code and destination photos embedded."""
from base64 import b64encode
from pathlib import Path

root = Path(__file__).resolve().parent
html = (root / "index.html").read_text()
html = html.replace('<link rel="stylesheet" href="styles.css">',
                    '<style>' + (root / "styles.css").read_text() + '</style>')
for name in ("data.js", "credits.js"):
    html = html.replace(f'<script src="{name}" defer></script>',
                        '<script>' + (root / name).read_text() + '</script>')
html = html.replace('<script src="app.js" defer></script>', '')
html = html.replace('</body>', '<script>' + (root / "app.js").read_text() + '</script></body>')
for asset in (root / "assets").iterdir():
    if asset.suffix not in (".jpg", ".svg"):
        continue
    mime = "image/jpeg" if asset.suffix == ".jpg" else "image/svg+xml"
    uri = f'data:{mime};base64,' + b64encode(asset.read_bytes()).decode()
    html = html.replace('assets/' + asset.name, uri)
html = html.replace('<a href="../index.html">Wedding planner ↗</a>', '')
(root / "portable.html").write_text("\n".join(line.rstrip() for line in html.splitlines()) + "\n")
print("Created portable.html — open directly in a browser; no server required.")
