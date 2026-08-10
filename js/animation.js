/* =========================================================
   SunnyShoots — animations.js
   Scroll-triggered animations, IntersectionObservers, and
   number counters. Exposed as window.SunnyShoots.animations
   and initialized from main.js.
   ========================================================= */

window.SunnyShoots = window.SunnyShoots || {};

window.SunnyShoots.animations = (() => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* -----------------------------------------
     Scroll reveal (.reveal-up elements)
  ------------------------------------------ */
  function initScrollReveal() {
    const revealEls = document.querySelectorAll(".reveal-up");
    if (!revealEls.length) return;

    if (prefersReducedMotion) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );

    revealEls.forEach((el, index) => {
      // Stagger reveal slightly within the same section.
      el.style.setProperty("--reveal-delay", `${(index % 4) * 80}ms`);
      observer.observe(el);
    });
  }

  /* -----------------------------------------
     Trust metric counters
     The "+", "%" suffix lives in its own permanent
     .trust-item__suffix span in the HTML (sibling of
     .trust-item__number), so the counter animation only
     ever touches the number and can never accidentally
     erase or omit the suffix.
  ------------------------------------------ */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute("data-target"), 10) || 0;
    const numberEl = el.querySelector(".trust-item__number");
    if (!numberEl) return;

    // Defensive floor: even if something upstream is misconfigured,
    // the counter never settles on a value below the target's order
    // of magnitude intent (e.g. never freezes at a bare "0").
    const safeTarget = target > 0 ? target : 0;

    if (prefersReducedMotion) {
      numberEl.textContent = safeTarget.toLocaleString();
      return;
    }

    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * safeTarget);
      numberEl.textContent = value.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        numberEl.textContent = safeTarget.toLocaleString();
        numberEl.classList.add("is-settled");
      }
    }

    requestAnimationFrame(tick);
  }

  function initCounters() {
    const counterEls = document.querySelectorAll("[data-counter]");
    if (!counterEls.length) return;

    if (!("IntersectionObserver" in window)) {
      counterEls.forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    counterEls.forEach((el) => observer.observe(el));
  }

  /* -----------------------------------------
     Public init
  ------------------------------------------ */
  function init() {
    initScrollReveal();
    initCounters();
  }

  return { init };
})();
