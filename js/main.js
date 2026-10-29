const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

// Opening invitation: tap the seal and the two doors swing open
const invite = document.getElementById("invite");
const pageParts = document.querySelectorAll("main, .site-footer");

// every page has the doors, but the guard keeps a missing #invite from breaking the rest
if (invite) {
  pageParts.forEach((el) => (el.inert = true));
  document.getElementById("invite-seal").focus({ preventScroll: true });
  invite.addEventListener("click", openInvite);
}

function openInvite() {
  const root = document.documentElement;
  if (root.classList.contains("invite-open") || invite.classList.contains("is-loading")) return;
  root.classList.add("invite-open");
  if (readMusicState() !== "off") {
    // carry on from where the other page's music stopped
    const resumeAt = Number(readSaved("musicTime")) || 0;
    if (resumeAt > 0 && music.currentTime < 1) music.currentTime = resumeAt;
    playMusic();
  }
  pageParts.forEach((el) => (el.inert = false));
  setTimeout(() => (invite.hidden = true), reduceMotion ? 600 : 2200);
}

// Smooth start: the doors wait (up to 4 seconds) for the fonts and the Ganesh ji photo, then the
// gallery photos and the music are fetched quietly, so nothing hitches when the doors open
const ganeshPhoto = document.querySelector(".ganesh-medallion img");
const criticalAssets = Promise.all([document.fonts.ready, ganeshPhoto.decode().catch(() => {})]);

Promise.race([criticalAssets, new Promise((resolve) => setTimeout(resolve, 4000))]).then(() => {
  if (invite) {
    invite.classList.remove("is-loading");
    invite.querySelector(".invite-hint").textContent = "Tap to open";
  }
  const warmUp = () => {
    document.querySelectorAll(".moment img, .memory img, .couple-portrait img").forEach((img) => {
      new Image().src = img.currentSrc || img.src;
    });
    document.getElementById("music").preload = "auto";
  };
  if ("requestIdleCallback" in window) requestIdleCallback(warmUp);
  else setTimeout(warmUp, 500);
});

// photos fade in as they arrive instead of popping in
document.querySelectorAll(".moment img, .memory img, .couple-portrait img").forEach((img) => {
  const show = () => img.classList.add("is-loaded");
  if (img.complete) show();
  else img.addEventListener("load", show, { once: true });
});

// Music: starts when the seal is tapped (browsers need a tap first); the corner button mutes it,
// and the choice and position carry over to the other page
const music = document.getElementById("music");
const musicToggle = document.getElementById("music-toggle");
const musicLevel = 0.6;
let musicGain = null;
music.volume = musicLevel;
// iPhones ignore audio.volume (it always reads back 1), so there the level is set with a Web Audio gain instead
const volumeIsLocked = Math.abs(music.volume - musicLevel) > 0.01;

function capMusicVolume() {
  if (!volumeIsLocked || musicGain) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const gain = context.createGain();
  gain.gain.value = musicLevel;
  context.createMediaElementSource(music).connect(gain).connect(context.destination);
  musicGain = context;
}

function readSaved(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null; // storage blocked: treat as no saved choice
  }
}

function readMusicState() {
  return readSaved("music");
}

function saveMusic(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    // the choice just won't carry over to the other page
  }
}

function showMusicState(playing) {
  musicToggle.classList.toggle("is-playing", playing);
  musicToggle.setAttribute("aria-pressed", String(playing));
  musicToggle.setAttribute("aria-label", playing ? "Mute music" : "Play music");
}

function playMusic() {
  capMusicVolume();
  if (musicGain) musicGain.resume();
  music
    .play()
    .then(() => {
      saveMusic("music", "on");
      showMusicState(true);
    })
    .catch(() => showMusicState(false));
}

musicToggle.addEventListener("click", () => {
  if (music.paused) {
    saveMusic("music", "on");
    playMusic();
  } else {
    saveMusic("music", "off");
    music.pause();
    showMusicState(false);
  }
});

// the track plays once: when it ends the button goes back to "off", and the other pages won't start it again
music.addEventListener("ended", () => {
  saveMusic("music", "off");
  showMusicState(false);
});

window.addEventListener("pagehide", () => saveMusic("musicTime", String(music.currentTime)));

// Hero scratch card: rub away the gold foil to reveal "With love, you are invited"
const hero = document.getElementById("home");
const scratch = document.getElementById("scratch");
const scratchCanvas = document.getElementById("scratch-canvas");

// petals fly out of the scratch card when it is revealed
function burstPetals() {
  const box = scratch.getBoundingClientRect();
  for (let i = 0; i < 28; i++) {
    const petal = document.createElement("span");
    petal.className = "burst-petal";
    petal.style.setProperty("--x", `${box.left + box.width / 2}px`);
    petal.style.setProperty("--y", `${box.top + box.height / 2}px`);
    petal.style.setProperty("--dx", `${(Math.random() - 0.5) * window.innerWidth * 0.9}px`);
    petal.style.setProperty("--dy", `${(Math.random() - 0.3) * window.innerHeight * 0.7}px`);
    petal.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    petal.style.setProperty("--t", `${1.6 + Math.random() * 1.2}s`);
    petal.addEventListener("animationend", () => petal.remove());
    document.body.appendChild(petal);
  }
}

// Sky shots: one volley of fireworks from the bottom left and right corners, fired when the card is revealed
function launchSkyShots() {
  const sky = document.createElement("canvas");
  sky.className = "skyshot-canvas";
  sky.setAttribute("aria-hidden", "true");
  document.body.appendChild(sky);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  sky.width = w * dpr;
  sky.height = h * dpr;
  const g = sky.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colors = ["#e6c27a", "#f2a03d", "#f7c948", "#e8708a", "#f4b6c2", "#ffffff"];
  const pick = () => colors[Math.floor(Math.random() * colors.length)];
  const scale = Math.min(w, h) / 700; // keeps the bursts in proportion on phones
  const gravity = 520;
  const rockets = [];
  const sparks = [];

  // three rockets from each side, a little apart in time, leaning in towards the middle
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 3; i++) {
      const apex = h * (0.42 + Math.random() * 0.25);
      rockets.push({
        x: side < 0 ? w * 0.04 : w * 0.96,
        y: h,
        vx: -side * w * (0.05 + Math.random() * 0.08),
        vy: -Math.sqrt(2 * gravity * apex),
        wait: i * 0.4 + Math.random() * 0.15,
        color: pick(),
      });
    }
  });

  const burst = (x, y, color) => {
    const count = 70 + Math.floor(Math.random() * 30);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      const speed = (90 + Math.random() * 190) * scale;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        ttl: 1.1 + Math.random() * 0.8,
        size: 1.5 + Math.random() * 1.5,
        color: Math.random() < 0.7 ? color : pick(),
      });
    }
  };

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = "lighter";

    rockets.forEach((r) => {
      if (r.done) return;
      if (r.wait > 0) {
        r.wait -= dt;
        return;
      }
      r.vy += gravity * dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      // a short glowing tail behind the rocket
      sparks.push({ x: r.x, y: r.y, vx: 0, vy: 30, life: 0, ttl: 0.35, size: 2, color: r.color });
      if (r.vy >= -20) {
        r.done = true;
        burst(r.x, r.y, r.color);
      }
    });

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      if (s.life >= s.ttl) {
        sparks.splice(i, 1);
        continue;
      }
      s.vx *= 0.985;
      s.vy += gravity * 0.35 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      g.globalAlpha = 1 - s.life / s.ttl;
      g.fillStyle = s.color;
      g.beginPath();
      g.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      g.fill();
    }

    if (rockets.some((r) => !r.done) || sparks.length) requestAnimationFrame(frame);
    else sky.remove();
  }
  requestAnimationFrame(frame);
}

function revealInvite() {
  if (hero.classList.contains("is-scratched")) return;
  hero.classList.add("is-scratched");
  scratch.removeAttribute("aria-label");
  scratch.removeAttribute("role");
  scratch.removeAttribute("tabindex");
  if (reduceMotion) {
    hero.classList.add("is-petalling");
    drawPetals(false);
  } else {
    // the sky shots go off first; the first one bursts about 1.3 seconds after launch, then the petals start
    launchSkyShots();
    setTimeout(() => {
      hero.classList.add("is-petalling");
      burstPetals();
    }, 1500);
  }
}

// gold foil over the text, rubbed away with a finger or mouse
const scratchCtx = scratchCanvas.getContext("2d", { willReadFrequently: true });
const dpr = Math.min(window.devicePixelRatio || 1, 2);
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function paintFoil() {
  scratchCanvas.width = Math.round(scratch.clientWidth * dpr);
  scratchCanvas.height = Math.round(scratch.clientHeight * dpr);
  const foil = scratchCtx.createLinearGradient(0, 0, scratchCanvas.width, scratchCanvas.height);
  foil.addColorStop(0, cssVar("--color-gold"));
  foil.addColorStop(0.5, cssVar("--color-gold-light"));
  foil.addColorStop(1, cssVar("--color-gold"));
  scratchCtx.fillStyle = foil;
  scratchCtx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);
  scratchCtx.fillStyle = cssVar("--color-night-2");
  scratchCtx.font = `500 ${12 * dpr}px ${cssVar("--font-sans")}`;
  scratchCtx.textAlign = "center";
  scratchCtx.textBaseline = "middle";
  scratchCtx.fillText("SCRATCH HERE", scratchCanvas.width / 2, scratchCanvas.height / 2);
}

function scratchedShare() {
  const { data } = scratchCtx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
  let cleared = 0;
  let total = 0;
  for (let i = 3; i < data.length; i += 16) {
    total++;
    if (data[i] === 0) cleared++;
  }
  return cleared / total;
}

let last = null;
let strokes = 0;

function scratchTo(event) {
  const box = scratchCanvas.getBoundingClientRect();
  const x = ((event.clientX - box.left) / box.width) * scratchCanvas.width;
  const y = ((event.clientY - box.top) / box.height) * scratchCanvas.height;
  scratchCtx.globalCompositeOperation = "destination-out";
  scratchCtx.lineWidth = 26 * dpr;
  scratchCtx.lineCap = "round";
  scratchCtx.beginPath();
  scratchCtx.moveTo(last ? last.x : x, last ? last.y : y);
  scratchCtx.lineTo(x, y);
  scratchCtx.stroke();
  last = { x, y };
  if (++strokes % 6 === 0 && scratchedShare() > 0.4) revealInvite();
}

document.fonts.ready.then(paintFoil);

scratchCanvas.addEventListener("pointerdown", (event) => {
  scratchCanvas.setPointerCapture(event.pointerId);
  last = null;
  scratchTo(event);
});

scratchCanvas.addEventListener("pointermove", (event) => {
  if (scratchCanvas.hasPointerCapture(event.pointerId)) scratchTo(event);
});

scratch.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    revealInvite();
  }
});

// Countdown to the date in data-target (the plain page counts to the wedding, the events page to the first event; IST is UTC+5:30)
const weddingStart = new Date(document.getElementById("countdown").dataset.target);
const weddingEnd = new Date(document.getElementById("countdown").dataset.end);

const cd = {
  days: document.getElementById("cd-days"),
  hours: document.getElementById("cd-hours"),
  mins: document.getElementById("cd-mins"),
  secs: document.getElementById("cd-secs"),
};

function setUnit(el, value) {
  if (el.textContent === value) return;
  el.textContent = value;
  el.classList.remove("is-flipping");
  void el.offsetWidth; // restart the flip animation
  el.classList.add("is-flipping");
}

function updateCountdown() {
  const diff = Math.max(0, weddingStart - Date.now());
  const pad = (n) => String(n).padStart(2, "0");

  setUnit(cd.days, String(Math.floor(diff / 86400000)));
  setUnit(cd.hours, pad(Math.floor(diff / 3600000) % 24));
  setUnit(cd.mins, pad(Math.floor(diff / 60000) % 60));
  setUnit(cd.secs, pad(Math.floor(diff / 1000) % 60));

  if (diff === 0) {
    const over = Date.now() >= weddingEnd;
    document.getElementById("countdown").textContent = over
      ? "Thank you for celebrating with us!"
      : "The celebrations have begun!";
    if (over) clearInterval(countdownTimer);
  }
}

const countdownTimer = setInterval(updateCountdown, 1000);
updateCountdown();

// Petals: a 3D petal field on a screen-sized canvas (it starts falling right after the sky shots, once the scratch card is revealed, and keeps falling down the whole page), with the camera following the pointer
const heroCard = document.getElementById("hero-card");
const canvas = document.getElementById("petals");
const ctx = canvas.getContext("2d");
const petalColors = ["#f2a03d", "#f7c948", "#e8708a", "#f4b6c2", "#e6c27a"];
const camera = { x: 0, y: 0, tx: 0, ty: 0 };
let petals = [];
let canvasW = 0;
let canvasH = 0;

function makePetal(anywhere) {
  return {
    x: Math.random() * 2 - 1,
    y: anywhere ? Math.random() * 2.4 - 1.2 : -1.2,
    z: Math.random(), // 0 = near, 1 = far
    size: 5 + Math.random() * 8,
    spin: Math.random() * Math.PI * 2,
    spinSpeed: 0.005 + Math.random() * 0.02,
    tumble: Math.random() * Math.PI * 2,
    tumbleSpeed: 0.01 + Math.random() * 0.03,
    sway: Math.random() * Math.PI * 2,
    fall: 0.0012 + Math.random() * 0.0016,
    color: petalColors[Math.floor(Math.random() * petalColors.length)],
    sparkle: Math.random() < 0.3,
  };
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasW = canvas.clientWidth;
  canvasH = canvas.clientHeight;
  canvas.width = canvasW * dpr;
  canvas.height = canvasH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Only rebuild on a real size change, so mobile URL-bar resizes don't reset the petals
  const count = canvasW < 760 ? 40 : 80;
  if (petals.length !== count) {
    petals = Array.from({ length: count }, () => makePetal(true));
    petals.sort((a, b) => b.z - a.z); // draw far petals first
  }
  if (reduceMotion && hero.classList.contains("is-petalling")) drawPetals(false);
}

function drawPetals(step) {
  ctx.clearRect(0, 0, canvasW, canvasH);
  camera.x += (camera.tx - camera.x) * 0.05;
  camera.y += (camera.ty - camera.y) * 0.05;

  petals.forEach((p) => {
    if (step) {
      const depth = 1 - p.z * 0.6;
      p.y += p.fall * depth;
      p.sway += 0.012;
      p.spin += p.spinSpeed;
      p.tumble += p.tumbleSpeed;
      if (p.y > 1.25) Object.assign(p, makePetal(false), { z: p.z });
    }

    const depth = 1 - p.z * 0.6; // nearer petals are bigger, brighter and move more
    const sx = canvasW / 2 + p.x * canvasW * 0.55 + Math.sin(p.sway) * 18 - camera.x * 70 * depth;
    const sy = canvasH / 2 + p.y * canvasH * 0.5 - camera.y * 40 * depth;
    const size = p.size * depth;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(p.spin);
    ctx.globalAlpha = 0.2 + 0.55 * depth;

    if (p.sparkle) {
      const twinkle = 0.5 + 0.5 * Math.sin(p.tumble * 2);
      ctx.globalAlpha *= twinkle;
      ctx.fillStyle = "#f3d58c";
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.6);
      ctx.lineTo(size * 0.12, -size * 0.12);
      ctx.lineTo(size * 0.6, 0);
      ctx.lineTo(size * 0.12, size * 0.12);
      ctx.lineTo(0, size * 0.6);
      ctx.lineTo(-size * 0.12, size * 0.12);
      ctx.lineTo(-size * 0.6, 0);
      ctx.lineTo(-size * 0.12, -size * 0.12);
      ctx.closePath();
      ctx.fill();
    } else {
      // squash one axis by cos() so the petal looks like it's tumbling in 3D
      const flat = Math.abs(Math.cos(p.tumble)) * 0.55 + 0.08;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * flat, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function animatePetals() {
  if (hero.classList.contains("is-petalling")) drawPetals(true);
  requestAnimationFrame(animatePetals);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

if (!reduceMotion) {
  requestAnimationFrame(animatePetals);

  if (finePointer) {
    // the petals' camera follows the pointer anywhere on the page
    document.addEventListener("pointermove", (e) => {
      camera.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      camera.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // the hero card still tilts toward the pointer while it is over the hero
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      heroCard.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
      heroCard.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 10}deg`);
    });

    hero.addEventListener("pointerleave", () => {
      heroCard.style.setProperty("--ry", "0deg");
      heroCard.style.setProperty("--rx", "0deg");
    });
  }
}

// 3D tilt with a light glare on cards (mouse only)
if (finePointer && !reduceMotion) {
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
      el.style.setProperty("--rx", `${(0.5 - py) * 12}deg`);
      el.style.setProperty("--gx", `${px * 100}%`);
      el.style.setProperty("--gy", `${py * 100}%`);
      el.classList.add("is-tilting");
    });

    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--rx", "0deg");
      el.classList.remove("is-tilting");
    });
  });
}

// Dress code: flip every outfit card between ladies and gentlemen
const wardrobe = document.getElementById("wardrobe");
const sideButtons = document.querySelectorAll(".wardrobe-toggle button");

sideButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const gents = button.dataset.side === "gents";
    wardrobe.classList.toggle("is-gents", gents);

    sideButtons.forEach((b) => {
      const active = b === button;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    wardrobe.querySelectorAll(".outfit-ladies").forEach((face) => {
      face.setAttribute("aria-hidden", String(gents));
    });
    wardrobe.querySelectorAll(".outfit-gents").forEach((face) => {
      face.setAttribute("aria-hidden", String(!gents));
    });
  });
});

// Our Story: the timeline line fills in as you scroll
const timeline = document.getElementById("timeline");
let timelineTicking = false;

function updateTimeline() {
  const r = timeline.getBoundingClientRect();
  const progress = (window.innerHeight * 0.6 - r.top) / r.height;
  timeline.style.setProperty("--progress", Math.min(1, Math.max(0, progress)).toFixed(3));
  timelineTicking = false;
}

if (timeline && !reduceMotion) {
  window.addEventListener(
    "scroll",
    () => {
      if (timelineTicking) return;
      timelineTicking = true;
      requestAnimationFrame(updateTimeline);
    },
    { passive: true }
  );
  updateTimeline();
}

// Memories: open any photo full screen, then swipe, use the arrows or the keyboard
if (document.getElementById("lightbox")) {
  const lightbox = document.getElementById("lightbox");
  const lightboxMedia = document.getElementById("lightbox-media");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxCount = document.getElementById("lightbox-count");
  const memories = Array.from(document.querySelectorAll(".memory"));
  let currentMemory = 0;

  function showMemory(index, direction) {
    currentMemory = (index + memories.length) % memories.length;
    const item = memories[currentMemory];
    const thumb = item.querySelector("img");
    let media;

    if (thumb) {
      media = document.createElement("img");
      media.src = item.dataset.full || thumb.src;
      media.alt = thumb.alt;
    } else {
      media = document.createElement("div");
      media.className = "photo-placeholder";
      media.textContent = item.dataset.caption;
    }

    // fetch the neighbouring photos now so swiping feels instant
  [currentMemory - 1, currentMemory + 1].forEach((n) => {
    const near = memories[(n + memories.length) % memories.length];
    if (near.dataset.full) new Image().src = near.dataset.full;
  });

  lightboxMedia.replaceChildren(media);
    lightboxCaption.textContent = item.dataset.caption || "";
    lightboxCount.textContent = `${currentMemory + 1} / ${memories.length}`;
    lightboxMedia.style.setProperty("--from", `${direction * 35}deg`);
    lightboxMedia.classList.remove("is-entering");
    void lightboxMedia.offsetWidth; // restart the entrance animation
    lightboxMedia.classList.add("is-entering");
  }

  memories.forEach((item, i) => {
    item.addEventListener("click", () => {
      showMemory(i, 0);
      lightbox.showModal();
    });
  });

  lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showMemory(currentMemory - 1, -1));
  lightbox.querySelector(".lightbox-next").addEventListener("click", () => showMemory(currentMemory + 1, 1));
  lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());

  let justSwiped = false;
  lightbox.addEventListener("click", (e) => {
    if (justSwiped) {
      justSwiped = false; // a swipe that ends on the backdrop shouldn't close the viewer
      return;
    }
    if (e.target === lightbox) lightbox.close();
  });

  lightbox.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") showMemory(currentMemory - 1, -1);
    if (e.key === "ArrowRight") showMemory(currentMemory + 1, 1);
  });

  let swipeStartX = null;
  lightbox.addEventListener("pointerdown", (e) => {
    swipeStartX = e.clientX;
  });
  lightbox.addEventListener("pointerup", (e) => {
    if (swipeStartX === null) return;
    const dx = e.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(dx) > 50) {
      justSwiped = true;
      showMemory(currentMemory + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }
  });
}

// Fade sections and story moments in on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  // reveal as soon as any part is about to come on screen: a ratio threshold never fires for a very tall section on a phone
  { threshold: 0, rootMargin: "0px 0px -8% 0px" }
);

document.querySelectorAll(".reveal, .moment").forEach((el) => observer.observe(el));

// Sparkles: gold stars follow the mouse and burst wherever you tap
if (!reduceMotion) {
  const sparkle = (x, y, reach, size) => {
    const star = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = reach * (0.4 + Math.random() * 0.6);
    star.className = "sparkle";
    star.style.setProperty("--x", `${x}px`);
    star.style.setProperty("--y", `${y}px`);
    star.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    star.style.setProperty("--dy", `${Math.sin(angle) * distance + 10}px`);
    star.style.setProperty("--size", `${size * (0.6 + Math.random() * 0.8)}px`);
    star.addEventListener("animationend", () => star.remove());
    document.body.appendChild(star);
  };

  let lastTrail = 0;
  if (finePointer) {
    document.addEventListener("pointermove", (e) => {
      const now = performance.now();
      if (now - lastTrail < 70) return;
      lastTrail = now;
      sparkle(e.clientX, e.clientY, 24, 9);
    });
  }

  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".scratch")) return;
    for (let i = 0; i < 9; i++) sparkle(e.clientX, e.clientY, 60, 12);
  });
}

// Add to calendar: the .ics file is built right in the browser, nothing is sent anywhere
const calendarButton = document.getElementById("add-calendar");
const shareButton = document.getElementById("share-invite");
const shareNote = document.getElementById("share-note");
let noteTimer;

function showNote(message) {
  shareNote.textContent = message;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => (shareNote.textContent = ""), 3500);
}

if (calendarButton) {
  // each page describes its own event in data-* attributes on the button
  calendarButton.addEventListener("click", () => {
    const { start, title, description, location: place, file } = calendarButton.dataset;
    const stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
    const utc = (iso) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");
    const icsEscape = (text) => text.replace(/[,;]/g, "\\$&");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Ashay and Sweenal//Invitation//EN",
      "BEGIN:VEVENT",
      `UID:${utc(start)}@sweenal-ashay`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${utc(start)}`,
      `SUMMARY:${icsEscape(title)}`,
    ];
    if (place) lines.push(`LOCATION:${icsEscape(place)}`);
    if (description) lines.push(`DESCRIPTION:${icsEscape(description)}`);
    lines.push("END:VEVENT", "END:VCALENDAR");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
    link.download = file;
    link.click();
    URL.revokeObjectURL(link.href);
    showNote("Opening your calendar…");
  });
}

// Share: the phone's share sheet where there is one, otherwise copy the link
if (shareButton) {
  shareButton.addEventListener("click", async () => {
    const data = {
      title: shareButton.dataset.title,
      text: shareButton.dataset.text,
      url: location.href.split("#")[0],
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(data.url);
        showNote("Link copied!");
      }
    } catch (e) {
      if (e.name !== "AbortError") showNote("Copy this page's address to share it.");
    }
  });
}
