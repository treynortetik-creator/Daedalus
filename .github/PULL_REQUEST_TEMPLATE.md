## What this changes

<!-- One sentence describing the change. -->

## Why

<!-- The motivation. Link the issue if there is one (e.g. "Fixes #12"). -->

## Type of change

- [ ] Bug fix (editor doing something wrong)
- [ ] New template
- [ ] New theme
- [ ] New editor capability
- [ ] Documentation only
- [ ] Build / scaffolding only

## Verification

<!-- How did you check this works? At minimum:
- Built an artifact from a template (or used dist/editor.html) and exercised the affected flow in a browser
- Clicked Edit, made changes, autosaved (waited 5+ seconds)
- Reloaded the page, confirmed the Restore prompt appears
- Hit PDF, opened the result
- Hit Present, hit Esc

If you touched the toolbar's JS/CSS, run the puppeteer tests in /tests (when they exist) and paste the output. -->

## Browser tested

- [ ] Chrome / Edge
- [ ] Safari
- [ ] Firefox

## Constraints

- [ ] No new dependencies added
- [ ] No build step introduced
- [ ] Editor remains a single self-contained file at `dist/editor.html` (if you changed the editor itself, rebuild via `python3 /tmp/build_dist.py` or equivalent)
- [ ] No SafelyYou-specific or any other brand-specific content (Daedalus stays vendor-neutral)
