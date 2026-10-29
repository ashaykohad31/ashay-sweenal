# CLAUDE.md

Wedding website for **Sweenal & Ashay**: 12–13 December 2026, Queen's Land Celebration Lawn & Banquet, Nagpur. It's a small static site with two pages: a plain invitation at `/` and the full version at `/events/`.

## Stack

- Plain HTML, CSS and JavaScript. There is no build step, no package manager, no framework and no tests.
- `index.html`: the plain invitation: doors, hero (13 December 2026), The Wedding card (Varmala & Wedding, Sunday 13 December 2026, evening 5:45 PM) with a link to `/events/`, a dress code for that event only, plus Our Story, Venue (with map) and Memories. It deliberately leaves out the full event list, travel and FAQ, which live on `/events/`.
- `events/index.html`: the full version at `/events/` (no doors; asset paths start with `../`): hero, story timeline, events for both days, the whole dress-code planner, venue, travel, memories, FAQ and footer. It sets `invite-open` on `<html>` itself so the hero entrance plays.
- **Scope:** the site is only a wedding invitation and a place for memories. It collects nothing from guests: no RSVP, guest list, meal preferences or guestbook, and no backend. Don't add any of these unless the couple asks.
- `css/styles.css`: all styles, grouped under `/* Section */` comment headers in page order, with `/* Responsive */` at the end
- There is no top bar or nav menu, and the site is English only (a Marathi version was tried and removed at the couple's request).
- Music: `audio/music.m4a` (a 47-second AAC loop) plays from `<audio id="music">` on both pages. It starts when the seal is tapped (browsers block autoplay before a tap), `.music-toggle` in the corner mutes it, and the on/off choice and position are passed to the other page through `sessionStorage`.
- `js/main.js`: the countdown (with digit flip), the hero's canvas petal field, 3D card tilt, the dress-code ladies/gents flip, the story timeline's scroll-drawn line, the Memories lightbox (`<dialog>`, with swipe and arrow keys), scroll-reveal (IntersectionObserver), and the gold sparkle trail and tap bursts
- `images/outfits/`: `ladies-1…6.jpg` and `gents-1…6.jpg`, cropped from `outfit_code.jpeg` (the couple's wardrobe planner, which is the source of truth for dress codes)
- Fonts come from Google Fonts: Cinzel (`--font-display`, royal section headings), Pinyon Script (`--font-script`, calligraphy for the couple's names and accents such as the `&`), Cormorant Garamond (serif for card titles and numbers), Jost (body text) and Tiro Devanagari Sanskrit (for ॥ श्री गणेशाय नमः ॥).
- Ganesh ji sits at the top of the hero as a photo (`images/ganeshji.jpg`, resized from the couple's `ganeshji.png`) inside a round cream medallion (`.ganesh-medallion`), because the image has a white background.  The couple confirmed this is their personal, non-commercial wedding site, so the image and the music stay as they are and licensing isn't a concern. The top of the hero is where Ganesh ji traditionally appears on a wedding card. Treat it respectfully: keep it at the top and give it its own space, never use it as a casual decoration or at a small size elsewhere, and don't draw text or petals over it.

## Running locally

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Rules

### General
- Keep the site dependency-free. Don't add frameworks, bundlers, npm or CDN JS libraries unless asked.
- Keep it to these two pages. A new section is a `<section class="section reveal" id="...">` inside `<main>`. Alternate `section-tinted` so the backgrounds keep switching.
- Each section follows the same heading pattern: `<p class="section-eyebrow">` → `<h2>` → content.

### 3D and motion
- **Opening invitation:** the page loads behind a closed pair of doors (`#invite`): two `.invite-flap` doors with a gold double-line seam between them, a carved arch panel on each (`.door-panel`, which join into one arch when shut), brass studs, hinge plates and door rings, and a gold seal with the S&A initials on the seam. Don't put the names on the doors; the initials are enough. Tapping adds `invite-open` to `<html>`, which swings the doors open inwards (`rotateY(±78deg)`, hinged at the outer edges) and only then plays the hero entrance. A tiny inline script in `<head>` adds the `js` class, so the overlay never appears (or traps anyone) if JavaScript fails. While the card is closed, the header, main and footer are `inert`.
- **Add to calendar / Share:** the Wedding section has buttons that build a `.ics` file in the browser and open the phone's share sheet (or copy the link). Neither sends anything anywhere, so the "collect nothing" scope still holds. The `.ics` has no end time because none was given.
- **Scratch card:** in the hero, below the date and place, `#scratch` is a `<canvas>` of gold foil over "With love, you are invited". Scratching away 40% of it (or pressing Enter on it) adds `is-scratched` to `.hero`, which fades the rest of the foil away, starts the falling petals (the `#petals` canvas is fixed to the screen, so they fall down the whole page, and it stays hidden until then), and releases a petal burst. There are no corner florals; the couple asked for them to be removed.
- The look is "3D animated": a dark maroon hero with a canvas petal field and a pointer-tilted card, a 3D reveal on each section, tilt-and-glare cards, flip cards in the dress code, and a rotating gallery ring.
- Make a card tilt by adding `data-tilt`. main.js sets `--rx`/`--ry`/`--gx`/`--gy` on it. Tilt only runs for mouse pointers.
- In the dress code, `.wardrobe.is-gents` rotates every `.outfit-inner` to its back face. Keep `aria-hidden` on whichever face is hidden; main.js swaps it.
- Every animation must have a `prefers-reduced-motion` fallback. The gallery ring falls back to a grid, and the petals draw once without animating.
- Use `animation-fill-mode: backwards`, not `both`, on elements whose transform JS changes later.

### Adding photos
- **Story timeline:** the four photos are `images/story/1.jpg`, `2.jpg`, `3-engagement.jpg` and `4-sula.jpg` (600×750, cropped 4:5 so faces sit below the arched top). A new one is a `<figure class="photo-placeholder" data-tilt>` holding an `<img>` (cropped with `object-fit: cover`). Each `.moment` has a date, a title and a line of text.
- **Memories:** each photo is a `<button class="photo-placeholder memory" data-caption="…" data-full="images/memories/N.jpg">` containing a thumbnail `<img src="images/memories/N-thumb.jpg" alt="…">` (480×600, 4:5). `data-full` is the large version (max 1400px) that the lightbox opens. The 3D ring spaces its photos evenly from the `--n` count on `.carousel-ring` (currently 8, so 45° apart). When you add or remove photos, update `--n`, and raise `--ring-r` so neighbouring cards don't overlap (it needs roughly card width ÷ (2 × sin(180° ÷ n))).
- On `/events/` the same paths start with `../`.
- `images/varmala.png` is the couple's Varmala illustration with a transparent background (cut out from their screenshot, which stays git-ignored). It's used in the Varmala & Wedding event card and at the end of the story. `images/haldi.png` is the Haldi illustration (also cut out to transparent, white clothes kept) in the Haldi event card on `/events/`, `images/sangeet-couple.png` is the Sangeet illustration in the Sangeet card, and `images/vidhi-couple.png` is the Saptapadi illustration in the Vidhi card. `images/reception-couple.png` is the Wedding Reception illustration (cut out from a checkerboard background). All five event cards use the same `.event-art` frame (full width, 190px tall, `object-fit: contain`).
- Resize and crop before adding (no EXIF location, thumbnails under ~100 KB). Full-size originals dropped into `images/*.JPG` are git-ignored.
- **Loading:** the doors show "Loading…" until the fonts and the Ganesh ji photo are ready (4 seconds at most), then main.js quietly fetches the gallery photos and the music. Photos fade in once loaded via `is-loaded`.

### CSS
- Use the design tokens in `:root` (`--color-*`, `--font-*`, `--radius`, `--shadow`, `--max-width`). Don't hardcode new colours or fonts. If something new is genuinely needed, add a token.
- Palette (emerald-theme branch): pale mint-ivory background (`--color-bg`, `--color-tint`), deep emerald accent (`--color-accent`) and dark areas (`--color-night`, `--color-night-2`), gold highlights (`--color-gold`, `--color-gold-light`), and blush for ladies / sage for gents. The maroon now only appears in the Varmala illustration and the photos. On `main` the same tokens are cream, maroon and deep maroon.
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
- Keep the existing ARIA wiring: `aria-live` on the countdown, `role="status"` on the form note, and `aria-hidden` on decorative elements.
- External links use `target="_blank" rel="noopener"`. Iframes need a `title` and `loading="lazy"`.
- Placeholder content uses `.photo-placeholder` figures or "TBA" / "will be shared soon" text. Replace it only with real details the user provides. Never invent times, contacts, hotels or names.

### Content consistency
Event names, dates and the venue appear in several places, on both pages (`index.html` and `events/index.html`; the countdown target is the `data-target` on `#countdown`, which differs per page): the `<meta description>`, `<title>`, hero, event cards, the dress-code cards, FAQ, footer and the countdown in `main.js`. When one changes, update all of them.

## Known gaps
- The couple changed the Varmala & Wedding dress code for ladies from "lehenga only" to "lehenga or saree", and for men to "suit, bandhgala or Jodhpuri" (it differs from outfit_code.jpeg, which is now out of date on this point).
- Event times are all set: Haldi 12:30 PM, Sangeet 6:30 PM (12 Dec); Vidhi 9:45 AM, Varmala & Wedding 5:45 PM (13 Dec); Wedding Reception 7:00 PM (date still unknown). Parking details, the Nashik trip date and the other events' times are still placeholders. Stay is available at the venue; the families' contacts (Ganesh Kohad, father of the groom, +91 99706 25637; Prabhakar Umredkar, father of the bride, +91 77578 85815) are in the Contact section with call and WhatsApp buttons.
- The Wedding Reception is on `/events/` under "Date to be announced" (its time is 7:00 PM, but its date and venue are still unknown, so the group says "Date to be announced" and the card says "Venue to be shared"). The dress-code planner also lists Mehendi, which isn't in the Events schedule yet because its date is unknown. The planner's Carnival, Vaidik Wedding and Varmala map to Haldi, Vidhi and Varmala & Wedding.
