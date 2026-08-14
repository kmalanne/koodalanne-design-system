/* =========================================================================
   koodalanne — The Rider's Dispatches
   Small, dependency-free behaviours: preloader, scroll reveals, and the
   rare hidden interactions (idle map-check, Konami wheelie, bike bell).
   ========================================================================= */
(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Preloader: "Checking the chain…" ------------------------------- */
  const preloader = document.getElementById("preloader");
  const dismiss = () => preloader && preloader.classList.add("is-done");
  window.addEventListener("load", () => setTimeout(dismiss, reduceMotion ? 0 : 550));
  setTimeout(dismiss, 2500); // safety net

  /* --- Reveal on scroll ---------------------------------------------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  }

  /* --- Companion rider: speech helper -------------------------------- */
  const companion = document.getElementById("companion");
  const speech = document.getElementById("companionSpeech");
  let speechTimer;
  function say(text, ms = 2200) {
    if (!companion || !speech) return;
    speech.textContent = text;
    companion.classList.add("is-talking");
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => companion.classList.remove("is-talking"), ms);
  }

  /* --- Idle animation: after 30s the Rider checks the map ------------- */
  let idleTimer;
  function resetIdle() {
    clearTimeout(idleTimer);
    if (reduceMotion || !companion) return;
    idleTimer = setTimeout(() => {
      companion.classList.add("is-mapping");
      say("Checking the map…", 1600);
      setTimeout(() => companion.classList.remove("is-mapping"), 1300);
    }, 30000);
  }
  ["mousemove", "keydown", "scroll", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, resetIdle, { passive: true })
  );
  resetIdle();

  /* --- Bike bell: click the companion or the footer bell ------------- */
  function ring(el) {
    if (el) {
      el.classList.add("is-ringing");
      setTimeout(() => el.classList.remove("is-ringing"), 500);
    }
    say("ring ring", 1200);
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.14;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.24);
      });
      setTimeout(() => ctx.close(), 700);
    } catch (_) { /* audio is a bonus, never a requirement */ }
  }
  const bell = document.getElementById("bell");
  if (bell) bell.addEventListener("click", () => ring(bell));
  if (companion) companion.addEventListener("click", () => ring(null));

  /* --- Konami code: the Rider does a wheelie ------------------------- */
  const SEQ = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let pos = 0;
  window.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = key === SEQ[pos] ? pos + 1 : (key === SEQ[0] ? 1 : 0);
    if (pos === SEQ.length) {
      pos = 0;
      if (!companion || reduceMotion) return;
      companion.classList.add("is-wheelie");
      say("Wheelie!", 1400);
      setTimeout(() => companion.classList.remove("is-wheelie"), 1200);
    }
  });
})();
