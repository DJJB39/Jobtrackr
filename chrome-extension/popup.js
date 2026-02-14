// JobTrackr Chrome Extension — Popup Script

const loginView = document.getElementById("login-view");
const authedView = document.getElementById("authed-view");
const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const errorMsg = document.getElementById("error-msg");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

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
