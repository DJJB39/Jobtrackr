// JobTrackr Chrome Extension — Content Script
// Detects supported job pages and injects a "Save to JobTrackr" button.

(function () {
  if (document.getElementById("jobtrackr-save-btn")) return;

  const SITE = detectSite();
  if (!SITE) return;

  // --- Scraper Functions ---

  function detectSite() {
    const host = location.hostname;
    if (host.includes("linkedin.com")) return "linkedin";
    if (host.includes("indeed.com") || host.includes("indeed.co.uk")) return "indeed";
    if (host.includes("reed.co.uk")) return "reed";
    if (host.includes("greenhouse.io")) return "greenhouse";
    return null;
  }

  function text(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : null;
  }

  function scrapeLinkedIn() {
    return {
      role:
        text(".top-card-layout__title") ||
        text("h1.t-24") ||
        text("h1") ||
        "",
      company:
        text(".topcard__org-name-link") ||
        text("a.topcard__org-name-link") ||
        text(".jobs-unified-top-card__company-name") ||
        "",
      description:
        text(".description__text") ||
        text(".jobs-description__content") ||
        "",
      location:
        text(".topcard__flavor--bullet") ||
        text(".jobs-unified-top-card__bullet") ||
        null,
      salary:
        text(".salary") ||
        text(".compensation__salary") ||
        text(".jobs-unified-top-card__job-insight--highlight") ||
        null,
      closeDate: null,
    };
  }

  function scrapeIndeed() {
    return {
      role:
        text("h1.jobsearch-JobInfoHeader-title") ||
        text("h1[data-testid='jobsearch-JobInfoHeader-title']") ||
        text("h1") ||
        "",
      company:
        text("[data-company-name]") ||
        text("[data-testid='inlineHeader-companyName']") ||
        "",
      description:
        text("#jobDescriptionText") ||
        text(".jobsearch-jobDescriptionText") ||
        "",
      location:
        text("[data-testid='inlineHeader-companyLocation']") ||
        text(".jobsearch-JobInfoHeader-subtitle > div:nth-child(2)") ||
        null,
      salary:
        text("#salaryInfoAndJobType") ||
        text(".salary-snippet") ||
        null,
      closeDate: null,
    };
  }

  function scrapeReed() {
    return {
      role:
        text('h1[itemprop="title"]') ||
        text("h1") ||
        "",
      company:
        text('[itemprop="hiringOrganization"]') ||
        text(".company-name") ||
        "",
      description:
        text('[itemprop="description"]') ||
        text(".description") ||
        "",
      location:
        text('[itemprop="jobLocation"]') ||
        text(".location") ||
        null,
      salary:
        text(".salary") ||
        text('[data-qa="salaryLbl"]') ||
        null,
      closeDate: null,
    };
  }

  function scrapeGreenhouse() {
    return {
      role:
        text("h1.app-title") ||
        text("h1") ||
        "",
      company:
        text(".company-name") ||
        text('meta[property="og:title"]')?.split(" at ")?.[1] ||
        "",
      description:
        text("#content .body") ||
        text("#content") ||
        "",
      location:
        text(".location") ||
        null,
      salary: null,
      closeDate: null,
    };
  }

  function scrape() {
    switch (SITE) {
      case "linkedin": return scrapeLinkedIn();
      case "indeed": return scrapeIndeed();
      case "reed": return scrapeReed();
      case "greenhouse": return scrapeGreenhouse();
      default: return null;
    }
  }

  // --- Inject Save Button ---

  const btn = document.createElement("button");
  btn.id = "jobtrackr-save-btn";
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    <span>Save to JobTrackr</span>
  `;
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    backgroundColor: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
    transition: "all 0.2s ease",
  });

  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "scale(1.05)";
    btn.style.boxShadow = "0 6px 28px rgba(99,102,241,0.5)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "scale(1)";
    btn.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)";
  });

  let saving = false;
  btn.addEventListener("click", async () => {
    if (saving) return;
    saving = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<span>Saving…</span>`;
    btn.style.opacity = "0.7";

    const data = scrape();
    if (!data || (!data.role && !data.company)) {
      showFeedback(btn, false, "Could not detect job details");
      btn.innerHTML = originalHTML;
      btn.style.opacity = "1";
      saving = false;
      return;
    }

    // Truncate description to 5000 chars
    if (data.description && data.description.length > 5000) {
      data.description = data.description.slice(0, 5000);
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: "SAVE_JOB",
        payload: { ...data, sourceUrl: location.href },
      });

      if (response && response.success) {
        showFeedback(btn, true, "Saved!");
      } else {
        showFeedback(btn, false, response?.error || "Failed to save");
      }
    } catch (err) {
      showFeedback(btn, false, "Extension error");
    }

    btn.innerHTML = originalHTML;
    btn.style.opacity = "1";
    saving = false;
  });

  document.body.appendChild(btn);

  function showFeedback(button, success, message) {
    const feedback = document.createElement("div");
    feedback.textContent = `${success ? "✓" : "✗"} ${message}`;
    Object.assign(feedback.style, {
      position: "fixed",
      bottom: "80px",
      right: "24px",
      zIndex: "2147483647",
      padding: "8px 16px",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: "500",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#fff",
      backgroundColor: success ? "#22c55e" : "#ef4444",
      boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      transition: "opacity 0.3s ease",
    });
    document.body.appendChild(feedback);
    setTimeout(() => {
      feedback.style.opacity = "0";
      setTimeout(() => feedback.remove(), 300);
    }, 2500);
  }
})();
