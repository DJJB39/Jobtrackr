// JobTrackr Chrome Extension — Popup Script

const loginView = document.getElementById("login-view");
const authedView = document.getElementById("authed-view");
const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const errorMsg = document.getElementById("error-msg");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");
const screenshotBtn = document.getElementById("screenshot-btn");
const extractResult = document.getElementById("extract-result");
const extractFields = document.getElementById("extract-fields");
const extractLoading = document.getElementById("extract-loading");
const extractError = document.getElementById("extract-error");
const extractClose = document.getElementById("extract-close");
const saveExtractedBtn = document.getElementById("save-extracted-btn");
const extractBadge = document.getElementById("extract-badge");

let lastExtractedData = null;

// Check auth state on popup open
chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" }, (response) => {
  if (response && response.loggedIn) {
    showAuthed(response.email);
  } else {
    showLogin();
  }
});

function showLogin() {
  loginView.style.display = "block";
  authedView.style.display = "none";
  errorMsg.style.display = "none";
}

function showAuthed(email) {
  loginView.style.display = "none";
  authedView.style.display = "block";
  userEmail.textContent = email || "Signed in";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) return;

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in…";
  errorMsg.style.display = "none";

  chrome.runtime.sendMessage(
    { type: "LOGIN", payload: { email, password } },
    (response) => {
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In";

      if (response && response.success) {
        showAuthed(response.email);
      } else {
        errorMsg.textContent = response?.error || "Login failed";
        errorMsg.style.display = "block";
      }
    }
  );
});

logoutBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "LOGOUT" }, () => {
    showLogin();
  });
});

// Screenshot capture
screenshotBtn.addEventListener("click", () => {
  screenshotBtn.disabled = true;
  screenshotBtn.textContent = "Capturing…";
  extractLoading.style.display = "flex";
  extractResult.style.display = "none";
  extractError.style.display = "none";

  chrome.runtime.sendMessage(
    { type: "CAPTURE_SCREENSHOT", payload: {} },
    (response) => {
      screenshotBtn.disabled = false;
      screenshotBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> Capture This Page`;
      extractLoading.style.display = "none";

      if (response && response.success && response.data) {
        lastExtractedData = response.data;
        showExtractedData(response.data);
      } else {
        extractError.textContent = response?.error || "Extraction failed";
        extractError.style.display = "block";
      }
    }
  );
});

function showExtractedData(data) {
  const conf = Math.round((data.confidence || 0) * 100);
  extractBadge.textContent = `${conf}% confidence`;
  extractBadge.className = `extract-badge ${conf >= 70 ? "high" : "low"}`;

  const fields = [
    { label: "Company", value: data.company },
    { label: "Title", value: data.job_title },
    { label: "Location", value: data.location },
    { label: "Salary", value: data.salary },
    { label: "Type", value: data.employment_type },
  ].filter(f => f.value);

  extractFields.innerHTML = fields.map(f =>
    `<div class="extract-field"><span class="field-label">${f.label}</span><span class="field-value">${f.value}</span></div>`
  ).join("");

  if (data.warnings?.length) {
    extractFields.innerHTML += `<div class="extract-warnings">${data.warnings.map(w => `<span class="warning-tag">⚠ ${w}</span>`).join("")}</div>`;
  }

  extractResult.style.display = "block";
}

extractClose.addEventListener("click", () => {
  extractResult.style.display = "none";
  lastExtractedData = null;
});

saveExtractedBtn.addEventListener("click", () => {
  if (!lastExtractedData) return;

  saveExtractedBtn.disabled = true;
  saveExtractedBtn.textContent = "Saving…";

  const payload = {
    company: lastExtractedData.company || "",
    role: lastExtractedData.job_title || "",
    location: lastExtractedData.location || null,
    description: lastExtractedData.description?.slice(0, 5000) || null,
    salary: lastExtractedData.salary || null,
    sourceUrl: lastExtractedData.sourceUrl || null,
  };

  chrome.runtime.sendMessage(
    { type: "SAVE_JOB", payload },
    (response) => {
      saveExtractedBtn.disabled = false;
      saveExtractedBtn.textContent = "Save to Board";

      if (response && response.success) {
        extractResult.style.display = "none";
        lastExtractedData = null;
        // Show brief success
        extractError.style.display = "block";
        extractError.className = "extract-success";
        extractError.textContent = "✓ Saved to your board!";
        setTimeout(() => {
          extractError.style.display = "none";
          extractError.className = "extract-error";
        }, 2500);
      } else {
        extractError.textContent = response?.error || "Save failed";
        extractError.style.display = "block";
      }
    }
  );
});
