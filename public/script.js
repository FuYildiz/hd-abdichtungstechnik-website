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
    ".grid .card, .portfolio-grid .portfolio-item, .steps li, .faq details, .split-body, .contact-layout"
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

  // Dezenter 3D-Tilt auf der Hero-Illustration, nur bei Maus-Bedienung, sehr subtil
  const heroVisual = document.querySelector(".hero-visual");
  if (heroVisual && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    const maxTilt = 4;

    heroVisual.addEventListener("mousemove", (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroVisual.style.transform =
        "perspective(900px) rotateY(" + (x * maxTilt).toFixed(2) + "deg)" +
        " rotateX(" + (-y * maxTilt).toFixed(2) + "deg)";
    });

    heroVisual.addEventListener("mouseleave", () => {
      heroVisual.style.transform = "";
    });
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
