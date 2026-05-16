# Daedalus themes

Drop-in CSS files that override the editor's `--dae-*` variables. Pick the one closest to the vibe you want, paste it into your page's `<style>` block (after the toolbar CSS), and tweak.

| File | Vibe | Use it for |
|---|---|---|
| `greek.css` | Sepia parchment, terracotta + umber, serif | Editorial, fine-press, classical aesthetic |
| `dark.css` | Near-black surfaces, cyan accent | Tech docs, dashboards, terminal aesthetic |
| `minimal.css` | Quiet grayscale, no accent fighting type | Long-form reading, journalism, essays |
| `brutalist.css` | Black borders, mono headlines, hot magenta | Zines, portfolios, early-web editorial |

## How to use

Each file is just CSS that overrides the `--dae-*` variables (and sometimes adds a few targeted overrides to elements like the toolbar). Either:

**Option A** — paste into the page's existing `<style>` block:

```html
<style>
  /* your existing page styles */

  /* paste contents of themes/greek.css here */
</style>
```

**Option B** — link from the document head:

```html
<link rel="stylesheet" href="themes/greek.css">
```

Order matters: themes need to come AFTER the editor's CSS so the variable overrides win the cascade.

## Building your own

Easiest path: copy `minimal.css` as a starting point, change the eight `--dae-*` color values, optionally tweak the font stack. The editor will adopt the new palette automatically.

The 10 variables (with their fallback defaults):

```css
:root {
  --dae-primary: #1a1a1a;       /* toolbar bg, primary text */
  --dae-secondary: #4a4a4a;     /* secondary text */
  --dae-accent: #0066cc;        /* active states, accent text */
  --dae-warm: #cc3300;          /* PDF button + warm color swatch */
  --dae-tint-1: #cce0ff;        /* fills */
  --dae-tint-2: #d8d8d8;        /* borders */
  --dae-tint-3: #ececec;        /* light surfaces */
  --dae-tint-4: #f6f6f6;        /* lightest surfaces */
  --dae-bg: #ffffff;            /* page background */
  --dae-fg: #1a1a1a;            /* page text */
}
```

If you build something you're happy with, PR it back — themes are easy to merge and high-value for new users.
