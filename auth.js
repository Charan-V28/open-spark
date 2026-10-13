(() => {
  const config = window.LAUNCHPAD_AUTH_CONFIG || {};
  const screen = document.getElementById("auth-screen");
  const loading = document.getElementById("auth-loading");
  const shell = document.getElementById("app-shell");
  const mobileNav = document.getElementById("mobile-nav");
  const form = document.getElementById("auth-form");
  const alertBox = document.getElementById("auth-alert");
  const submit = document.getElementById("auth-submit");
  const toggle = document.getElementById("auth-mode-toggle");
  const consentRow = document.getElementById("auth-consent-row");
  const consent = document.getElementById("auth-consent");
  const password = document.getElementById("auth-password");
  const localPreview = document.getElementById("local-preview");
  let mode = "signin";
  let appLoaded = false;

  const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey);
  const signupEnabled = config.enableAccountCreation === true;
  const localHost = location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);
  const authBase = String(config.supabaseUrl || "").replace(/\/$/, "") + "/auth/v1";

  function alert(message, kind = "info") {
    alertBox.textContent = message;
    alertBox.className = `auth-alert ${kind}`;
    alertBox.hidden = !message;
  }

  function showScreen() {
    loading.hidden = true;
    loading.querySelector("span:last-child").textContent = "Opening your space…";
    screen.hidden = false;
    shell.hidden = true;
    mobileNav.hidden = true;
  }

  function showApp(user) {
    window.launchpadUserId = user.id;
    window.launchpadUserEmail = user.email || "Signed-in account";
    loading.querySelector("span:last-child").textContent = "Loading your space…";
    loading.hidden = false;
    screen.hidden = true;
    shell.hidden = true;
    mobileNav.hidden = true;
    document.getElementById("account-email").textContent = window.launchpadUserEmail;
    const avatar = document.getElementById("avatar-button");
    avatar.textContent = (window.launchpadUserEmail.slice(0, 1) || "A").toUpperCase();
    if (!appLoaded) {
      appLoaded = true;
      import(new URL("sat-bank.mjs", location.href).href).then(({ buildSatBank }) => {
        window.LAUNCHPAD_SAT_QUESTIONS = buildSatBank();
        const script = document.createElement("script");
        script.src = new URL("app.js", location.href).href;
        script.onload = () => { loading.hidden = true; shell.hidden = false; mobileNav.hidden = false; window.dispatchEvent(new CustomEvent("launchpad:ready", { detail: user })); };
        script.onerror = () => { showScreen(); alert("The app couldn't load. Refresh the page and try again.", "error"); };
        document.body.append(script);
      }).catch(() => { appLoaded = false; showScreen(); alert("The practice question bank couldn't load. Refresh the page and try again.", "error"); });
    } else { loading.hidden = true; shell.hidden = false; mobileNav.hidden = false; }
  }

  function setMode(next) {
    mode = next;
    const card = screen.querySelector(".auth-card");
    card.classList.remove("auth-mode-change");
    void card.offsetWidth;
    card.classList.add("auth-mode-change");
    const signup = mode === "signup";
    document.getElementById("auth-title").innerHTML = signup
      ? `Make a little<br />room to <span class="name-highlight">grow.</span>`
      : `Your next move<br />starts <span class="name-highlight">here.</span>`;
    document.getElementById("auth-lead").textContent = signup
      ? "Create a free account to save ideas and keep your progress together."
      : "Sign in to pick up where you left off, or make a free account to get started.";
    document.getElementById("auth-switch-copy").textContent = signup ? "Already have an account?" : "New around here?";
    toggle.textContent = signup ? "Sign in" : "Create an account";
    submit.innerHTML = signup ? "Create my account <span>→</span>" : "Sign in <span>→</span>";
    password.autocomplete = signup ? "new-password" : "current-password";
    consentRow.hidden = !signup;
    consent.required = signup;
    document.getElementById("auth-recover").hidden = signup;
    alertBox.hidden = true;
  }

  async function authRequest(path, body, token) {
    const headers = { "Content-Type": "application/json", apikey: config.supabasePublishableKey };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${authBase}${path}`, { method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined });
    let data = {};
    try { data = await response.json(); } catch { /* Empty response */ }
    if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || "The request could not be completed.");
    return data;
  }

  function saveSession(session) {
    session.expires_at = session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
    sessionStorage.setItem("launchpad:auth-session", JSON.stringify(session));
  }

  async function currentSession() {
    if (!configured) return null;
    let session;
    try { session = JSON.parse(sessionStorage.getItem("launchpad:auth-session") || "null"); } catch { session = null; }
    if (!session?.access_token) return null;
    if (Number(session.expires_at) < Math.floor(Date.now() / 1000) + 30) {
      if (!session.refresh_token) return null;
      try {
        session = await authRequest("/token?grant_type=refresh_token", { refresh_token: session.refresh_token });
        saveSession(session);
      } catch {
        sessionStorage.removeItem("launchpad:auth-session");
        return null;
      }
    }
    try {
      const user = await authRequest("/user", null, session.access_token);
      return { id: user.id, email: user.email, token: session.access_token };
    } catch {
      sessionStorage.removeItem("launchpad:auth-session");
      return null;
    }
  }

  function providerMessage(error) {
    const text = error.message || "";
    if (/invalid login credentials/i.test(text)) return "That email and password didn't match. Check them and try again.";
    if (/email not confirmed|email_not_confirmed/i.test(text)) return "Please confirm your email from the message we sent, then sign in again.";
    if (/already registered|user already exists/i.test(text)) return "An account may already use that email. Try signing in instead.";
    if (/password should be at least|weak password/i.test(text)) return "Choose a stronger password with at least 8 characters.";
    if (/rate limit|too many requests/i.test(text)) return "Too many attempts just now. Please wait a little and try again.";
    if (/failed to fetch|networkerror/i.test(text)) return "We couldn't reach account sign-in. Check your connection and try again.";
    return text.slice(0, 220) || "We couldn't complete that request. Please try again.";
  }

  toggle.addEventListener("click", () => setMode(mode === "signin" ? "signup" : "signin"));
  document.getElementById("auth-recover").addEventListener("click", async () => {
    const email = document.getElementById("auth-email").value.trim().toLowerCase();
    if (!configured) { alert("Password reset will be available after Supabase is configured.", "error"); return; }
    if (!email || !document.getElementById("auth-email").reportValidity()) {
      alert("Enter your email address first so we know where to send the reset link.", "error");
      return;
    }
    try {
      await authRequest(`/recover?redirect_to=${encodeURIComponent(location.origin + location.pathname)}`, { email });
      alert("If an account matches that address, a password reset link will arrive shortly.", "success");
    } catch (error) {
      alert(providerMessage(error), "error");
    }
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    alert("");
    if (!configured) {
      alert(mode === "signup"
        ? "Account creation is not connected yet. A Supabase project URL and publishable key are required before accounts can be created."
        : "Account sign-in is not connected yet. A Supabase project URL and publishable key are required before you can sign in.", "error");
      return;
    }
    if (mode === "signup" && !signupEnabled) {
      alert("Account creation is paused until the privacy and terms review is complete.", "error");
      return;
    }
    if (!form.reportValidity()) return;
    if (mode === "signup" && !consent.checked) {
      alert("Please confirm the age and notice checkboxes before creating an account.", "error");
      return;
    }
    const email = document.getElementById("auth-email").value.trim().toLowerCase();
    const secret = password.value;
    if (mode === "signup" && secret.length < 8) {
      alert("Choose a password with at least 8 characters.", "error");
      return;
    }
    submit.disabled = true;
    submit.textContent = mode === "signup" ? "Creating your account…" : "Signing you in…";
    try {
      if (mode === "signup") {
        const redirectTo = `${location.origin}${location.pathname}`;
        const result = await authRequest(`/signup?redirect_to=${encodeURIComponent(redirectTo)}`, { email, password: secret });
        setMode("signin");
        document.getElementById("auth-email").value = email;
        password.value = "";
        consent.checked = false;
        alert(result.access_token
          ? "Your account is created. Sign in with your new email and password to continue."
          : "Check your inbox to confirm your email, then sign in with your new account.", "success");
      } else {
        const result = await authRequest("/token?grant_type=password", { email, password: secret });
        saveSession(result);
        showApp({ id: result.user.id, email: result.user.email, token: result.access_token });
      }
    } catch (error) {
      alert(providerMessage(error), "error");
    } finally {
      submit.disabled = false;
      submit.innerHTML = mode === "signup" ? "Create my account <span>→</span>" : "Sign in <span>→</span>";
    }
  });

  localPreview.hidden = !(config.allowLocalPreview && localHost);
  if (!configured) {
    alert("Account provider is not connected yet. Create account and sign in will work after Supabase is configured. You can preview locally for now.", "info");
    document.getElementById("auth-title").textContent = "A good place to begin.";
  }
  localPreview.addEventListener("click", () => {
    sessionStorage.setItem("launchpad:local-preview", "true");
    showApp({ id: "local-preview", email: "Local preview" });
  });

  document.addEventListener("click", async event => {
    if (!event.target.closest("[data-auth-action=signout]")) return;
    event.preventDefault();
    const session = (() => { try { return JSON.parse(sessionStorage.getItem("launchpad:auth-session") || "null"); } catch { return null; } })();
    if (configured && session?.access_token) {
      try { await authRequest("/logout", {}, session.access_token); } catch { /* Local sign-out still clears this browser session. */ }
    }
    sessionStorage.removeItem("launchpad:auth-session");
    sessionStorage.removeItem("launchpad:local-preview");
    location.reload();
  });

  currentSession().then(user => {
    if (user) showApp(user);
    else showScreen();
  }).catch(() => showScreen());
})();
