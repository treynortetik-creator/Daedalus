# Daedalus templates

Starting scaffolds for common page types. Each template has the markup contract baked in (`data-editable`, `dae-photo-wrap`, `dae-sortable-container`, `data-pdf-root`) and the `DAE_*_HERE` build markers ready for the editor to be inlined.

| Template | Layout | Good for |
|---|---|---|
| `blank.html` | One title + one paragraph in a card | Throwaway scaffolds, design-from-scratch |
| `onepager.html` | Letter portrait: hero + 3-tile proof + CTA | Product overviews, sales handouts, exec summaries |
| `landing.html` | Hero + 2×2 features grid + CTA strip | Product launches, campaign pages, microsites |
| `blog-post.html` | Long-form article: byline + hero + body sections + pullquotes + callout | Essays, blog posts, explainers |
| `status-report.html` | Multi-section: exec summary + RAG status grid + milestones + risks + next steps | Weekly/monthly project updates, exec briefings |
| `pricing-table.html` | 3-tier comparison columns with feature checkmarks, middle tier highlighted | SaaS pricing, service tiers, sponsorship packages |
| `case-study.html` | Customer + before/after metrics + pull quote + CTA | Sales case studies, partner outreach |
| `invitation.html` | Event card: big date, location, agenda, RSVP button | Event invites, save-the-dates, launch announcements |

## How to use a template

1. Open the template file, copy the whole thing.
2. Replace each `{{TOKEN}}` placeholder with your content.
3. Inline the editor at each `<!-- DAE_*_HERE -->` marker — see [`../SKILL.md`](../SKILL.md) for the full inlining procedure, or just invoke `/daedalus` and Claude will do it for you.
4. Inline any photos as base64 data URIs (the editor is self-contained; loading external images breaks offline use).
5. Save the file. Open it in a browser. Click Edit.

## How to add a new template

1. Copy the template closest to what you want as a starting point.
2. Keep the markup contract: every editable text needs `data-editable`, every photo needs `dae-photo-wrap` + `data-editable-photo`, sortable parents need `dae-sortable-container`, and the top-level wrapper needs `data-pdf-root`.
3. Use `--dae-*` CSS variables with fallbacks (the editor's chrome reads them; users theme via overrides).
4. End the page with the standard `DAE_*_HERE` marker block (see any existing template).
5. Add a row to the table above. PR it.

Good template ideas that aren't shipped yet: dashboard / KPI grid, sales proposal, resume, memo, recipe card, product spec, comparison matrix, changelog.
