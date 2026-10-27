const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

// Opening invitation: tap the seal (or anywhere) and the two flaps swing open
const invite = document.getElementById("invite");
const pageParts = document.querySelectorAll(".site-header, main, .site-footer");

pageParts.forEach((el) => (el.inert = true));
document.getElementById("invite-seal").focus({ preventScroll: true });

function openInvite() {
  const root = document.documentElement;
  if (root.classList.contains("invite-open")) return;
  root.classList.add("invite-open");
  pageParts.forEach((el) => (el.inert = false));
  setTimeout(() => (invite.hidden = true), reduceMotion ? 600 : 2000);
}

invite.addEventListener("click", openInvite);

// Countdown to the first event (12 Dec 2026, Nagpur is IST / UTC+5:30)
const weddingStart = new Date("2026-12-12T09:00:00+05:30");

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
    document.getElementById("countdown").textContent = "The celebrations have begun!";
    clearInterval(countdownTimer);
  }
}

const countdownTimer = setInterval(updateCountdown, 1000);
updateCountdown();

// Mobile menu
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.getElementById("nav-links");

navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

navLinks.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

// Hero: 3D petal field on a canvas, with the camera following the pointer
const hero = document.getElementById("home");
const heroCard = document.getElementById("hero-card");
const canvas = document.getElementById("petals");
const ctx = canvas.getContext("2d");
const petalColors = ["#f2a03d", "#f7c948", "#e8708a", "#f4b6c2", "#e6c27a"];
const camera = { x: 0, y: 0, tx: 0, ty: 0 };
let petals = [];
let canvasW = 0;
let canvasH = 0;
let heroVisible = true;

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
  if (reduceMotion) drawPetals(false);
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
    ctx.globalAlpha = 0.25 + 0.65 * depth;

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
  if (heroVisible) drawPetals(true);
  requestAnimationFrame(animatePetals);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

if (!reduceMotion) {
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
  }).observe(hero);
  requestAnimationFrame(animatePetals);

  if (finePointer) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      camera.tx = px * 2;
      camera.ty = py * 2;
      heroCard.style.setProperty("--ry", `${px * 14}deg`);
      heroCard.style.setProperty("--rx", `${-py * 10}deg`);
    });

    hero.addEventListener("pointerleave", () => {
      camera.tx = 0;
      camera.ty = 0;
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

if (!reduceMotion) {
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
  { threshold: 0.08 }
);

document.querySelectorAll(".reveal, .moment").forEach((el) => observer.observe(el));
