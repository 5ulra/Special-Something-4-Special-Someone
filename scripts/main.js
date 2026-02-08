import { valentineDays } from "../days/dayData.js";

const elements = {
  siteLock: document.getElementById("siteLock"),
  siteLockForm: document.getElementById("siteLockForm"),
  sitePasscode: document.getElementById("sitePasscode"),
  siteLockError: document.getElementById("siteLockError"),
  weekYear: document.getElementById("weekYear"),
  beginJourney: document.getElementById("beginJourney"),
  timeline: document.getElementById("timeline"),
  timelineCards: document.getElementById("timelineCards"),
  dayModal: document.getElementById("dayModal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  closeDayTop: document.getElementById("closeDayTop"),
  backToTimeline: document.getElementById("backToTimeline"),
  dayDate: document.getElementById("dayDate"),
  dayTitle: document.getElementById("dayTitle"),
  dayTheme: document.getElementById("dayTheme"),
  fireworksCanvas: document.getElementById("fireworksCanvas"),
  dayImage: document.getElementById("dayImage"),
  dayVideo: document.getElementById("dayVideo"),
  imageCounter: document.getElementById("imageCounter"),
  dayMessage: document.getElementById("dayMessage"),
  prevImage: document.getElementById("prevImage"),
  nextImage: document.getElementById("nextImage"),
  ambientLayer: document.getElementById("ambientLayer")
};

let activeDay = null;
let activeImageIndex = 0;
let midnightTimer = 0;
const ACCESS_PASSWORD = "Bodi";
const FIREWORK_COLORS = ["#ff4f7a", "#ffd166", "#5eead4", "#60a5fa", "#f59e0b", "#e879f9"];
const fireworksState = {
  active: false,
  rafHandle: 0,
  lastTick: 0,
  nextLaunchAt: 0,
  rockets: [],
  particles: [],
  rings: [],
  flashes: [],
  width: 0,
  height: 0,
  dpr: 1
};

function getUnlockDate(dayOfMonth, now = new Date()) {
  return new Date(now.getFullYear(), 1, dayOfMonth, 0, 0, 0, 0);
}

function isDayUnlocked(day, now = new Date()) {
  return now.getTime() >= getUnlockDate(day.dayOfMonth, now).getTime();
}

function getUnlockMessage(day) {
  return `Unlocks at 12:00 AM on Feb ${day.dayOfMonth}`;
}

function getDisplayDate(day, year) {
  return `February ${day.dayOfMonth}, ${year}`;
}

function unlockSite() {
  document.body.classList.remove("locked");
  elements.siteLock?.setAttribute("hidden", "hidden");
}

function showLockError() {
  if (elements.siteLockError) {
    elements.siteLockError.hidden = false;
  }
}

function initializeSiteLock() {
  if (!elements.siteLockForm || !elements.sitePasscode) {
    return;
  }

  elements.sitePasscode.focus();

  elements.siteLockForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const entered = elements.sitePasscode?.value ?? "";
    if (entered.trim() === ACCESS_PASSWORD) {
      if (elements.siteLockError) {
        elements.siteLockError.hidden = true;
      }
      unlockSite();
      return;
    }

    showLockError();
    if (elements.sitePasscode) {
      elements.sitePasscode.value = "";
      elements.sitePasscode.focus();
    }
  });
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resizeFireworksCanvas() {
  if (!elements.fireworksCanvas) {
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  fireworksState.width = width;
  fireworksState.height = height;
  fireworksState.dpr = dpr;

  elements.fireworksCanvas.width = Math.floor(width * dpr);
  elements.fireworksCanvas.height = Math.floor(height * dpr);
  elements.fireworksCanvas.style.width = `${width}px`;
  elements.fireworksCanvas.style.height = `${height}px`;
}

function spawnFireworkRocket() {
  const height = fireworksState.height || window.innerHeight;
  const width = fireworksState.width || window.innerWidth;

  fireworksState.rockets.push({
    x: randomBetween(width * 0.1, width * 0.9),
    y: height + randomBetween(18, 50),
    vx: randomBetween(-56, 56),
    vy: randomBetween(-1040, -790),
    targetY: randomBetween(height * 0.1, height * 0.42),
    hue: randomBetween(0, 360),
    radius: randomBetween(2.6, 4.1),
    trail: [],
    trailMax: Math.round(randomBetween(8, 13))
  });
}

function burstFireworkRocket(rocket) {
  const count = Math.round(randomBetween(110, 172));
  const ringColor = FIREWORK_COLORS[Math.floor(randomBetween(0, FIREWORK_COLORS.length))];
  fireworksState.rings.push({
    x: rocket.x,
    y: rocket.y,
    radius: randomBetween(8, 24),
    life: 0,
    maxLife: randomBetween(0.46, 0.8),
    color: ringColor
  });

  fireworksState.flashes.push({
    x: rocket.x,
    y: rocket.y,
    life: 0,
    maxLife: randomBetween(0.1, 0.18),
    radius: randomBetween(80, 140),
    color: ringColor
  });

  for (let i = 0; i < count; i += 1) {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(170, 540);
    const color = FIREWORK_COLORS[i % FIREWORK_COLORS.length];
    fireworksState.particles.push({
      x: rocket.x,
      y: rocket.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: randomBetween(1.15, 2.25),
      radius: randomBetween(2, 4.8),
      color
    });
  }
}

function renderFireworksFrame(now) {
  if (!fireworksState.active || !elements.fireworksCanvas) {
    return;
  }

  const context = elements.fireworksCanvas.getContext("2d");
  if (!context) {
    return;
  }

  if (!fireworksState.lastTick) {
    fireworksState.lastTick = now;
  }

  const dt = Math.min(0.034, (now - fireworksState.lastTick) / 1000);
  fireworksState.lastTick = now;

  context.setTransform(fireworksState.dpr, 0, 0, fireworksState.dpr, 0, 0);
  context.clearRect(0, 0, fireworksState.width, fireworksState.height);
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "rgba(22, 12, 31, 0.16)";
  context.fillRect(0, 0, fireworksState.width, fireworksState.height);
  context.globalCompositeOperation = "lighter";

  if (now >= fireworksState.nextLaunchAt) {
    spawnFireworkRocket();
    if (Math.random() > 0.2) {
      spawnFireworkRocket();
    }
    if (Math.random() > 0.72) {
      spawnFireworkRocket();
    }
    fireworksState.nextLaunchAt = now + randomBetween(180, 430);
  }

  for (let i = fireworksState.rockets.length - 1; i >= 0; i -= 1) {
    const rocket = fireworksState.rockets[i];
    rocket.x += rocket.vx * dt;
    rocket.y += rocket.vy * dt;
    rocket.vx *= 0.997;
    rocket.vy += 360 * dt;

    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > rocket.trailMax) {
      rocket.trail.shift();
    }

    if (rocket.trail.length > 1) {
      context.beginPath();
      context.moveTo(rocket.trail[0].x, rocket.trail[0].y);
      for (let j = 1; j < rocket.trail.length; j += 1) {
        context.lineTo(rocket.trail[j].x, rocket.trail[j].y);
      }
      context.strokeStyle = `hsla(${rocket.hue}, 98%, 72%, 0.44)`;
      context.lineWidth = rocket.radius * 1.15;
      context.lineCap = "round";
      context.stroke();
    }

    context.fillStyle = `hsla(${rocket.hue}, 100%, 75%, 0.28)`;
    context.beginPath();
    context.arc(rocket.x, rocket.y, rocket.radius * 3.6, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = `hsla(${rocket.hue}, 94%, 70%, 0.95)`;
    context.beginPath();
    context.arc(rocket.x, rocket.y, rocket.radius, 0, Math.PI * 2);
    context.fill();

    if (rocket.y <= rocket.targetY || rocket.vy >= -38) {
      burstFireworkRocket(rocket);
      fireworksState.rockets.splice(i, 1);
    }
  }

  for (let i = fireworksState.rings.length - 1; i >= 0; i -= 1) {
    const ring = fireworksState.rings[i];
    ring.life += dt;
    if (ring.life >= ring.maxLife) {
      fireworksState.rings.splice(i, 1);
      continue;
    }

    const progress = ring.life / ring.maxLife;
    ring.radius += 620 * dt;
    context.strokeStyle = ring.color;
    context.globalAlpha = Math.max(0, (1 - progress) * 0.65);
    context.lineWidth = 4.4 * (1 - progress) + 1;
    context.beginPath();
    context.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
  }

  for (let i = fireworksState.flashes.length - 1; i >= 0; i -= 1) {
    const flash = fireworksState.flashes[i];
    flash.life += dt;
    if (flash.life >= flash.maxLife) {
      fireworksState.flashes.splice(i, 1);
      continue;
    }

    const progress = flash.life / flash.maxLife;
    const radius = flash.radius * (0.5 + progress);
    const gradient = context.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, radius);
    gradient.addColorStop(0, `rgba(255,255,255,${(1 - progress) * 0.38})`);
    gradient.addColorStop(0.35, `rgba(255,229,188,${(1 - progress) * 0.22})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
    context.fill();
  }

  if (fireworksState.particles.length > 2800) {
    fireworksState.particles.splice(0, fireworksState.particles.length - 2800);
  }

  for (let i = fireworksState.particles.length - 1; i >= 0; i -= 1) {
    const particle = fireworksState.particles[i];
    particle.life += dt;

    if (particle.life >= particle.maxLife) {
      fireworksState.particles.splice(i, 1);
      continue;
    }

    const progress = particle.life / particle.maxLife;
    const fade = clamp(1 - progress, 0, 1);
    particle.vx *= 0.986;
    particle.vy = particle.vy * 0.986 + 340 * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    context.strokeStyle = particle.color;
    context.globalAlpha = fade * 0.35;
    context.lineWidth = Math.max(1, particle.radius * 0.48);
    context.beginPath();
    context.moveTo(particle.x, particle.y);
    context.lineTo(particle.x - particle.vx * 0.013, particle.y - particle.vy * 0.013);
    context.stroke();

    context.fillStyle = particle.color;
    context.globalAlpha = fade * 0.24;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius * 2.35, 0, Math.PI * 2);
    context.fill();

    context.globalAlpha = fade * 0.96;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius * (1 - progress * 0.24), 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }

  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  fireworksState.rafHandle = window.requestAnimationFrame(renderFireworksFrame);
}

function startValentineFireworks() {
  if (!elements.dayModal || !elements.fireworksCanvas || fireworksState.active) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  fireworksState.active = true;
  fireworksState.lastTick = 0;
  fireworksState.nextLaunchAt = performance.now() + 120;
  fireworksState.rockets = [];
  fireworksState.particles = [];
  fireworksState.rings = [];
  fireworksState.flashes = [];
  elements.dayModal.classList.add("is-fireworks");

  resizeFireworksCanvas();
  window.addEventListener("resize", resizeFireworksCanvas);
  fireworksState.rafHandle = window.requestAnimationFrame(renderFireworksFrame);
}

function stopValentineFireworks() {
  if (!elements.dayModal || !elements.fireworksCanvas) {
    return;
  }

  fireworksState.active = false;
  fireworksState.lastTick = 0;
  fireworksState.nextLaunchAt = 0;
  fireworksState.rockets = [];
  fireworksState.particles = [];
  fireworksState.rings = [];
  fireworksState.flashes = [];

  if (fireworksState.rafHandle) {
    window.cancelAnimationFrame(fireworksState.rafHandle);
    fireworksState.rafHandle = 0;
  }

  window.removeEventListener("resize", resizeFireworksCanvas);
  elements.dayModal.classList.remove("is-fireworks");

  const context = elements.fireworksCanvas.getContext("2d");
  if (context) {
    context.setTransform(fireworksState.dpr, 0, 0, fireworksState.dpr, 0, 0);
    context.clearRect(0, 0, fireworksState.width || window.innerWidth, fireworksState.height || window.innerHeight);
  }
}

function renderTimeline() {
  if (!elements.timelineCards) {
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  elements.timelineCards.innerHTML = "";

  valentineDays.forEach((day, index) => {
    const unlocked = isDayUnlocked(day, now);
    const card = document.createElement("article");
    card.className = `timeline-card ${index % 2 === 0 ? "side-left" : "side-right"} ${
      unlocked ? "is-unlocked" : "is-locked"
    }`;
    card.style.setProperty("--delay", `${(index * 0.06).toFixed(2)}s`);
    card.dataset.dayId = day.id;
    card.dataset.unlocked = String(unlocked);

    const stateIcon = unlocked ? "🔓" : "🔒";
    const stateLabel = unlocked ? "Unlocked" : "Locked";

    card.innerHTML = `
      <p class="card-state"><span aria-hidden="true">${stateIcon}</span><span>${stateLabel}</span></p>
      <p class="card-date">${day.dateLabel}, ${year}</p>
      <h3 class="card-title">${day.title} ${day.emoji}</h3>
      <p class="card-theme">${day.theme}</p>
      <p class="card-snippet">${day.shortDisplay}</p>
      <p class="card-status">${unlocked ? "This memory is unlocked." : getUnlockMessage(day)}</p>
      ${unlocked ? '<button class="open-day" type="button">Open Day</button>' : ""}
    `;

    elements.timelineCards.append(card);
  });
}

function isVideoMedia(media) {
  if (!media || typeof media.src !== "string") {
    return false;
  }

  return media.type === "video" || /\.mp4($|\?)/i.test(media.src);
}

function renderActiveImage() {
  if (!activeDay || !elements.imageCounter) {
    return;
  }

  const media = activeDay.images[activeImageIndex];
  if (!media || (!elements.dayImage && !elements.dayVideo)) {
    return;
  }

  const showVideo = isVideoMedia(media);
  if (showVideo) {
    if (elements.dayImage) {
      elements.dayImage.style.display = "none";
    }

    if (elements.dayVideo) {
      elements.dayVideo.style.display = "block";
      if (elements.dayVideo.getAttribute("src") !== media.src) {
        elements.dayVideo.src = media.src;
      }
      elements.dayVideo.setAttribute("aria-label", media.alt || "");
      const playAttempt = elements.dayVideo.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {});
      }
    }
  } else {
    if (elements.dayVideo) {
      elements.dayVideo.pause();
      elements.dayVideo.removeAttribute("src");
      elements.dayVideo.load();
      elements.dayVideo.style.display = "none";
      elements.dayVideo.setAttribute("aria-label", "");
    }

    if (elements.dayImage) {
      elements.dayImage.style.display = "block";
      elements.dayImage.src = media.src;
      elements.dayImage.alt = media.alt || "";
    }
  }

  elements.imageCounter.textContent = `${activeImageIndex + 1} / ${activeDay.images.length}`;

  const hasMultiple = activeDay.images.length > 1;
  if (elements.prevImage) {
    elements.prevImage.disabled = !hasMultiple;
  }
  if (elements.nextImage) {
    elements.nextImage.disabled = !hasMultiple;
  }
}

function renderMessage() {
  if (!activeDay || !elements.dayMessage) {
    return;
  }

  elements.dayMessage.innerHTML = "";
  activeDay.message.forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    elements.dayMessage.append(p);
  });
}

function renderAmbient() {
  if (!activeDay || !elements.ambientLayer || !elements.dayModal) {
    return;
  }

  elements.dayModal.style.setProperty("--ambient-color", activeDay.ambientColor);
  elements.ambientLayer.innerHTML = "";

  const count = 12;
  for (let i = 0; i < count; i += 1) {
    const token = document.createElement("span");
    token.textContent = activeDay.ambientSymbol;
    token.style.setProperty("--x", `${Math.round(Math.random() * 100)}%`);
    token.style.setProperty("--y", `${65 + Math.round(Math.random() * 36)}%`);
    token.style.setProperty("--size", `${1 + Math.random() * 1.3}rem`);
    token.style.setProperty("--duration", `${10 + Math.random() * 8}s`);
    token.style.setProperty("--delay", `${Math.random() * -8}s`);
    elements.ambientLayer.append(token);
  }
}

function populateDayModal() {
  if (
    !activeDay ||
    !elements.dayDate ||
    !elements.dayTitle ||
    !elements.dayTheme ||
    !elements.dayModal
  ) {
    return;
  }

  const isValentineDay = activeDay.id === "valentines-day";
  elements.dayModal.classList.toggle("is-valentine", isValentineDay);
  if (isValentineDay) {
    startValentineFireworks();
  } else {
    stopValentineFireworks();
  }

  const year = new Date().getFullYear();
  elements.dayDate.textContent = getDisplayDate(activeDay, year);
  elements.dayTitle.textContent = `${activeDay.title} ${activeDay.emoji}`;
  elements.dayTheme.textContent = activeDay.theme;
  renderMessage();
  renderActiveImage();
  renderAmbient();
}

function openDay(dayId) {
  if (document.body.classList.contains("locked")) {
    return;
  }

  const day = valentineDays.find((item) => item.id === dayId);
  if (!day || !isDayUnlocked(day) || !elements.dayModal) {
    return;
  }

  activeDay = day;
  activeImageIndex = 0;
  populateDayModal();

  elements.dayModal.hidden = false;
  document.body.classList.add("modal-open");

  window.requestAnimationFrame(() => {
    elements.dayModal?.classList.add("is-open");
  });
}

function closeDayModal() {
  if (!elements.dayModal || elements.dayModal.hidden) {
    return;
  }

  elements.dayModal.classList.remove("is-open", "is-valentine");
  document.body.classList.remove("modal-open");
  stopValentineFireworks();

  if (elements.dayVideo) {
    elements.dayVideo.pause();
    elements.dayVideo.removeAttribute("src");
    elements.dayVideo.load();
    elements.dayVideo.style.display = "none";
  }

  if (elements.dayImage) {
    elements.dayImage.style.display = "block";
  }

  window.setTimeout(() => {
    if (elements.dayModal) {
      elements.dayModal.hidden = true;
    }
    if (elements.ambientLayer) {
      elements.ambientLayer.innerHTML = "";
    }
  }, 240);
}

function showPreviousImage() {
  if (!activeDay || activeDay.images.length < 2) {
    return;
  }

  activeImageIndex = (activeImageIndex - 1 + activeDay.images.length) % activeDay.images.length;
  renderActiveImage();
}

function showNextImage() {
  if (!activeDay || activeDay.images.length < 2) {
    return;
  }

  activeImageIndex = (activeImageIndex + 1) % activeDay.images.length;
  renderActiveImage();
}

function scheduleTimelineRefresh() {
  window.clearTimeout(midnightTimer);
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    1,
    0
  );

  midnightTimer = window.setTimeout(() => {
    renderTimeline();
    scheduleTimelineRefresh();
  }, nextMidnight.getTime() - now.getTime());
}

function attachEventListeners() {
  elements.beginJourney?.addEventListener("click", () => {
    elements.timeline?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.timelineCards?.addEventListener("click", (event) => {
    const card = event.target.closest(".timeline-card");
    if (!card || card.dataset.unlocked !== "true") {
      return;
    }

    openDay(card.dataset.dayId || "");
  });

  elements.closeDayTop?.addEventListener("click", closeDayModal);
  elements.backToTimeline?.addEventListener("click", closeDayModal);
  elements.modalBackdrop?.addEventListener("click", closeDayModal);
  elements.prevImage?.addEventListener("click", showPreviousImage);
  elements.nextImage?.addEventListener("click", showNextImage);

  document.addEventListener("keydown", (event) => {
    const modalOpen = Boolean(elements.dayModal && !elements.dayModal.hidden);

    if (event.key === "Escape" && modalOpen) {
      closeDayModal();
    }

    if (modalOpen && event.key === "ArrowLeft") {
      showPreviousImage();
    }

    if (modalOpen && event.key === "ArrowRight") {
      showNextImage();
    }
  });
}

function init() {
  const now = new Date();
  if (elements.weekYear) {
    elements.weekYear.textContent = String(now.getFullYear());
  }

  renderTimeline();
  scheduleTimelineRefresh();
  attachEventListeners();
  initializeSiteLock();
}

init();
