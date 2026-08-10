/* =========================================================
   SunnyShoots — interactions.js
   User-triggered interactivity: navigation, mobile menu,
   custom cursor, brand/portfolio/featured-work/testimonial
   rendering from JSON, portfolio filtering, video controls.

   Reads contact placeholders from window.SunnyShootsConfig
   (defined in index.html) so every "Start a project" /
   email / social link stays in sync from one place.

   Exposed as window.SunnyShoots.interactions and initialized
   from main.js.
   ========================================================= */

window.SunnyShoots = window.SunnyShoots || {};

window.SunnyShoots.interactions = (() => {
  const isTouchDevice = window.matchMedia(
    "(hover: none), (pointer: coarse)",
  ).matches;

  /* -----------------------------------------
     Contact config: apply centralized placeholders
     to every element carrying a data-contact hook.
  ------------------------------------------ */
  function applyContactConfig() {
    const config = window.SunnyShootsConfig || {};

    document.querySelectorAll("[data-contact='email']").forEach((el) => {
      const email = (config.CONTACT_EMAIL || "").trim();
      const mailto = `mailto:${email}?subject=Start%20a%20Project`;
      el.setAttribute("href", mailto);
      el.removeAttribute("aria-disabled");
      if (el.hasAttribute("data-contact-text") && email) {
        el.textContent = email;
      } else if (el.hasAttribute("data-contact-text")) {
        el.setAttribute("hidden", "true");
      }
    });

    document.querySelectorAll("[data-contact='instagram']").forEach((el) => {
      const url = config.INSTAGRAM_URL || "";
      applyOptionalLink(el, url, "YOUR_INSTAGRAM_URL_HERE");
    });

    document.querySelectorAll("[data-contact='upwork']").forEach((el) => {
      const url = config.UPWORK_URL || "";
      applyOptionalLink(el, url, "YOUR_UPWORK_URL_HERE");
    });
  }

  // For social links marked data-contact-optional, hide the element
  // entirely until a real URL is configured, rather than showing a
  // dead "#" link on the finished site.
  function applyOptionalLink(el, url, placeholder) {
    const isConfigured = url && url !== placeholder;

    if (isConfigured) {
      el.setAttribute("href", url);
      el.removeAttribute("hidden");
    } else {
      el.setAttribute("hidden", "true");
    }
  }

  /* -----------------------------------------
     Navigation: scroll shrink/blur state
  ------------------------------------------ */
  function initNavScrollState() {
    const header = document.getElementById("site-header");
    if (!header) return;

    const SCROLL_THRESHOLD = 24;
    let ticking = false;

    function update() {
      if (window.scrollY > SCROLL_THRESHOLD) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );

    update();
  }

  /* -----------------------------------------
     Navigation: mobile hamburger menu
  ------------------------------------------ */
  function initMobileMenu() {
    const toggle = document.getElementById("navbar-toggle");
    const menu = document.getElementById("navbar-mobile-menu");
    if (!toggle || !menu) return;

    function closeMenu() {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }

    function openMenu() {
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    }

    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.contains("is-open");
      isOpen ? closeMenu() : openMenu();
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener("click", (e) => {
      if (
        menu.classList.contains("is-open") &&
        !menu.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeMenu();
      }
    });
  }

  /* -----------------------------------------
     Smooth scroll for internal anchor links
  ------------------------------------------ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") return;
        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /* -----------------------------------------
     Custom cursor: hollow lavender ring
     - Hides the native cursor on desktop (see body.has-custom-cursor
       in style.css).
     - Uses raw mousemove + transform (no rAF interpolation lag on
       the ring's primary position) for zero perceptible delay.
     - A very light rAF-smoothed "trail" scale/glow response is used
       only for the hover expansion, not for position, so it never
       feels laggy.
     - Delegated hover detection works correctly for portfolio/
       featured-work cards that are rendered dynamically AFTER this
       function runs.
     - Ordinary text never triggers a text/I-beam cursor: the native
       cursor is hidden globally via CSS, and only elements matching
       the interactive selector expand the ring. See "cursor: none"
       rule in style.css for text, headings, and static content.
  ------------------------------------------ */
  function initCustomCursor() {
    const ring = document.getElementById("cursor-ring");
    if (!ring) return;

    if (isTouchDevice) {
      return; // Native cursor / touch behavior remains untouched.
    }

    document.body.classList.add("has-custom-cursor");

    // Direct transform update on every mousemove — no smoothing queue
    // on position, so the ring tracks the pointer with no visible lag.
    window.addEventListener(
      "pointermove",
      (e) => {
        ring.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        if (ring.style.opacity !== "1") ring.style.opacity = "1";
      },
      { passive: true },
    );

    window.addEventListener("mouseleave", () => {
      ring.style.opacity = "0";
    });

    const interactiveSelector =
      "a, button, .filter-chip, .work-card, .portfolio-item, .service-card, [data-cursor-hover]";

    document.addEventListener(
      "mouseover",
      (e) => {
        const interactive = e.target.closest(interactiveSelector);
        if (interactive) {
          ring.classList.add("is-hovering");
          ring.classList.toggle(
            "is-card-hovering",
            Boolean(interactive.closest(".work-card, .portfolio-item")),
          );
        }
      },
      { passive: true },
    );

    document.addEventListener(
      "mouseout",
      (e) => {
        const stillInside =
          e.relatedTarget &&
          e.relatedTarget.closest &&
          e.relatedTarget.closest(interactiveSelector);
        if (!stillInside) {
          ring.classList.remove("is-hovering");
          ring.classList.remove("is-card-hovering");
        }
      },
      { passive: true },
    );
  }

  /* -----------------------------------------
     Brands: render marquee from JSON (editable roster)
  ------------------------------------------ */
  function renderBrandsMarquee() {
    const dataScript = document.getElementById("brands-data");
    const track = document.getElementById("marquee-track");
    if (!dataScript || !track) return;

    let brands = [];
    try {
      brands = JSON.parse(dataScript.textContent);
    } catch (err) {
      console.error("Brand data could not be parsed:", err);
      return;
    }

    if (!brands.length) {
      track.closest(".marquee")?.setAttribute("hidden", "true");
      return;
    }

    const brandMarkup = brands
      .map((brand) => {
        const inner = mediaIsEnabled(brand.logo)
          ? `<img src="${brand.logo}" alt="${brand.name}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'marquee__item--text', textContent: this.alt }))" />`
          : `<span class="marquee__item--text">${brand.name}</span>`;
        return brand.url
          ? `<a class="marquee__item" href="${brand.url}" target="_blank" rel="noopener">${inner}</a>`
          : `<div class="marquee__item">${inner}</div>`;
      })
      .join("");
    // Each group is widened from the centralized brand list until it exceeds
    // the viewport. The second identical group then lets the CSS -50%
    // transform land exactly at the beginning of the sequence.
    const marquee = track.closest(".marquee");
    const copies = Math.max(1, Math.ceil((marquee?.clientWidth || 1) / 160) / brands.length);
    const markup = brandMarkup.repeat(Math.ceil(copies) + 1);
    track.innerHTML = `<div class="marquee__group">${markup}</div><div class="marquee__group" aria-hidden="true">${markup}</div>`;
  }

  function initMarqueePause() {
    const marquee = document.querySelector("[data-marquee]");
    if (!marquee) return;

    marquee.addEventListener("mouseenter", () =>
      marquee.setAttribute("data-paused", "true"),
    );
    marquee.addEventListener("mouseleave", () =>
      marquee.setAttribute("data-paused", "false"),
    );
  }

  /* -----------------------------------------
     Featured Work carousel: render from JSON + hover-pause
  ------------------------------------------ */
  function renderFeaturedCarousel() {
    const dataScript = document.getElementById("featured-work-data");
    const track = document.getElementById("featured-carousel-track");
    if (!dataScript || !track) return;

    let items = [];
    try {
      items = JSON.parse(dataScript.textContent);
    } catch (err) {
      console.error("Featured work data could not be parsed:", err);
      return;
    }

    const markup = items
      .map(
        (item) => `
        <article class="work-card" aria-label="${item.title}">
          <div class="work-card__fallback" aria-hidden="true"></div>
          ${renderMedia(item, "work-card__media")}
          <div class="work-card__gradient"></div>
          <span class="work-card__label">${item.title}</span>
        </article>
      `,
      )
      .join("");
    track.innerHTML = `<div class="carousel__group">${markup}</div><div class="carousel__group" aria-hidden="true">${markup}</div>`;

    initViewportVideoPlayback(track.querySelectorAll("video"));

    const carousel = document.querySelector("[data-carousel]");
    if (carousel) {
      carousel.addEventListener("mouseenter", () =>
        carousel.setAttribute("data-paused", "true"),
      );
      carousel.addEventListener("mouseleave", () =>
        carousel.setAttribute("data-paused", "false"),
      );
    }
  }

  /* -----------------------------------------
     Testimonials: render from JSON, or a neutral
     empty state if no real testimonials are configured yet.
  ------------------------------------------ */
  function renderTestimonials() {
    const dataScript = document.getElementById("testimonials-data");
    const grid = document.getElementById("testimonials-grid");
    if (!dataScript || !grid) return;

    let items = [];
    try {
      items = JSON.parse(dataScript.textContent);
    } catch (err) {
      console.error("Testimonials data could not be parsed:", err);
      return;
    }

    if (!items.length) {
      grid.innerHTML = "";
      grid.closest("section")?.setAttribute("hidden", "true");
      return;
    }

    grid.innerHTML = items
      .map(
        (item) => `
        <blockquote class="testimonial-card reveal-up">
          <span class="testimonial-card__mark" aria-hidden="true">&ldquo;</span>
          <p class="testimonial-card__quote">${item.quote}</p>
          <footer class="testimonial-card__author">${item.author} &middot; ${item.role}</footer>
        </blockquote>
      `,
      )
      .join("");
  }

  /* -----------------------------------------
     Portfolio: render from JSON + filter
     Data shape (see #portfolio-data in index.html):
       { title, categories, ratio, video, poster }
     Grid uses CSS Grid auto-flow: dense so it reorganizes
     itself automatically as items are added or filtered —
     no manual per-item positioning is ever required.
  ------------------------------------------ */
  function renderPortfolio() {
    const dataScript = document.getElementById("portfolio-data");
    const grid = document.getElementById("portfolio-grid");
    if (!dataScript || !grid) return null;

    let items = [];
    try {
      items = JSON.parse(dataScript.textContent);
    } catch (err) {
      console.error("Portfolio data could not be parsed:", err);
      return null;
    }

    grid.innerHTML = items
      .map(
        (item) => `
        <article class="portfolio-item" data-categories="${(item.categories || []).join(" ")}" data-ratio="${item.ratio}" aria-label="${item.title}">
          <div class="portfolio-item__fallback" aria-hidden="true"></div>
          ${renderMedia(item, "portfolio-item__media")}
          ${mediaIsEnabled(item.video) ? `<div class="portfolio-item__controls" aria-label="Video controls"><button type="button" data-video-action="play" aria-label="Play video">${videoIcon("play")}</button><button type="button" data-video-action="mute" aria-label="Mute video">${videoIcon("muted")}</button><button type="button" data-video-action="fullscreen" aria-label="Enter fullscreen">${videoIcon("fullscreen")}</button></div>` : ""}
          <div class="portfolio-item__gradient"></div>
          <span class="portfolio-item__label">${item.title}</span>
        </article>
      `,
      )
      .join("");

    initViewportVideoPlayback(grid.querySelectorAll("video"));
    initPortfolioVideoControls(grid);
    return grid;
  }

  function initViewportVideoPlayback(videos) {
    if (!videos.length) return;

    if (!("IntersectionObserver" in window) || prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            if (!video.src && video.dataset.videoSrc) {
              video.src = video.dataset.videoSrc;
              video.load();
            }
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.2 },
    );

    videos.forEach((video) => observer.observe(video));
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function mediaIsEnabled(source) {
    const config = window.SunnyShootsConfig || {};
    return Boolean(source) && (config.ENABLE_LOCAL_MEDIA || /^https?:\/\//i.test(source));
  }

  function renderMedia(item, className) {
    if (!mediaIsEnabled(item.video)) return "";

    return `<video class="${className}" data-video-src="${item.video}" poster="${item.poster || ""}" muted loop playsinline preload="none"></video>`;
  }

  function initPortfolioVideoControls(grid) {
    if (!grid) return;
    grid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-video-action]");
      const card = event.target.closest(".portfolio-item");
      const video = card?.querySelector("video");
      if (!button || !video) return;
      event.preventDefault();
      event.stopPropagation();
      if (button.dataset.videoAction === "play") {
        if (video.paused) video.play().catch(() => {}); else video.pause();
        button.innerHTML = video.paused ? videoIcon("play") : videoIcon("pause");
        button.setAttribute("aria-label", video.paused ? "Play video" : "Pause video");
      } else if (button.dataset.videoAction === "mute") {
        video.muted = !video.muted;
        button.innerHTML = video.muted ? videoIcon("muted") : videoIcon("sound");
        button.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
      } else if (button.dataset.videoAction === "fullscreen") {
        const result = card.requestFullscreen?.() || card.webkitRequestFullscreen?.();
        result?.catch?.(() => {});
      }
    });

    const syncFullscreenButtons = () => {
      grid.querySelectorAll(".portfolio-item").forEach((card) => {
        const button = card.querySelector('[data-video-action="fullscreen"]');
        if (!button) return;
        const active = document.fullscreenElement === card;
        button.innerHTML = videoIcon(active ? "exit-fullscreen" : "fullscreen");
        button.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
      });
    };
    document.addEventListener("fullscreenchange", syncFullscreenButtons);
    document.addEventListener("webkitfullscreenchange", syncFullscreenButtons);

    grid.querySelectorAll("video").forEach((video) => {
      video.addEventListener("play", () => {
        const button = video.closest(".portfolio-item")?.querySelector('[data-video-action="play"]');
        if (button) { button.innerHTML = videoIcon("pause"); button.setAttribute("aria-label", "Pause video"); }
      });
      video.addEventListener("pause", () => {
        const button = video.closest(".portfolio-item")?.querySelector('[data-video-action="play"]');
        if (button) { button.innerHTML = videoIcon("play"); button.setAttribute("aria-label", "Play video"); }
      });
    });
  }

  function videoIcon(name) {
    const paths = {
      play: '<path d="M8 5v14l11-7z"/>',
      pause: '<path d="M7 5h3v14H7zm7 0h3v14h-3z"/>',
      muted: '<path d="M4 9v6h4l5 4V5L8 9H4zM17 9l4 6m0-6-4 6"/>',
      sound: '<path d="M4 9v6h4l5 4V5L8 9H4zm12.5-2a6 6 0 0 1 0 10m2-12a9 9 0 0 1 0 14"/>',
      fullscreen: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"/>',
      "exit-fullscreen": '<path d="M8 3v5H3M16 3v5h5M8 21v-5H3M21 16v5h-5"/>',
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</g></svg>`;
  }

  function renderPortfolioFilters() {
    const script = document.getElementById("portfolio-categories-data");
    const filterBar = document.getElementById("portfolio-filters");
    if (!script || !filterBar) return;
    let categories = [];
    try { categories = JSON.parse(script.textContent); } catch (error) {
      console.error("Portfolio categories could not be parsed:", error);
      return;
    }
    filterBar.innerHTML = categories.map((category, index) => `<button class="filter-chip${index === 0 ? " is-active" : ""}" type="button" role="tab" aria-selected="${index === 0}" data-filter="${category.id}">${category.label}</button>`).join("");
  }

  function initPortfolioFilters(grid) {
    const filterBar = document.getElementById("portfolio-filters");
    if (!filterBar || !grid) return;

    const chips = filterBar.querySelectorAll(".filter-chip");

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = chip.getAttribute("data-filter");

        chips.forEach((c) => {
          c.classList.remove("is-active");
          c.setAttribute("aria-selected", "false");
        });
        chip.classList.add("is-active");
        chip.setAttribute("aria-selected", "true");

        grid.querySelectorAll(".portfolio-item").forEach((item) => {
          const categories = (item.getAttribute("data-categories") || "").split(" ");
          const matches = filter === "all" || categories.includes(filter);
          item.classList.toggle("is-hidden", !matches);
        });
      });

      chip.addEventListener("keydown", (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const next = chips[(Array.from(chips).indexOf(chip) + direction + chips.length) % chips.length];
        next.focus();
        next.click();
      });
    });
  }

  /* -----------------------------------------
     Intro video: mute toggle, fullscreen, and a subtle
     hover-scrub timeline (no visible player chrome).
  ------------------------------------------ */
  function initIntroVideo() {
    const video = document.getElementById("intro-video-el");
    const muteBtn = document.getElementById("intro-video-mute");
    const muteLabel = document.getElementById("intro-video-mute-label");
    const fullscreenBtn = document.getElementById("intro-video-fullscreen");
    const frame = document.getElementById("intro-video-frame");
    const scrub = document.getElementById("intro-video-scrub");
    const scrubFill = document.getElementById("intro-video-scrub-fill");

    if (!video) return;

    const config = window.SunnyShootsConfig || {};
    if (config.INTRO_VIDEO_URL) {
      video.src = config.INTRO_VIDEO_URL;
      if (config.INTRO_VIDEO_POSTER) video.poster = config.INTRO_VIDEO_POSTER;
    }

    if (muteBtn && muteLabel) {
      muteBtn.addEventListener("click", () => {
        video.muted = !video.muted;
        muteBtn.setAttribute("aria-pressed", String(!video.muted));
        muteLabel.textContent = video.muted ? "Unmute" : "Mute";
      });
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", () => {
        if (video.requestFullscreen) {
          video.requestFullscreen().catch(() => {});
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        }
      });
    }

    // Hover-scrub: moving across the frame seeks the video proportionally.
    // Only active on non-touch devices; falls back to normal playback
    // everywhere else. No control bar, no timestamps — just a thin fill.
    const updateProgress = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      const progress = video.currentTime / video.duration;
      scrubFill.style.width = `${progress * 100}%`;
      scrub.style.setProperty("--scrub-progress", `${progress * 100}%`);
      scrub.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    };
    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", updateProgress);

    if (scrub && scrubFill) {
      let dragging = false;
      const seekFromPointer = (event) => {
        if (!video.duration || Number.isNaN(video.duration)) return;
        const rect = scrub.getBoundingClientRect();
        const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
        video.currentTime = ratio * video.duration;
        updateProgress();
      };
      scrub.addEventListener("pointerdown", (event) => { dragging = true; scrub.setPointerCapture?.(event.pointerId); seekFromPointer(event); });
      scrub.addEventListener("pointermove", (event) => { if (dragging) seekFromPointer(event); });
      scrub.addEventListener("pointerup", () => { dragging = false; });
      scrub.addEventListener("pointercancel", () => { dragging = false; });
      scrub.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !video.duration) return;
        event.preventDefault();
        if (event.key === "Home") video.currentTime = 0;
        else if (event.key === "End") video.currentTime = video.duration;
        else video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + (event.key === "ArrowRight" ? 5 : -5)));
        updateProgress();
      });
    }

    if (video.currentSrc) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    }
  }

  /* -----------------------------------------
     Public init
  ------------------------------------------ */
  function init() {
    initNavScrollState();
    initMobileMenu();
    initSmoothScroll();
    initCustomCursor();
    initMarqueePause();
    renderBrandsMarquee();
    renderFeaturedCarousel();
    renderTestimonials();

    renderPortfolioFilters();
    const portfolioGrid = renderPortfolio();
    initPortfolioFilters(portfolioGrid);

    initIntroVideo();
    applyContactConfig();
  }

  return { init };
})();
