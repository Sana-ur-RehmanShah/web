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
  ------------------------------------------ */
  function initCustomCursor() {
    const ring = document.getElementById("cursor-ring");
    if (!ring) return;

    if (isTouchDevice) {
      return; // Native cursor / touch behavior remains untouched.
    }

    document.body.classList.add("has-custom-cursor");

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
        const inner = brand.logo
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
    const copies = Math.max(
      1,
      Math.ceil((marquee?.clientWidth || 1) / 160) / brands.length,
    );
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
     UNCHANGED — do not modify.
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

    const cardMarkup = (item) => `
        <article class="work-card" aria-label="${item.title}">
          <div class="work-card__fallback" aria-hidden="true"></div>
          ${renderMedia(item, "work-card__media")}
          <div class="work-card__gradient"></div>
          <span class="work-card__label">${item.title}</span>
        </article>
      `;
    const markup = items.map((item) => cardMarkup(item)).join("");
    const duplicateMarkup = items.map((item) => cardMarkup(item)).join("");
    track.innerHTML = `<div class="carousel__group">${markup}</div><div class="carousel__group" aria-hidden="true">${duplicateMarkup}</div>`;

    initYouTubeMedia(track, { preloadAll: true });

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
       { title, categories, ratio, youtubeUrl, poster }
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
          ${normalizeYouTubeId(item.youtubeUrl) ? `<div class="portfolio-item__controls" aria-label="Video controls"><button type="button" data-video-action="play" aria-label="Play video">${videoIcon("play")}</button><button type="button" data-video-action="mute" aria-label="Mute video">${videoIcon("muted")}</button><button type="button" data-video-action="fullscreen" aria-label="Enter fullscreen">${videoIcon("fullscreen")}</button></div>` : ""}
          <div class="portfolio-item__gradient"></div>
          <span class="portfolio-item__label">${item.title}</span>
        </article>
      `,
      )
      .join("");

    // FIX: Portfolio previously never mounted any players until a
    // manual click on Play — nothing ever called mountYouTubePlayer
    // via an IntersectionObserver for Portfolio cards (only Featured
    // Work got that treatment, via initYouTubeMedia(track, {preloadAll:true})).
    // This restores automatic, viewport-triggered, muted autoplay for
    // Portfolio using the SAME shared player/API machinery Featured
    // Work already relies on, without touching Featured Work's own
    // call site or behavior at all.
    initPortfolioAutoplay(grid);
    initPortfolioVideoControls(grid);
    return grid;
  }

  function renderMedia(item, className) {
    const videoId = normalizeYouTubeId(item.youtubeUrl);
    if (!videoId) return "";
    const poster =
      item.poster || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    return `<div class="youtube-media ${className}" data-youtube-id="${videoId}" data-youtube-poster="${poster}" data-youtube-title="${item.title}" role="img" aria-label="${item.title}"><div class="youtube-media__mount"></div></div>`;
  }

  function normalizeYouTubeId(url) {
    if (!url || /YOUR_/.test(url)) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtu.be"))
        return parsed.pathname.slice(1).split(/[/?#]/)[0] || null;
      if (parsed.hostname.includes("youtube.com")) {
        return (
          parsed.searchParams.get("v") ||
          parsed.pathname.split("/").filter(Boolean).pop() ||
          null
        );
      }
    } catch (error) {
      console.warn("Invalid YouTube URL:", url);
    }
    if (url && !/YOUR_/.test(url))
      console.warn("Unsupported YouTube URL:", url);
    return null;
  }

  let youtubeApiPromise;
  const youtubePlayers = new WeakMap();

  function loadYouTubeAPI() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (youtubeApiPromise) return youtubeApiPromise;
    youtubeApiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT);
      };
      const existing = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      );
      if (existing) {
        existing.addEventListener(
          "error",
          () => reject(new Error("YouTube Player API failed to load")),
          { once: true },
        );
        return;
      }
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () =>
        reject(new Error("YouTube Player API failed to load"));
      document.head.appendChild(script);
    });
    return youtubeApiPromise;
  }

  // Featured Work only — unchanged.
  function initYouTubeMedia(root, options = {}) {
    const media = root?.querySelectorAll(".youtube-media");
    if (!media?.length) return;
    if (options.preloadAll) {
      media.forEach((element) => {
        const state = mountYouTubePlayer(element);
        state?.ready?.then(() => state.player?.playVideo());
      });
      return;
    }

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const state = mountYouTubePlayer(entry.target);
            state?.ready?.then(() => {
              if (entry.target.closest(".work-card")) state.player?.playVideo();
            });
          }
        }),
      { threshold: 0.12, rootMargin: "160px" },
    );
    media.forEach((element) => observer.observe(element));
  }

  /* -----------------------------------------
     Portfolio-only: mount + muted-autoplay each card's
     player as it enters/approaches the viewport. Uses the
     same mountYouTubePlayer/loadYouTubeAPI machinery as
     Featured Work, but is a separate call site so Featured
     Work's own observer/behavior is never touched.
  ------------------------------------------ */
  function initPortfolioAutoplay(grid) {
    const media = grid?.querySelectorAll(".youtube-media");
    if (!media?.length) return;

    if (!("IntersectionObserver" in window)) {
      // Fallback: no IntersectionObserver support — mount everything
      // immediately rather than leaving Portfolio permanently blank.
      media.forEach((element) => {
        const state = mountYouTubePlayer(element);
        state?.ready?.then(() => state.player?.playVideo());
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const state = mountYouTubePlayer(entry.target);
          state?.ready?.then(() => {
            // Player is muted by default inside onReady already;
            // autoplay it once ready if it isn't already playing.
            if (!state.playing) state.player?.playVideo();
          });
        });
      },
      { threshold: 0.25, rootMargin: "160px" },
    );

    media.forEach((element) => observer.observe(element));
  }

  function mountYouTubePlayer(element) {
    const cached = youtubePlayers.get(element);

    // Reuse an already-created player or one that is currently loading.
    if (cached && (cached.player || cached.pending)) {
      return cached;
    }

    const id = element.dataset.youtubeId;
    if (!id) return null;

    element.style.backgroundImage = `url("${element.dataset.youtubePoster}")`;
    element.style.backgroundSize = "cover";
    element.style.backgroundPosition = "center";

    let mount = element.querySelector(".youtube-media__mount");

    if (!mount) {
      mount = document.createElement("div");
      mount.className = "youtube-media__mount";
      element.appendChild(mount);
    }

    const state = {
      player: null,
      ready: null,
      pending: true,
      playing: false,
      muted: true,
      autoplay: Boolean(
        element.closest(".work-card") ||
        element.closest(".intro-video__frame") ||
        element.closest(".portfolio-item"),
      ),
    };

    state.ready = loadYouTubeAPI()
      .then(
        (YT) =>
          new Promise((resolve, reject) => {
            // Make sure the mount element is still attached to the page.
            if (!mount.isConnected) {
              reject(
                new Error(
                  "YouTube mount node was removed before the player could be created.",
                ),
              );
              return;
            }

            try {
              state.player = new YT.Player(mount, {
                videoId: id,

                playerVars: {
                  autoplay: state.autoplay ? 1 : 0,
                  controls: 0,
                  disablekb: 1,
                  enablejsapi: 1,
                  loop: 1,
                  playlist: id,
                  playsinline: 1,
                  rel: 0,
                  modestbranding: 1,
                  mute: 1,
                },

                events: {
                  onReady: (event) => {
                    event.target.mute();

                    state.muted = true;
                    state.pending = false;

                    updateYouTubeControls(element, state);

                    if (state.autoplay) {
                      event.target.playVideo();
                    }

                    resolve(state);
                  },

                  onStateChange: (event) => {
                    state.playing = event.data === YT.PlayerState.PLAYING;

                    if (typeof event.target.isMuted === "function") {
                      state.muted = event.target.isMuted();
                    }

                    // Smooth fallback loop.
                    if (event.data === YT.PlayerState.ENDED) {
                      event.target.seekTo(0, true);
                      event.target.playVideo();
                    }

                    updateYouTubeControls(element, state);
                  },

                  onError: (event) => {
                    console.warn(
                      "YouTube player error for video:",
                      id,
                      event?.data,
                    );

                    state.pending = false;
                    updateYouTubeControls(element, state);
                  },
                },
              });
            } catch (error) {
              reject(error);
            }
          }),
      )
      .catch((error) => {
        console.warn("YouTube player could not be initialized:", error);

        state.pending = false;

        // Remove the broken cached state so the next attempt
        // (viewport re-entry or a click) can retry cleanly.
        if (youtubePlayers.get(element) === state) {
          youtubePlayers.delete(element);
        }

        return state;
      });

    youtubePlayers.set(element, state);

    return state;
  }

  async function getOrCreatePortfolioPlayer(media) {
    let state = mountYouTubePlayer(media);

    if (!state) return null;

    try {
      await state.ready;
    } catch (error) {
      // mountYouTubePlayer handles the failure and clears
      // the broken cached state.
    }

    // If the first initialization failed, try once more.
    if (!state.player) {
      state = mountYouTubePlayer(media);

      if (!state) return null;

      try {
        await state.ready;
      } catch (error) {
        console.warn(
          "Portfolio video could not be started after retry:",
          error,
        );

        return null;
      }
    }

    return state.player ? state : null;
  }

  function updateYouTubeControls(element, state) {
    const card = element.closest(".portfolio-item, .work-card");
    const play = card?.querySelector('[data-video-action="play"]');
    if (play) {
      play.innerHTML = videoIcon(state.playing ? "pause" : "play");
      play.setAttribute(
        "aria-label",
        state.playing ? "Pause video" : "Play video",
      );
    }
    const mute = card?.querySelector('[data-video-action="mute"]');
    if (mute) {
      mute.innerHTML = videoIcon(state.muted ? "muted" : "sound");
      mute.setAttribute(
        "aria-label",
        state.muted ? "Unmute video" : "Mute video",
      );
    }
  }

  function initPortfolioVideoControls(grid) {
    if (!grid) return;

    grid.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-video-action]");
      const card = event.target.closest(".portfolio-item");
      const media = card?.querySelector(".youtube-media");

      if (!button || !card || !media) return;

      event.preventDefault();
      event.stopPropagation();

      const action = button.dataset.videoAction;

      // -----------------------------------------
      // FULLSCREEN
      // -----------------------------------------
      if (action === "fullscreen") {
        try {
          if (document.fullscreenElement === card) {
            await document.exitFullscreen?.();
          } else if (card.requestFullscreen) {
            await card.requestFullscreen();
          } else if (card.webkitRequestFullscreen) {
            card.webkitRequestFullscreen();
          }
        } catch (error) {
          console.warn("Portfolio fullscreen failed:", error);
        }

        return;
      }

      // -----------------------------------------
      // GET / CREATE THE CORRECT PLAYER FOR THIS CARD
      // -----------------------------------------
      const state = await getOrCreatePortfolioPlayer(media);

      if (!state?.player) {
        console.warn("Portfolio player is unavailable.");
        return;
      }

      const player = state.player;

      // -----------------------------------------
      // PLAY / PAUSE
      // -----------------------------------------
      if (action === "play") {
        if (state.playing) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }

        return;
      }

      // -----------------------------------------
      // MUTE / UNMUTE
      // -----------------------------------------
      if (action === "mute") {
        if (state.muted) {
          player.unMute();
          state.muted = false;
        } else {
          player.mute();
          state.muted = true;
        }

        updateYouTubeControls(media, state);
      }
    });

    // -----------------------------------------
    // FULLSCREEN ICON SYNC
    // -----------------------------------------
    const syncFullscreenButtons = () => {
      grid.querySelectorAll(".portfolio-item").forEach((card) => {
        const button = card.querySelector('[data-video-action="fullscreen"]');

        if (!button) return;

        const active = document.fullscreenElement === card;

        button.innerHTML = videoIcon(active ? "exit-fullscreen" : "fullscreen");

        button.setAttribute(
          "aria-label",
          active ? "Exit fullscreen" : "Enter fullscreen",
        );
      });
    };

    document.addEventListener("fullscreenchange", syncFullscreenButtons);

    document.addEventListener("webkitfullscreenchange", syncFullscreenButtons);
  }

  function initIntroYouTube() {
    const element = document.getElementById("intro-video-player");
    const frame = document.getElementById("intro-video-frame");
    const muteBtn = document.getElementById("intro-video-mute");
    const muteLabel = document.getElementById("intro-video-mute-label");
    const fullscreenBtn = document.getElementById("intro-video-fullscreen");
    const scrub = document.getElementById("intro-video-scrub");
    const scrubFill = document.getElementById("intro-video-scrub-fill");
    const id = normalizeYouTubeId(window.SunnyShootsConfig?.INTRO_YOUTUBE_URL);
    if (!element || !id) return;
    element.classList.add("youtube-media");
    element.dataset.youtubeId = id;
    element.dataset.youtubePoster = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    const state = mountYouTubePlayer(element);
    const update = () => {
      if (!state?.player || !scrubFill || !scrub) return;
      const duration = state.player.getDuration();
      if (!duration) return;
      const progress = state.player.getCurrentTime() / duration;
      scrubFill.style.width = `${progress * 100}%`;
      scrub.style.setProperty("--scrub-progress", `${progress * 100}%`);
      scrub.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    };
    state?.ready?.then(() => {
      state.player.playVideo();
      window.setInterval(update, 250);
    });
    muteBtn?.addEventListener("click", () =>
      state?.ready?.then(() => {
        if (state.muted) {
          state.player.unMute();
          state.muted = false;
        } else {
          state.player.mute();
          state.muted = true;
        }
        muteBtn.setAttribute("aria-pressed", String(!state.muted));
        if (muteLabel) muteLabel.textContent = state.muted ? "Unmute" : "Mute";
      }),
    );
    fullscreenBtn?.addEventListener("click", () => {
      const result =
        frame?.requestFullscreen?.() || frame?.webkitRequestFullscreen?.();
      result?.catch?.(() => {});
    });
    let dragging = false;
    const seek = (event) =>
      state?.ready?.then(() => {
        const duration = state.player.getDuration();
        if (!duration) return;
        const rect = scrub.getBoundingClientRect();
        const ratio = Math.min(
          Math.max((event.clientX - rect.left) / rect.width, 0),
          1,
        );
        state.player.seekTo(ratio * duration, true);
        update();
      });
    scrub?.addEventListener("pointerdown", (event) => {
      dragging = true;
      scrub.setPointerCapture?.(event.pointerId);
      seek(event);
    });
    scrub?.addEventListener("pointermove", (event) => {
      if (dragging) seek(event);
    });
    scrub?.addEventListener("pointerup", () => {
      dragging = false;
    });
    scrub?.addEventListener("keydown", (event) =>
      state?.ready?.then(() => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const duration = state.player.getDuration();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? duration
              : Math.max(
                  0,
                  Math.min(
                    duration,
                    state.player.getCurrentTime() +
                      (event.key === "ArrowRight" ? 5 : -5),
                  ),
                );
        state.player.seekTo(next, true);
      }),
    );
  }

  function videoIcon(name) {
    const paths = {
      play: '<path d="M8 5v14l11-7z"/>',
      pause: '<path d="M7 5h3v14H7zm7 0h3v14h-3z"/>',
      muted: '<path d="M4 9v6h4l5 4V5L8 9H4zM17 9l4 6m0-6-4 6"/>',
      sound:
        '<path d="M4 9v6h4l5 4V5L8 9H4zm12.5-2a6 6 0 0 1 0 10m2-12a9 9 0 0 1 0 14"/>',
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
    try {
      categories = JSON.parse(script.textContent);
    } catch (error) {
      console.error("Portfolio categories could not be parsed:", error);
      return;
    }
    filterBar.innerHTML = categories
      .map(
        (category, index) =>
          `<button class="filter-chip${index === 0 ? " is-active" : ""}" type="button" role="tab" aria-selected="${index === 0}" data-filter="${category.id}">${category.label}</button>`,
      )
      .join("");
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
          const categories = (item.getAttribute("data-categories") || "").split(
            " ",
          );
          const matches = filter === "all" || categories.includes(filter);
          item.classList.toggle("is-hidden", !matches);
        });
      });

      chip.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next =
          chips[
            (Array.from(chips).indexOf(chip) + direction + chips.length) %
              chips.length
          ];
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
        const ratio = Math.min(
          Math.max((event.clientX - rect.left) / rect.width, 0),
          1,
        );
        video.currentTime = ratio * video.duration;
        updateProgress();
      };
      scrub.addEventListener("pointerdown", (event) => {
        dragging = true;
        scrub.setPointerCapture?.(event.pointerId);
        seekFromPointer(event);
      });
      scrub.addEventListener("pointermove", (event) => {
        if (dragging) seekFromPointer(event);
      });
      scrub.addEventListener("pointerup", () => {
        dragging = false;
      });
      scrub.addEventListener("pointercancel", () => {
        dragging = false;
      });
      scrub.addEventListener("keydown", (event) => {
        if (
          !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) ||
          !video.duration
        )
          return;
        event.preventDefault();
        if (event.key === "Home") video.currentTime = 0;
        else if (event.key === "End") video.currentTime = video.duration;
        else
          video.currentTime = Math.max(
            0,
            Math.min(
              video.duration,
              video.currentTime + (event.key === "ArrowRight" ? 5 : -5),
            ),
          );
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

    initIntroYouTube();
    applyContactConfig();
  }

  return { init };
})();
