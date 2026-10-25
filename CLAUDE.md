# CLAUDE.md

Wedding website for **Sweenal & Ashay**: 12–13 December 2026, Queen's Land Celebration Lawn & Banquet, Nagpur. It's a single-page static site.

## Stack

- Plain HTML, CSS and JavaScript. There is no build step, no package manager, no framework and no tests.
- `index.html`: every section of the page (hero, story timeline, events, dress code, venue, travel, memories, FAQ, footer).
- **Scope:** the site is only a wedding invitation and a place for memories. It collects nothing from guests: no RSVP, guest list, meal preferences or guestbook, and no backend. Don't add any of these unless the couple asks.
- `css/styles.css`: all styles, grouped under `/* Section */` comment headers in page order, with `/* Responsive */` at the end
- `js/main.js`: the countdown (with digit flip), the mobile nav toggle, the hero's canvas petal field, 3D card tilt, the dress-code ladies/gents flip, the story timeline's scroll-drawn line, the Memories lightbox (`<dialog>`, with swipe and arrow keys), and scroll-reveal (IntersectionObserver)
- `images/outfits/`: `ladies-1…6.jpg` and `gents-1…6.jpg`, cropped from `outfit_code.jpeg` (the couple's wardrobe planner, which is the source of truth for dress codes)
- Fonts come from Google Fonts: Cormorant Garamond (serif headings), Great Vibes (script accents, such as the `&`) and Jost (body text).

## Running locally

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Rules

### General
- Keep the site dependency-free. Don't add frameworks, bundlers, npm or CDN JS libraries unless asked.
- Keep it one page. A new section is a `<section class="section reveal" id="...">` inside `<main>`. Alternate `section-tinted` so the backgrounds keep switching, and add a nav link in `.nav-links` if the section should be reachable from the menu.
- Each section follows the same heading pattern: `<p class="section-eyebrow">` → `<h2>` → content.

### 3D and motion
- The look is "3D animated": a dark maroon hero with a canvas petal field and a pointer-tilted card, a 3D reveal on each section, tilt-and-glare cards, flip cards in the dress code, and a rotating gallery ring.
- Make a card tilt by adding `data-tilt`. main.js sets `--rx`/`--ry`/`--gx`/`--gy` on it. Tilt only runs for mouse pointers.
- In the dress code, `.wardrobe.is-gents` rotates every `.outfit-inner` to its back face. Keep `aria-hidden` on whichever face is hidden; main.js swaps it.
- Every animation must have a `prefers-reduced-motion` fallback. The gallery ring falls back to a grid, and the petals draw once without animating.
- Use `animation-fill-mode: backwards`, not `both`, on elements whose transform JS changes later.

### Adding photos
- **Story timeline:** replace the `<span>` inside a `.moment .photo-placeholder` with an `<img>` (it's cropped with `object-fit: cover`). Each `.moment` has a date, a title and a line of text.
- **Memories:** each photo is a `<button class="photo-placeholder memory" data-caption="…" data-full="images/memories/N.jpg">` containing a thumbnail `<img alt="…">`. The lightbox opens `data-full` (or the thumbnail, if `data-full` is missing). The 3D ring is built for 6 items at 60° apart; with more photos, change the angle in `.carousel-ring .photo-placeholder` and `--ring-r`.

### CSS
- Use the design tokens in `:root` (`--color-*`, `--font-*`, `--radius`, `--shadow`, `--max-width`). Don't hardcode new colours or fonts. If something new is genuinely needed, add a token.
- Palette: cream background, maroon accent (`--color-accent`), gold highlights (`--color-gold`, `--color-gold-light`), dark hero and footer (`--color-night`), and blush for ladies / sage for gents (`--color-blush`, `--color-sage`).
- Put new rules under the matching `/* Section */` header. Mobile overrides go in the single `@media (max-width: 760px)` block.
- Respect `prefers-reduced-motion`. New animations or transitions need to be disabled in that block.
- Class names are lowercase and hyphenated (`event-card`, `day-heading`). State classes use an `is-` prefix (`is-open`, `is-visible`).

### JavaScript
- Vanilla ES2015+. Use `const`/`let`, arrow functions, double quotes and semicolons. Keep one short `//` comment above each feature block.
- All dates and times are **IST (UTC+05:30)**. Write explicit offsets, e.g. `new Date("2026-12-12T09:00:00+05:30")`.
- The script loads at the end of `<body>`, so it doesn't need DOMContentLoaded wrappers.

### HTML and accessibility
- 2-space indentation and double-quoted attributes.
- Escape `&` as `&amp;` in text and attributes.
- Keep the existing ARIA wiring: `aria-expanded`/`aria-controls`/`aria-label` on `.nav-toggle`, `aria-live` on the countdown, `role="status"` on the form note, and `aria-hidden` on decorative elements.
- External links use `target="_blank" rel="noopener"`. Iframes need a `title` and `loading="lazy"`.
- Placeholder content uses `.photo-placeholder` figures or "TBA" / "will be shared soon" text. Replace it only with real details the user provides. Never invent times, contacts, hotels or names.

### Content consistency
Event names, dates and the venue appear in several places: the `<meta description>`, `<title>`, hero, event cards, the dress-code cards, FAQ, footer and the countdown in `main.js`. When one changes, update all of them.

## Known gaps
- Event times are TBA. Photos, story text, hotels, parking and contact details are still placeholders.
- The dress-code planner lists Mehendi and Reception, but they aren't in the Events schedule yet because their dates are unknown. The planner's Carnival, Vaidik Wedding and Varmala map to Haldi, Vidhi and Varmala & Wedding.
