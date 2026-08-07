/* ==========================================================================
   Harbor & Hound Pet Care - behaviour + motion
   Motion library: GSAP 3 + ScrollTrigger (loaded from CDN in each page head).
   Rules honoured here:
     - No window "scroll" listeners anywhere. ScrollTrigger only.
     - Content is visible by default. JS hides-then-reveals, so a failed script
       or a headless render still shows a complete page.
     - Every animation degrades to nothing under prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== "undefined";
  var animate = hasGsap && !reduceMotion;

  if (hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ------------------------------------------------------------------
     Navigation drawer
     ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var drawer = document.getElementById("nav-drawer");
    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      drawer.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        var first = drawer.querySelector("a, button");
        if (first) first.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close the drawer if the viewport grows back to the desktop nav.
    window.matchMedia("(min-width: 1081px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     Sticky header condense.
     Reason: reclaims vertical space once the user is reading, and signals
     that the page has left the hero. Uses ScrollTrigger, never a listener.
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    if (hasScrollTrigger) {
      ScrollTrigger.create({
        start: 40,
        end: 99999,
        onUpdate: function (self) {
          header.classList.toggle("is-stuck", self.scroll() > 40);
        },
        onToggle: function (self) {
          header.classList.toggle("is-stuck", self.isActive);
        }
      });
      // Set the initial state for deep links that land mid-page.
      header.classList.toggle("is-stuck", window.scrollY > 40);
    } else {
      header.classList.add("is-stuck");
    }
  }

  /* ------------------------------------------------------------------
     Hero entrance.
     Reason: establishes reading order (headline, then promise, then action)
     and lets the photograph settle in behind the copy.
     ------------------------------------------------------------------ */
  function initHero() {
    if (!animate) return;
    var hero = document.querySelector("[data-hero]");
    if (!hero) return;

    var copy = hero.querySelectorAll("[data-hero-item]");
    var media = hero.querySelector(".hero-media img");
    var badge = hero.querySelector(".hero-badge");

    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    if (copy.length) {
      gsap.set(copy, { opacity: 0, y: 26 });
      tl.to(copy, { opacity: 1, y: 0, duration: 0.85, stagger: 0.09 }, 0.05);
    }
    if (media) {
      gsap.set(media, { scale: 1.14, opacity: 0 });
      tl.to(media, { scale: 1, opacity: 1, duration: 1.25 }, 0);
    }
    if (badge) {
      gsap.set(badge, { opacity: 0, y: 22 });
      tl.to(badge, { opacity: 1, y: 0, duration: 0.7 }, 0.55);
    }
  }

  /* ------------------------------------------------------------------
     Scroll reveals.
     Reason: sequences a section's parts so the eye lands on the heading
     before the supporting tiles. Applied per section, not page-wide.
     ------------------------------------------------------------------ */
  function initReveals() {
    if (!animate || !hasScrollTrigger) return;

    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      gsap.set(el, { opacity: 0, y: 22 });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    gsap.utils.toArray("[data-reveal-group]").forEach(function (group) {
      var kids = group.children;
      if (!kids.length) return;
      gsap.set(kids, { opacity: 0, y: 26 });
      gsap.to(kids, {
        opacity: 1,
        y: 0,
        duration: 0.62,
        ease: "power2.out",
        stagger: 0.07,
        scrollTrigger: { trigger: group, start: "top 85%", once: true }
      });
    });
  }

  /* ------------------------------------------------------------------
     Parallax on decorative photography only. Never on text.
     Reason: depth between the copy layer and the image layer.
     ------------------------------------------------------------------ */
  function initParallax() {
    if (!animate || !hasScrollTrigger) return;

    gsap.utils.toArray("[data-parallax]").forEach(function (layer) {
      var amount = parseFloat(layer.getAttribute("data-parallax")) || 9;
      gsap.fromTo(
        layer,
        { yPercent: -amount / 2 },
        {
          yPercent: amount / 2,
          ease: "none",
          scrollTrigger: {
            trigger: layer.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });
  }

  /* ------------------------------------------------------------------
     Count-up on real figures.
     Reason: the numbers are the trust argument, so they get one beat of
     attention. Falls back to the printed final value with no JS.
     ------------------------------------------------------------------ */
  function initCounters() {
    if (!animate || !hasScrollTrigger) return;

    gsap.utils.toArray("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      if (isNaN(target)) return;

      var obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: function () {
          var n = decimals ? obj.v.toFixed(decimals) : Math.round(obj.v).toLocaleString("en-US");
          el.textContent = prefix + n + suffix;
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Pinned horizontal pan for the four-step intake flow.
     Reason: the steps are an ordered journey, so horizontal travel mirrors
     the progression instead of stacking four look-alike cards.
     Below 900px, or under reduced motion, the same markup becomes a
     scroll-snap carousel.
     ------------------------------------------------------------------ */
  function initPan() {
    var wrap = document.querySelector("[data-pan]");
    if (!wrap) return;
    var track = wrap.querySelector(".pan-track");
    if (!track) return;

    var canPin = animate && hasScrollTrigger && window.innerWidth >= 900;
    if (!canPin) {
      wrap.classList.add("pan--static");
      return;
    }

    var ctx = gsap.context(function () {
      gsap.to(track, {
        x: function () { return -(track.scrollWidth - window.innerWidth + 48); },
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: function () { return "+=" + (track.scrollWidth - window.innerWidth + 48); },
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    }, wrap);

    // If the viewport drops below the pin threshold, hand back to CSS snapping.
    window.matchMedia("(max-width: 899px)").addEventListener("change", function (mq) {
      if (mq.matches) {
        ctx.revert();
        wrap.classList.add("pan--static");
      }
    });
  }

  /* ------------------------------------------------------------------
     Forms. No backend is wired up, so submission is validated client side
     and reported inline. Nothing is transmitted anywhere.
     ------------------------------------------------------------------ */
  function initForms() {
    document.querySelectorAll("form[data-form]").forEach(function (form) {
      var status = form.querySelector(".form-status");
      var submit = form.querySelector("[type='submit']");

      function showError(field, message) {
        var slot = field.parentElement.querySelector(".err");
        field.setAttribute("aria-invalid", "true");
        if (slot) slot.textContent = message;
      }
      function clearError(field) {
        var slot = field.parentElement.querySelector(".err");
        field.removeAttribute("aria-invalid");
        if (slot) slot.textContent = "";
      }

      form.querySelectorAll(".input, .select, .textarea").forEach(function (field) {
        field.addEventListener("blur", function () {
          if (field.required && !field.value.trim()) {
            showError(field, "This field is required.");
          } else if (field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value)) {
            showError(field, "Enter a valid email address, for example name@example.com.");
          } else {
            clearError(field);
          }
        });
        field.addEventListener("input", function () {
          if (field.getAttribute("aria-invalid") === "true" && field.value.trim()) clearError(field);
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var firstBad = null;

        form.querySelectorAll(".input, .select, .textarea").forEach(function (field) {
          if (field.required && !field.value.trim()) {
            showError(field, "This field is required.");
            if (!firstBad) firstBad = field;
          } else if (field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value)) {
            showError(field, "Enter a valid email address, for example name@example.com.");
            if (!firstBad) firstBad = field;
          } else {
            clearError(field);
          }
        });

        var consent = form.querySelector("input[type='checkbox'][required]");
        if (consent && !consent.checked) {
          if (status) {
            status.className = "form-status is-err";
            status.textContent = "Please confirm you have read the Privacy Policy before submitting.";
          }
          consent.focus();
          return;
        }

        if (firstBad) {
          if (status) {
            status.className = "form-status is-err";
            status.textContent = "Some details are missing. Check the highlighted fields and try again.";
          }
          firstBad.focus();
          return;
        }

        if (submit) {
          submit.classList.add("is-busy");
          submit.insertAdjacentHTML("afterbegin", '<span class="spinner" aria-hidden="true"></span>');
        }

        window.setTimeout(function () {
          if (submit) {
            submit.classList.remove("is-busy");
            var sp = submit.querySelector(".spinner");
            if (sp) sp.remove();
          }
          if (status) {
            status.className = "form-status is-ok";
            status.textContent = form.getAttribute("data-success") ||
              "Thank you. Our care team will reply within one business day.";
          }
          form.reset();
        }, 900);
      });
    });
  }

  /* ------------------------------------------------------------------
     Cookie consent. Stores the choice locally; no tags fire before it.
     ------------------------------------------------------------------ */
  function initCookies() {
    var bar = document.getElementById("cookie-bar");
    if (!bar) return;
    var KEY = "hh-cookie-choice";

    var stored = null;
    try { stored = window.localStorage.getItem(KEY); } catch (err) { stored = null; }

    if (!stored) {
      window.setTimeout(function () { bar.classList.add("is-open"); }, 700);
    }

    function choose(value) {
      try { window.localStorage.setItem(KEY, value); } catch (err) { /* storage blocked */ }
      bar.classList.remove("is-open");
    }

    bar.querySelectorAll("[data-cookie]").forEach(function (btn) {
      btn.addEventListener("click", function () { choose(btn.getAttribute("data-cookie")); });
    });

    document.querySelectorAll("[data-cookie-reopen]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        bar.classList.add("is-open");
        var firstBtn = bar.querySelector("[data-cookie]");
        if (firstBtn) firstBtn.focus();
      });
    });
  }

  /* ------------------------------------------------------------------
     Current year in the footer.
     ------------------------------------------------------------------ */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    initNav();
    initHeader();
    initHero();
    initReveals();
    initParallax();
    initCounters();
    initPan();
    initForms();
    initCookies();
    initYear();
    if (hasScrollTrigger) {
      window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
