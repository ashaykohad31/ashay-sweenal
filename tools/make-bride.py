#!/usr/bin/env python3
"""Make the bride's side pages from the main ones.

  /bride/         = index.html with Sweenal's name first
  /bride-events/  = events/index.html with Sweenal first and without the Reception (that is the groom's side)
  /bride-sangeet/ = /bride-events/ cut down to the Sangeet and the evening Varmala & Wedding only

Run it from the project folder after changing index.html or events/index.html:  python3 tools/make-bride.py
The two output pages are generated files: change the main pages, then run this again.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://sweenal-ashay.pages.dev"


def swap_names(s):
    s = s.replace("Ashay &amp; Sweenal", "Sweenal &amp; Ashay")
    s = s.replace("Ashay and Sweenal", "Sweenal and Ashay")
    s = s.replace("Ashay%20%26%20Sweenal", "Sweenal%20%26%20Ashay")
    s = s.replace("Ashay <span>&amp;</span> Sweenal", "Sweenal <span>&amp;</span> Ashay")
    s = s.replace("A<span>&amp;</span>S", "S<span>&amp;</span>A")
    # the big heading in the hero
    s, n = re.subn(
        r'(<h1>\s*)Ashay(\s*<span class="hero-amp">&amp;</span>\s*)Sweenal(\s*</h1>)',
        r"\1Sweenal\2Ashay\3",
        s,
    )
    assert n == 1, "hero heading not found"
    return s


def swap_two(s, pattern, what):
    """Swap the order of the two blocks that `pattern` finds side by side."""
    s, n = re.subn(pattern, r"\2\1", s, count=1, flags=re.S)
    assert n == 1, what + " not found"
    return s


def bride_first(s):
    s = swap_names(s)
    # the bride's family comes first
    s = swap_two(
        s,
        r'(\s*<div class="hosts-family">.*?</div>)(\s*<div class="hosts-family">.*?</div>)',
        "the two families",
    )
    # and her father's contact card comes first
    s = swap_two(
        s,
        r'(\s*<div class="info-card" data-tilt>\s*<h3>Ganesh Kohad</h3>.*?</div>\s*</div>)'
        r'(\s*<div class="info-card" data-tilt>\s*<h3>Prabhakar Umredkar</h3>.*?</div>\s*</div>)',
        "the two contact cards",
    )
    for old, new in [
        ("favicon.ico", "favicon-bride.ico"),
        ("favicon-32.png", "favicon-bride-32.png"),
        ("favicon-16.png", "favicon-bride-16.png"),
        ("apple-touch-icon.png", "apple-touch-icon-bride.png"),
    ]:
        s = s.replace(f'href="../{old}"', f'href="../{new}"')
    return s


# /bride/ from the main page: it sits one folder deeper, so its asset paths need ../
main = (ROOT / "index.html").read_text()
main = re.sub(
    r'(src|href|data-full)="((?:css/|js/|images/|audio/|favicon|apple-touch|icon-)[^"]*)"',
    r'\1="../\2"',
    main,
)
main = bride_first(main)
main = main.replace(f'{SITE}/images/share-wedding-3.jpg', f"{SITE}/images/share-bride-wedding.jpg")
main = main.replace(f'content="{SITE}/"', f'content="{SITE}/bride/"')
main = main.replace(f'href="{SITE}/"', f'href="{SITE}/bride/"')
(ROOT / "bride").mkdir(exist_ok=True)
(ROOT / "bride" / "index.html").write_text(main)

# /bride-events/ from the events page, without the Reception
ev = (ROOT / "events" / "index.html").read_text()
ev = bride_first(ev)

day = re.search(r'\s*<div class="event-day">\s*<h3 class="day-heading">Monday.*?</div>\s*</div>', ev, re.S)
assert day, "Monday event day not found"
ev = ev.replace(day.group(0), "", 1)
outfit = re.search(r'\s*<article class="outfit" style="--i: 5" data-tilt>.*?</article>', ev, re.S)
assert outfit and "Reception" in outfit.group(0), "Reception outfit not found"
ev = ev.replace(outfit.group(0), "", 1)

for old, new in [
    ("12–14 December 2026 · Haldi, Sangeet, Vidhi, Wedding &amp; Reception · Nagpur &amp; Wardha",
     "12–13 December 2026 · Haldi, Sangeet, Vidhi &amp; Wedding · Nagpur"),
    ("12 to 14 December 2026: Haldi, Sangeet, Vidhi, Wedding and Reception, in Nagpur and Wardha",
     "12 to 13 December 2026: Haldi, Sangeet, Vidhi and Wedding, in Nagpur"),
    ("Three days of celebration", "Two days of celebration"),
    ('data-end="2026-12-15T00:00:00+05:30"', 'data-end="2026-12-14T00:00:00+05:30"'),
    (f"{SITE}/images/share-events-2.jpg", f"{SITE}/images/share-bride-events.jpg"),
    (f'content="{SITE}/events/"', f'content="{SITE}/bride-events/"'),
    (f'href="{SITE}/events/"', f'href="{SITE}/bride-events/"'),
]:
    assert old in ev, old
    ev = ev.replace(old, new)
assert "Reception" not in ev and "Wardha" not in ev and "groom/" not in ev
(ROOT / "bride-events").mkdir(exist_ok=True)
(ROOT / "bride-events" / "index.html").write_text(ev)

# /bride-sangeet/ from /bride-events/: only the Sangeet and the evening Varmala & Wedding
sg = ev
for pat, what in [
    (r'\s*<article class="event-card event-haldi" data-tilt>.*?</article>', "Haldi card"),
    (r'\s*<article class="event-card event-vidhi" data-tilt>.*?</article>', "Vidhi card"),
    (r'\s*<article class="outfit" style="--i: 0" data-tilt>.*?</article>', "Mehendi outfit"),
    (r'\s*<article class="outfit" style="--i: 1" data-tilt>.*?</article>', "Carnival outfit"),
    (r'\s*<article class="outfit" style="--i: 3" data-tilt>.*?</article>', "Vaidik outfit"),
]:
    sg, n = re.subn(pat, "", sg, count=1, flags=re.S)
    assert n == 1, what + " not found"
sg = sg.replace('style="--i: 2" data-tilt', 'style="--i: 0" data-tilt').replace('style="--i: 4" data-tilt', 'style="--i: 1" data-tilt')
for old, new in [
    ("12–13 December 2026 · Haldi, Sangeet, Vidhi &amp; Wedding · Nagpur",
     "12–13 December 2026 · Sangeet &amp; Wedding · Nagpur"),
    ("12 to 13 December 2026: Haldi, Sangeet, Vidhi and Wedding, in Nagpur",
     "12 to 13 December 2026: Sangeet and Wedding, in Nagpur"),
    ('data-target="2026-12-12T12:30:00+05:30"', 'data-target="2026-12-12T18:30:00+05:30"'),
    (f"{SITE}/images/share-bride-events.jpg", f"{SITE}/images/share-bride-sangeet.jpg"),
    (f'content="{SITE}/bride-events/"', f'content="{SITE}/bride-sangeet/"'),
    (f'href="{SITE}/bride-events/"', f'href="{SITE}/bride-sangeet/"'),
    ("Festivities begin on the morning of 12 December. If you're\n              travelling, we suggest arriving in Nagpur by the evening of 11\n              December.",
     "The Sangeet is on the evening of 12 December. If you're\n              travelling, we suggest arriving in Nagpur by that afternoon."),
]:
    assert old in sg, old
    sg = sg.replace(old, new)
for gone in ["Haldi", "Vidhi", "Mehendi", "Carnival", "Vaidik"]:
    assert gone not in sg, gone
(ROOT / "bride-sangeet").mkdir(exist_ok=True)
(ROOT / "bride-sangeet" / "index.html").write_text(sg)
print("made bride/index.html, bride-events/index.html and bride-sangeet/index.html")
