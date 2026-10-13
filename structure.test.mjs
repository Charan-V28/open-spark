import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
const auth = await readFile(new URL("./auth.js", import.meta.url), "utf8");
const authConfig = await readFile(new URL("./auth-config.js", import.meta.url), "utf8");
const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

test("Open Spark is the visible product identity", () => {
  assert.match(html, /<title>Open Spark — your next move starts here<\/title>/);
  assert.match(html, /YOUR OPEN SPARK/);
  assert.doesNotMatch(html, /Launchpad/);
});

test("protected app starts hidden and authentication loads app code after sign-in", () => {
  assert.match(html, /id="app-shell" hidden/);
  assert.match(html, /id="mobile-nav"[^>]*hidden/);
  assert.doesNotMatch(html, /<script[^>]+src="app\.js"/);
  assert.match(auth, /if \(!appLoaded\)[\s\S]*script\.src = new URL\("app\.js"/);
  assert.match(auth, /if \(!configured\)[\s\S]*submit\.disabled = true/);
});

test("local preview is local-only and Supabase config contains only a public publishable key", () => {
  assert.match(auth, /location\.protocol === "file:" \|\| \["localhost", "127\.0\.0\.1"\]\.includes\(location\.hostname\)/);
  assert.match(auth, /config\.allowLocalPreview && localHost/);
  assert.match(authConfig, /supabaseUrl: "https:\/\/mncgzswnxxutrwychavf\.supabase\.co"/);
  assert.match(authConfig, /supabasePublishableKey: "sb_publishable_/);
  assert.match(authConfig, /enableAccountCreation: true/);
  assert.doesNotMatch(authConfig, /sb_secret_|service_role/i);
  assert.match(authConfig, /allowLocalPreview: true/);
  assert.match(html, /id="auth-mode-toggle" type="button">Create an account/);
  assert.match(auth, /toggle\.addEventListener\("click", \(\) => setMode\(mode === "signin" \? "signup" : "signin"\)\)/);
  assert.match(auth, /Account creation is not connected yet/);
  assert.doesNotMatch(auth, /if \(next === "signup" && !signupEnabled\) return/);
});

test("static buttons are connected to navigation, a delegated action, or a form/dialog", () => {
  const buttons = [...html.matchAll(/<button\b([^>]*)>/g)].map(match => match[1]);
  assert.ok(buttons.length > 20, `expected a substantial interface, found ${buttons.length} buttons`);
  const delegated = /data-(?:view|go|category|save|detail|project|set|subject|auth-action|project-done)|class="[^"]*(?:modal-close|notice-close)[^"]*"/;
  const code = `${app}\n${auth}`;
  const unhandled = buttons.filter(attrs => {
    if (delegated.test(attrs)) return false;
    if (/type="submit"/.test(attrs) || /formmethod="dialog"/.test(attrs)) return false;
    const id = attrs.match(/\bid="([^"]+)"/);
    if (!id) return true;
    return !code.includes(`#${id[1]}`) && !code.includes(`"${id[1]}"`) && !code.includes(`'${id[1]}'`);
  });
  assert.deepEqual(unhandled, [], `unwired static buttons: ${unhandled.join(" | ")}`);
});

test("required user inputs, privacy links, and source discovery are present", () => {
  for (const id of ["auth-email", "auth-password", "auth-consent", "auth-recover", "search-input", "notes-input", "file-input", "skill-select"]) {
    assert.match(html, new RegExp(`id="${id}"`), `${id} missing`);
  }
  assert.match(html, /href="privacy\.html"/);
  assert.match(html, /href="terms\.html"/);
  for (const host of ["indeed.com", "linkedin.com", "volunteermatch.org", "americorps.gov"]) {
    assert.ok(html.includes(host), `${host} source link missing`);
  }
  assert.match(html, /We don't copy or scrape their posts/);
});

test("account creation returns to sign-in and sends email confirmation to the current site", () => {
  assert.match(auth, /const redirectTo = `\$\{location\.origin\}\$\{location\.pathname\}`/);
  assert.match(auth, /authRequest\(`\/signup\?redirect_to=\$\{encodeURIComponent\(redirectTo\)\}`/);
  assert.match(auth, /setMode\("signin"\);[\s\S]*?Your account is created\. Sign in with your new email and password/);
  assert.match(auth, /Check your inbox to confirm your email, then sign in/);
  assert.match(auth, /Please confirm your email from the message we sent, then sign in again/);
});

test("opportunity filters cover all target categories and the SAT section states its independent status", () => {
  for (const category of ["research", "volunteering", "internship", "competition", "club", "project"]) {
    assert.ok(app.includes(`category:"${category}"`), `${category} category missing`);
  }
  assert.match(html, /Independent SAT-aligned practice · not official College Board content/);
  assert.match(html, /satsuite\.collegeboard\.org\/practice/);
});

test("SAT practice offers a varied, original question set in both sections", () => {
  const rwIds = [...app.matchAll(/id:"(rw\d+)"/g)].map(match => match[1]);
  const mathIds = [...app.matchAll(/id:"(m\d+)"/g)].map(match => match[1]);
  assert.equal(rwIds.length, 12, "expected 12 original Reading and Writing questions");
  assert.equal(mathIds.length, 12, "expected 12 original Math questions");
  assert.equal(new Set(rwIds).size, rwIds.length, "Reading and Writing question IDs must be unique");
  assert.equal(new Set(mathIds).size, mathIds.length, "Math question IDs must be unique");
  for (const skill of ["Command of Evidence", "Inferences", "Text Structure and Purpose", "Cross-Text Connections", "Rhetorical Synthesis", "Boundaries", "Form, Structure, and Sense", "Advanced Math"]) {
    assert.ok(app.includes(`skill:"${skill}"`), `${skill} practice missing`);
  }
});

test("Vercel and local server security headers allow only the auth provider connection needed", async () => {
  const vercel = JSON.parse(await readFile(new URL("./vercel.json", import.meta.url), "utf8"));
  assert.equal(vercel.framework, null, "static app must not use Vercel's auto-detected Node preset");
  assert.equal(vercel.buildCommand, null, "static app must skip the inferred function build");
  assert.equal(vercel.outputDirectory, ".", "serve the site files from the project root");
  const headers = vercel.headers[0].headers;
  assert.ok(headers.some(header => header.key === "X-Content-Type-Options" && header.value === "nosniff"));
  const csp = headers.find(header => header.key === "Content-Security-Policy")?.value || "";
  assert.match(csp, /connect-src 'self' https:\/\/\*\.supabase\.co/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
