// JobTrackr Chrome Extension — Background Service Worker
// Handles API calls to the extension-save-job edge function.

const SUPABASE_URL = "https://goqjoutcmnmlpdbqfaum.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWpvdXRjbW5tbHBkYnFmYXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MjYxODgsImV4cCI6MjA4NjMwMjE4OH0.lSi4yJRnei2aMI6kZ6eLp6VD9DUZ7UGJf7Wt67pqmHk";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SAVE_JOB") {
    handleSaveJob(message.payload).then(sendResponse);
    return true; // keep channel open for async response
  }
  if (message.type === "LOGIN") {
    handleLogin(message.payload).then(sendResponse);
    return true;
  }
  if (message.type === "LOGOUT") {
    chrome.storage.local.remove(["access_token", "refresh_token", "user_email"], () => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (message.type === "GET_AUTH_STATE") {
    chrome.storage.local.get(["access_token", "user_email"], (data) => {
      sendResponse({ loggedIn: !!data.access_token, email: data.user_email || null });
    });
    return true;
  }
  if (message.type === "CAPTURE_SCREENSHOT") {
    handleScreenshotCapture(message.payload).then(sendResponse);
    return true;
  }
  if (message.type === "EXTRACT_FROM_IMAGE") {
    handleExtractFromImage(message.payload).then(sendResponse);
    return true;
  }
});

async function handleLogin({ email, password }) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error_description || err.msg || "Login failed" };
    }

    const data = await res.json();
    await chrome.storage.local.set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_email: data.user?.email || email,
    });

    return { success: true, email: data.user?.email || email };
  } catch (err) {
    return { success: false, error: "Network error — check your connection" };
  }
}

async function getAccessToken() {
  const data = await chrome.storage.local.get(["access_token", "refresh_token"]);
  if (!data.access_token) return null;

  // Try to parse JWT expiry
  try {
    const payload = JSON.parse(atob(data.access_token.split(".")[1]));
    const expiresAt = payload.exp * 1000;
    if (Date.now() < expiresAt - 60000) {
      return data.access_token; // still valid
    }
  } catch {
    // Can't parse — try refresh
  }

  // Refresh token
  if (!data.refresh_token) return null;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: data.refresh_token }),
      }
    );

    if (!res.ok) {
      await chrome.storage.local.remove(["access_token", "refresh_token", "user_email"]);
      return null;
    }

    const refreshed = await res.json();
    await chrome.storage.local.set({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
    });
    return refreshed.access_token;
  } catch {
    return null;
  }
}

async function handleSaveJob(payload) {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Not logged in — click the extension icon to sign in" };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/extension-save-job`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to save job" };
    }
    return { success: true, jobId: data.jobId };
  } catch (err) {
    return { success: false, error: "Network error — check your connection" };
  }
}

async function handleScreenshotCapture({ sourceUrl }) {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Not logged in" };
  }

  try {
    // Capture the visible tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return { success: false, error: "No active tab found" };
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png", quality: 85 });
    const base64 = dataUrl.split(",")[1];

    return await callExtractEndpoint(token, base64, sourceUrl || tab.url);
  } catch (err) {
    return { success: false, error: err.message || "Screenshot capture failed" };
  }
}

async function handleExtractFromImage({ imageBase64, sourceUrl }) {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Not logged in" };
  }
  return await callExtractEndpoint(token, imageBase64, sourceUrl);
}

async function callExtractEndpoint(token, imageBase64, sourceUrl) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/ai-assist`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({
          mode: "extract_from_screenshot",
          imageBase64,
          sourceUrl,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Extraction failed" };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: "Network error" };
  }
}
