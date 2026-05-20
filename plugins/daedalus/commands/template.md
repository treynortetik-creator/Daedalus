---
description: Create and manage custom Daedalus templates — import an HTML file, save the current artifact as a reusable template, generate a new one from a prompt, or list/delete. Custom templates live in ~/.daedalus/templates/ and survive plugin updates.
---

# /daedalus:template

Manage the user's personal library of custom Daedalus templates. These live in `~/.daedalus/templates/`, survive plugin updates, and are auto-discovered by `/daedalus` at scaffold time — selectable exactly like the bundled templates.

## How to handle this request

1. **Invoke the `template-manager` skill** from this plugin — it owns the storage location, the metadata-header contract, the validate-and-repair gate, and all four intents.

2. **Determine the intent** from the user's words:
   - "save this as a template", "turn this into a template", "make this reusable" → **save-as**
   - "import this template", or a path/paste of an existing HTML file → **import**
   - "make/generate a template for X", "I want a template that…" → **generate**
   - "list my templates", "what templates do I have" → **list**
   - "delete the X template" → **delete**

   If it's genuinely ambiguous, ask which.

3. **Execute that intent's flow** per the skill. Every create path ends by validating the template (`scripts/validate-template.js`, repairing if needed) and writing it to `~/.daedalus/templates/<slug>.html`.

4. **Confirm** what was saved and the keywords it'll auto-match on, so the user knows how to trigger it via `/daedalus` later.

## When to use this command

When the user wants to build or manage **reusable templates**. To generate a single one-off artifact, use `/daedalus` instead.
