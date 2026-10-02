#!/usr/bin/env python3
"""Copy both sites from the Obsidian vault into this repo.

The vault is the source of truth. Edit there, rebuild the hub's data.js
(python3 .outputs/resource-hub/build.py), then run:  python3 sync.py
"""
import shutil
from pathlib import Path

VAULT = Path.home() / "Documents/Obsidian Vault/transition-wiki/.outputs"
HERE = Path(__file__).resolve().parent

# hub: copy the whole site folder
hub_src, hub_dst = VAULT / "resource-hub/site", HERE / "hub"
shutil.rmtree(hub_dst, ignore_errors=True)
shutil.copytree(hub_src, hub_dst)

# in the vault the guide sits two folders up; in this repo it is a sibling
idx = hub_dst / "index.html"
html = idx.read_text(encoding="utf-8")
old, new = 'href="../../referral-guide/index.html"', 'href="../referral-guide/"'
assert old in html, "hub footer link to the referral guide changed; update sync.py"
idx.write_text(html.replace(old, new), encoding="utf-8")

# referral guide: the page only (link-report.md stays in the vault)
guide_dst = HERE / "referral-guide"
guide_dst.mkdir(exist_ok=True)
shutil.copy2(VAULT / "referral-guide/index.html", guide_dst / "index.html")

print("synced hub/ (%d files) and referral-guide/" % len(list(hub_dst.iterdir())))
