document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobil-Menü: Hamburger öffnet/schließt die Navigation
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");

  if (navToggle && siteNav) {
    const closeNav = () => {
      siteNav.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    navToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  // Scroll-Reveal: Inhalte gleiten beim Scrollen sanft ein
  const targets = document.querySelectorAll(
    ".grid .card, .steps li, .faq details, .split-body, .contact-layout, " +
    ".section:not(.hero-content) > .container > .eyebrow, " +
    ".section:not(.hero-content) > .container > h2, " +
    ".section:not(.hero-content) > .container > .section-intro"
  );

  if (!reduceMotion && "IntersectionObserver" in window) {
    targets.forEach((el) => {
      el.classList.add("reveal");
      const siblings = Array.from(el.parentElement.children).filter((s) =>
        s.classList.contains("reveal")
      );
      const index = siblings.indexOf(el);
      el.style.transitionDelay = Math.min(Math.max(index, 0) * 70, 350) + "ms";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  }

  // Einblicke-Galerie: läuft von selbst durch, pausiert bei Hover/Touch,
  // lässt sich währenddessen aber weiterhin manuell verschieben (Wischen,
  // Trackpad, Shift+Mausrad) — dafür treiben wir scrollLeft selbst per rAF
  // an, statt den ganzen Track per CSS-Transform zu animieren.
  const galleryTrack = document.querySelector(".gallery-track");
  const gallerySet = galleryTrack ? galleryTrack.querySelector(".gallery-set") : null;

  if (galleryTrack && gallerySet && !reduceMotion) {
    const speedPxPerSec = 36;
    let paused = false;
    let lastTime = null;

    const step = (time) => {
      if (lastTime === null) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (!paused) {
        galleryTrack.scrollLeft += speedPxPerSec * dt;
        const setWidth = gallerySet.getBoundingClientRect().width;
        if (setWidth > 0 && galleryTrack.scrollLeft >= setWidth) {
          galleryTrack.scrollLeft -= setWidth;
        }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    const pause = () => { paused = true; };
    let resumeTimer;
    const resumeSoon = () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        paused = false;
        lastTime = null;
      }, 1000);
    };

    galleryTrack.addEventListener("mouseenter", pause);
    galleryTrack.addEventListener("mouseleave", () => { paused = false; lastTime = null; });
    galleryTrack.addEventListener("touchstart", pause, { passive: true });
    galleryTrack.addEventListener("touchend", resumeSoon, { passive: true });
    galleryTrack.addEventListener("focusin", pause);
    galleryTrack.addEventListener("focusout", () => { paused = false; lastTime = null; });
  }

  // Scroll-Fortschritt: feine Linie am oberen Rand
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:2px;background:#0a0a0a;transform:scaleX(0);transform-origin:left;z-index:100;pointer-events:none;";
  document.body.appendChild(progress);

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform =
      "scaleX(" + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ")";
  };
  updateProgress();
  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("resize", updateProgress);

  // Startseite: volle Kopfzeile erst einblenden, sobald der Hero
  // (mit eigener Mini-Nav) durchgescrollt ist — kein Doppel-Nav-Effekt
  const siteHeader = document.querySelector(".site-header");
  const heroSection = document.querySelector(".hero");
  if (siteHeader && document.body.classList.contains("home")) {
    const revealThreshold = () =>
      heroSection ? heroSection.offsetHeight - 80 : 40;
    const toggleHeader = () => {
      siteHeader.classList.toggle("header-visible", window.scrollY > revealThreshold());
    };
    toggleHeader();
    addEventListener("scroll", toggleHeader, { passive: true });
    addEventListener("resize", toggleHeader);
  }

  // Kontaktformular: sendet an /api/contact, zeigt Status ohne Seitenwechsel
  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#contact-status");

  if (form && status) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const data = Object.fromEntries(new FormData(form).entries());

      submitBtn.disabled = true;
      status.textContent = "Wird gesendet …";
      status.dataset.state = "";

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("request-failed");

        status.textContent = "Danke! Ihre Anfrage ist angekommen — wir melden uns zeitnah.";
        status.dataset.state = "ok";
        form.reset();
      } catch (err) {
        status.textContent =
          "Das hat leider nicht geklappt. Bitte versuchen Sie es erneut oder schreiben Sie direkt eine E-Mail.";
        status.dataset.state = "error";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
});
