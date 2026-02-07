import { valentineDays } from "../days/dayData.js";

const elements = {
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
  dayImage: document.getElementById("dayImage"),
  imageCounter: document.getElementById("imageCounter"),
  dayMessage: document.getElementById("dayMessage"),
  prevImage: document.getElementById("prevImage"),
  nextImage: document.getElementById("nextImage"),
  ambientLayer: document.getElementById("ambientLayer"),
  musicToggle: document.getElementById("musicToggle"),
  musicToggleLabel: document.getElementById("musicToggleLabel")
};

const MUSIC_TRACK_FILE = "It's Been a Long, Long Time (Instrumental) - Harry James & Kitty Kallen.mp3";
const TARGET_MUSIC_VOLUME = 0.12;
const TOGGLE_FADE_DURATION_MS = 900;
const DEFAULT_CROSSFADE_SECONDS = 5;

const audioState = {
  enabled: false,
  activeTrack: null,
  standbyTrack: null,
  playersReady: false,
  fadeHandle: 0,
  crossfadeHandle: 0,
  isCrossfading: false
};

let activeDay = null;
let activeImageIndex = 0;
let midnightTimer = 0;

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

function renderActiveImage() {
  if (!activeDay || !elements.dayImage || !elements.imageCounter) {
    return;
  }

  const image = activeDay.images[activeImageIndex];
  elements.dayImage.src = image.src;
  elements.dayImage.alt = image.alt;
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
  if (!activeDay || !elements.dayDate || !elements.dayTitle || !elements.dayTheme) {
    return;
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

  elements.dayModal.classList.remove("is-open");
  document.body.classList.remove("modal-open");

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

function clearAudioAnimationHandles() {
  if (audioState.fadeHandle) {
    window.cancelAnimationFrame(audioState.fadeHandle);
    audioState.fadeHandle = 0;
  }

  if (audioState.crossfadeHandle) {
    window.cancelAnimationFrame(audioState.crossfadeHandle);
    audioState.crossfadeHandle = 0;
  }
}

function getCrossfadeWindowSeconds(track) {
  if (!track || !Number.isFinite(track.duration) || track.duration <= 0) {
    return DEFAULT_CROSSFADE_SECONDS;
  }

  return Math.min(DEFAULT_CROSSFADE_SECONDS, Math.max(1.4, track.duration * 0.22));
}

function animateTrackVolumes(transitions, durationMs, onComplete) {
  if (!transitions.length) {
    onComplete?.();
    return;
  }

  if (audioState.fadeHandle) {
    window.cancelAnimationFrame(audioState.fadeHandle);
    audioState.fadeHandle = 0;
  }

  const startedAt = performance.now();
  const safeDuration = Math.max(120, durationMs);

  const frame = (now) => {
    const progress = Math.min(1, (now - startedAt) / safeDuration);
    transitions.forEach(({ track, from, to }) => {
      if (!track) {
        return;
      }
      track.volume = from + (to - from) * progress;
    });

    if (progress < 1) {
      audioState.fadeHandle = window.requestAnimationFrame(frame);
      return;
    }

    audioState.fadeHandle = 0;
    onComplete?.();
  };

  audioState.fadeHandle = window.requestAnimationFrame(frame);
}

async function startLoopCrossfade(windowSeconds) {
  if (
    !audioState.enabled ||
    audioState.isCrossfading ||
    !audioState.activeTrack ||
    !audioState.standbyTrack
  ) {
    return;
  }

  const fromTrack = audioState.activeTrack;
  const toTrack = audioState.standbyTrack;
  audioState.isCrossfading = true;

  if (audioState.crossfadeHandle) {
    window.cancelAnimationFrame(audioState.crossfadeHandle);
    audioState.crossfadeHandle = 0;
  }

  toTrack.pause();
  toTrack.currentTime = 0;
  toTrack.volume = 0;

  try {
    await toTrack.play();
  } catch (error) {
    audioState.isCrossfading = false;
    return;
  }

  const startedAt = performance.now();
  const fadeDurationMs = Math.max(450, windowSeconds * 1000);

  const step = (now) => {
    if (!audioState.enabled) {
      audioState.crossfadeHandle = 0;
      audioState.isCrossfading = false;
      return;
    }

    const progress = Math.min(1, (now - startedAt) / fadeDurationMs);
    fromTrack.volume = TARGET_MUSIC_VOLUME * (1 - progress);
    toTrack.volume = TARGET_MUSIC_VOLUME * progress;

    if (progress < 1) {
      audioState.crossfadeHandle = window.requestAnimationFrame(step);
      return;
    }

    fromTrack.pause();
    fromTrack.currentTime = 0;
    fromTrack.volume = 0;
    toTrack.volume = TARGET_MUSIC_VOLUME;

    audioState.activeTrack = toTrack;
    audioState.standbyTrack = fromTrack;
    audioState.crossfadeHandle = 0;
    audioState.isCrossfading = false;
  };

  audioState.crossfadeHandle = window.requestAnimationFrame(step);
}

function ensureMusicPlayers() {
  if (audioState.playersReady || !elements.musicToggle) {
    return audioState.playersReady;
  }

  const source = encodeURIComponent(MUSIC_TRACK_FILE);
  const trackA = new Audio(source);
  const trackB = new Audio(source);

  const onTimeUpdate = (event) => {
    const track = event.currentTarget;
    if (!audioState.enabled || audioState.isCrossfading || track !== audioState.activeTrack) {
      return;
    }

    if (!Number.isFinite(track.duration) || track.duration <= 0) {
      return;
    }

    const fadeWindow = getCrossfadeWindowSeconds(track);
    if (track.duration - track.currentTime <= fadeWindow + 0.04) {
      startLoopCrossfade(fadeWindow);
    }
  };

  [trackA, trackB].forEach((track) => {
    track.preload = "auto";
    track.loop = false;
    track.volume = 0;
    track.playsInline = true;
    track.addEventListener("timeupdate", onTimeUpdate);
  });

  audioState.activeTrack = trackA;
  audioState.standbyTrack = trackB;
  audioState.playersReady = true;
  return true;
}

async function setAmbientAudio(enabled) {
  if (!elements.musicToggle || !ensureMusicPlayers()) {
    return;
  }

  const activeTrack = audioState.activeTrack;
  const standbyTrack = audioState.standbyTrack;
  if (!activeTrack || !standbyTrack) {
    return;
  }

  clearAudioAnimationHandles();
  audioState.isCrossfading = false;

  let nextEnabledState = enabled;

  if (enabled) {
    standbyTrack.pause();
    standbyTrack.currentTime = 0;
    standbyTrack.volume = 0;

    try {
      await activeTrack.play();
    } catch (error) {
      nextEnabledState = false;
    }

    if (nextEnabledState) {
      animateTrackVolumes(
        [
          { track: activeTrack, from: activeTrack.volume, to: TARGET_MUSIC_VOLUME },
          { track: standbyTrack, from: standbyTrack.volume, to: 0 }
        ],
        TOGGLE_FADE_DURATION_MS
      );
    }
  } else {
    animateTrackVolumes(
      [
        { track: activeTrack, from: activeTrack.volume, to: 0 },
        { track: standbyTrack, from: standbyTrack.volume, to: 0 }
      ],
      TOGGLE_FADE_DURATION_MS,
      () => {
        activeTrack.pause();
        standbyTrack.pause();
        activeTrack.volume = 0;
        standbyTrack.volume = 0;
      }
    );
  }

  audioState.enabled = nextEnabledState;
  elements.musicToggle.setAttribute("aria-pressed", String(nextEnabledState));

  if (elements.musicToggleLabel) {
    elements.musicToggleLabel.textContent = nextEnabledState ? "Ambient On" : "Ambient Off";
  }
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

  elements.musicToggle?.addEventListener("click", async () => {
    await setAmbientAudio(!audioState.enabled);
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
}

init();
