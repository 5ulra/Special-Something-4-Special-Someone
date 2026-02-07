(function () {
  const PASSCODE = "forever";
  const LOVE_LETTER = `My love,

Every chapter we lived still feels alive in my heart.
From our first hello to every tiny adventure after,
you turned ordinary time into something unforgettable.

If forever has a shape, it looks like us -
still choosing each other, every day.

Always yours.`;

  const preloader = document.getElementById("preloader");
  const preloaderFill = document.getElementById("preloaderFill");
  const preloaderText = document.getElementById("preloaderText");

  const lockScreen = document.getElementById("lockScreen");
  const lockForm = document.getElementById("lockForm");
  const passcodeInput = document.getElementById("passcode");
  const lockError = document.getElementById("lockError");

  const story = document.getElementById("story");
  const sceneNodes = Array.from(document.querySelectorAll("#story .scene"));
  const parallaxNodes = Array.from(document.querySelectorAll("#story [data-speed]"));

  const sceneMessage = document.getElementById("sceneMessage");
  const sceneMeeting = document.getElementById("sceneMeeting");
  const sceneTrip = document.getElementById("sceneTrip");
  const sceneMore = document.getElementById("sceneMore");
  const tripTrack = document.getElementById("tripTrack");
  const timelineFill = document.getElementById("timelineFill");

  const audioToggle = document.getElementById("audioToggle");
  const audioLabel = document.getElementById("audioLabel");

  const letterModal = document.getElementById("letterModal");
  const typewriter = document.getElementById("typewriter");
  const openLetter = document.getElementById("openLetter");
  const closeLetter = document.getElementById("closeLetter");

  const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  const lightboxClose = document.getElementById("lightboxClose");

  let unlocked = false;
  let rafHandle = 0;
  let typingHandle = 0;
  let galleryIndex = 0;
  let meetingChimePlayed = false;
  let sceneObserver = null;

  let audioEnabled = false;
  let audioCtx = null;
  let masterGain = null;
  let driftHandle = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setLoadProgress(progressValue) {
    const progress = Math.round(clamp(progressValue, 0, 100));
    if (preloaderFill) {
      preloaderFill.style.width = `${progress}%`;
    }
    if (preloaderText) {
      preloaderText.textContent = `Loading ${progress}%`;
    }
  }

  function runPreloader() {
    const startedAt = performance.now();
    let simulated = 0;

    const simulateHandle = window.setInterval(() => {
      simulated = Math.min(92, simulated + Math.random() * 8 + 1.5);
      setLoadProgress(simulated);
    }, 120);

    function finishPreloader() {
      window.clearInterval(simulateHandle);
      const completeHandle = window.setInterval(() => {
        simulated = Math.min(100, simulated + 4.2);
        setLoadProgress(simulated);

        if (simulated >= 100) {
          window.clearInterval(completeHandle);
          window.setTimeout(() => {
            if (preloader) {
              preloader.classList.add("is-hidden");
            }
            document.body.classList.remove("is-loading");
            passcodeInput?.focus();
          }, 260);
        }
      }, 34);
    }

    window.addEventListener("load", () => {
      const minDuration = 900;
      const elapsed = performance.now() - startedAt;
      const wait = Math.max(0, minDuration - elapsed);
      window.setTimeout(finishPreloader, wait);
    });
  }

  function requestEffectsUpdate() {
    if (!unlocked || rafHandle) {
      return;
    }

    rafHandle = window.requestAnimationFrame(() => {
      rafHandle = 0;
      updateSceneVisibility();
      updateParallax();
      updateTripMotion();
      updateTimeline();
    });
  }

  function updateSceneVisibility() {
    const viewport = window.innerHeight || 1;

    sceneNodes.forEach((scene) => {
      const rect = scene.getBoundingClientRect();
      const centerDistance = Math.abs(viewport / 2 - (rect.top + rect.height / 2));
      const visibility = clamp(1 - centerDistance / (viewport * 0.9), 0, 1);
      scene.style.setProperty("--scene-visibility", visibility.toFixed(3));
    });
  }

  function updateParallax() {
    parallaxNodes.forEach((layer) => {
      const speed = Number(layer.dataset.speed || "0");
      const parentScene = layer.closest(".scene");

      if (!parentScene || Number.isNaN(speed)) {
        return;
      }

      const rect = parentScene.getBoundingClientRect();
      const offset = rect.top * speed;
      layer.style.setProperty("--parallax-shift", `${offset.toFixed(2)}px`);
    });
  }

  function updateTripMotion() {
    if (!sceneTrip || !tripTrack) {
      return;
    }

    const rect = sceneTrip.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    const progress = clamp((viewport - rect.top) / (viewport + rect.height), 0, 1);
    const shift = -14 + progress * 14;
    tripTrack.style.transform = `translateX(${shift.toFixed(2)}%)`;
  }

  function updateTimeline() {
    if (!timelineFill || !sceneMessage || !sceneMore) {
      return;
    }

    const start = sceneMessage.offsetTop;
    const end = sceneMore.offsetTop + sceneMore.offsetHeight - window.innerHeight;
    const travel = Math.max(1, end - start);
    const progress = clamp((window.scrollY - start) / travel, 0, 1);
    timelineFill.style.width = `${(progress * 100).toFixed(1)}%`;
  }

  function observeScenes() {
    if (sceneObserver) {
      return;
    }

    sceneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (entry.target === sceneMeeting) {
              triggerMeetingChime();
            }
          } else if (entry.intersectionRatio < 0.15) {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: [0.15, 0.32, 0.58]
      }
    );

    sceneNodes.forEach((scene) => {
      sceneObserver.observe(scene);
    });
  }

  function initializeScrollMotion() {
    observeScenes();
    window.addEventListener("scroll", requestEffectsUpdate, { passive: true });
    window.addEventListener("resize", requestEffectsUpdate);
    requestEffectsUpdate();
  }

  function unlockStory() {
    if (unlocked) {
      return;
    }

    unlocked = true;
    meetingChimePlayed = false;

    if (lockError) {
      lockError.hidden = true;
    }

    lockScreen?.classList.add("is-unlocking");
    if (story) {
      story.hidden = false;
    }
    document.body.classList.remove("locked");

    initializeScrollMotion();
    window.setTimeout(() => {
      lockScreen?.setAttribute("hidden", "hidden");
    }, 650);
    window.setTimeout(() => {
      document.getElementById("sceneOpening")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function showLockError() {
    if (!lockError) {
      return;
    }

    lockError.hidden = false;
    lockScreen?.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" }
      ],
      {
        duration: 220,
        easing: "ease-in-out"
      }
    );
  }

  function attachLockHandler() {
    lockForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const rawValue = passcodeInput?.value ?? "";
      const value = rawValue.trim().toLowerCase();

      if (value === PASSCODE) {
        unlockStory();
        return;
      }

      showLockError();
    });
  }

  function ensureAudioEngine() {
    if (audioCtx) {
      return;
    }

    const AudioContextRef = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextRef) {
      return;
    }

    audioCtx = new AudioContextRef();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(audioCtx.destination);

    const baseOne = audioCtx.createOscillator();
    const baseTwo = audioCtx.createOscillator();
    const gainOne = audioCtx.createGain();
    const gainTwo = audioCtx.createGain();
    const toneFilter = audioCtx.createBiquadFilter();

    toneFilter.type = "lowpass";
    toneFilter.frequency.value = 520;

    baseOne.type = "sine";
    baseTwo.type = "triangle";
    baseOne.frequency.value = 196;
    baseTwo.frequency.value = 246;

    gainOne.gain.value = 0.055;
    gainTwo.gain.value = 0.03;

    baseOne.connect(gainOne).connect(toneFilter);
    baseTwo.connect(gainTwo).connect(toneFilter);
    toneFilter.connect(masterGain);

    baseOne.start();
    baseTwo.start();

    driftHandle = window.setInterval(() => {
      if (!audioCtx) {
        return;
      }
      const t = audioCtx.currentTime;
      baseOne.frequency.linearRampToValueAtTime(188 + Math.random() * 22, t + 4.5);
      baseTwo.frequency.linearRampToValueAtTime(238 + Math.random() * 26, t + 4.5);
    }, 4200);
  }

  function updateAudioButton() {
    if (!audioToggle || !audioLabel) {
      return;
    }

    audioToggle.classList.toggle("is-on", audioEnabled);
    audioToggle.setAttribute("aria-pressed", String(audioEnabled));
    audioLabel.textContent = audioEnabled ? "Sound On" : "Sound Off";
  }

  function toggleAudio() {
    ensureAudioEngine();
    if (!audioCtx || !masterGain) {
      return;
    }

    audioEnabled = !audioEnabled;
    const now = audioCtx.currentTime;
    audioCtx.resume();

    if (audioEnabled) {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
      masterGain.gain.linearRampToValueAtTime(0.065, now + 0.55);
    } else {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    }

    updateAudioButton();
  }

  function triggerMeetingChime() {
    if (!audioEnabled || !audioCtx || !masterGain || meetingChimePlayed) {
      return;
    }

    meetingChimePlayed = true;
    const now = audioCtx.currentTime + 0.02;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(523.25, now);
    oscillator.frequency.exponentialRampToValueAtTime(659.26, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    oscillator.connect(gain).connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + 0.82);
  }

  function triggerLetterCue() {
    if (!audioEnabled || !audioCtx || !masterGain) {
      return;
    }

    const now = audioCtx.currentTime + 0.02;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(392, now);
    oscillator.frequency.exponentialRampToValueAtTime(523.25, now + 0.14);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
    oscillator.connect(gain).connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + 0.56);
  }

  function syncBodyModalState() {
    const openState =
      letterModal?.classList.contains("is-open") || lightbox?.classList.contains("is-open");
    document.body.classList.toggle("modal-open", Boolean(openState));
  }

  function startTypewriter() {
    if (!typewriter) {
      return;
    }

    window.clearInterval(typingHandle);
    typewriter.textContent = "";
    let index = 0;

    typingHandle = window.setInterval(() => {
      index += 1;
      typewriter.textContent = LOVE_LETTER.slice(0, index);
      if (index >= LOVE_LETTER.length) {
        window.clearInterval(typingHandle);
      }
    }, 30);
  }

  function openLetterModal() {
    if (!letterModal) {
      return;
    }
    letterModal.classList.add("is-open");
    letterModal.setAttribute("aria-hidden", "false");
    startTypewriter();
    triggerLetterCue();
    syncBodyModalState();
  }

  function closeLetterModal() {
    if (!letterModal) {
      return;
    }
    letterModal.classList.remove("is-open");
    letterModal.setAttribute("aria-hidden", "true");
    window.clearInterval(typingHandle);
    syncBodyModalState();
  }

  function renderLightbox() {
    if (!lightboxImage || !lightboxCaption || galleryItems.length === 0) {
      return;
    }

    const item = galleryItems[galleryIndex];
    const img = item.querySelector("img");
    const fullSource = item.dataset.full || img?.src || "";
    const caption = item.dataset.caption || "";
    const alt = img?.alt || "Gallery image";

    lightboxImage.src = fullSource;
    lightboxImage.alt = alt;
    lightboxCaption.textContent = caption;
  }

  function openLightbox(index) {
    if (!lightbox || galleryItems.length === 0) {
      return;
    }
    galleryIndex = clamp(index, 0, galleryItems.length - 1);
    renderLightbox();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    syncBodyModalState();
  }

  function closeLightbox() {
    if (!lightbox) {
      return;
    }
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    syncBodyModalState();
  }

  function stepLightbox(delta) {
    if (galleryItems.length === 0) {
      return;
    }

    galleryIndex = (galleryIndex + delta + galleryItems.length) % galleryItems.length;
    renderLightbox();
  }

  function attachUiHandlers() {
    audioToggle?.addEventListener("click", toggleAudio);

    openLetter?.addEventListener("click", openLetterModal);
    closeLetter?.addEventListener("click", closeLetterModal);

    letterModal?.addEventListener("click", (event) => {
      if (event.target === letterModal) {
        closeLetterModal();
      }
    });

    galleryItems.forEach((item, index) => {
      item.addEventListener("click", () => openLightbox(index));
    });

    lightboxClose?.addEventListener("click", closeLightbox);
    lightboxPrev?.addEventListener("click", () => stepLightbox(-1));
    lightboxNext?.addEventListener("click", () => stepLightbox(1));

    lightbox?.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (lightbox?.classList.contains("is-open")) {
          closeLightbox();
        }
        if (letterModal?.classList.contains("is-open")) {
          closeLetterModal();
        }
      }

      if (lightbox?.classList.contains("is-open")) {
        if (event.key === "ArrowRight") {
          stepLightbox(1);
        } else if (event.key === "ArrowLeft") {
          stepLightbox(-1);
        }
      }
    });
  }

  runPreloader();
  attachLockHandler();
  attachUiHandlers();
  updateAudioButton();

  window.addEventListener("beforeunload", () => {
    window.clearInterval(driftHandle);
    window.clearInterval(typingHandle);
  });
})();
