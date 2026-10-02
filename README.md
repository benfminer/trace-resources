# TRACE Staff Resources

Two staff references for TRACE San Diego (students ages 18 to 22):

- **Referral Guide** (`referral-guide/`): 18 local referrals, who qualifies, and the exact first step for each.
- **Resource Hub** (`hub/`): a searchable, filterable list of free transition tools, agencies and handouts.

Live at **https://benfminer.github.io/trace-resources/**

Static HTML. No build step, no tracking, no cookies. The only third-party request is Google Fonts.

## Updating

The Obsidian vault is the source of truth (`transition-wiki/.outputs/resource-hub/` and `.outputs/referral-guide/`). Don't edit `hub/` or `referral-guide/` here by hand.

1. Edit in the vault. For the hub, edit `resources.json`, then run `python3 build.py` there.
2. Run `python3 sync.py` here.
3. Commit and push.

A staff reference, not an official San Diego Unified publication.
