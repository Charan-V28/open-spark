import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
const auth = await readFile(new URL("./auth.js", import.meta.url), "utf8");
const authConfig = await readFile(new URL("./auth-config.js", import.meta.url), "utf8");
const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

test("protected app starts hidden and authentication loads app code after sign-in", () => {
  assert.match(html, /id="app-shell" hidden/);
  assert.match(html, /id="mobile-nav"[^>]*hidden/);
  assert.doesNotMatch(html, /<script[^>]+src="app\.js"/);
  assert.match(auth, /if \(!appLoaded\)[\s\S]*script\.src = new URL\("app\.js"/);
  assert.match(auth, /if \(!configured\)[\s\S]*submit\.disabled = true/);
});

test("local preview is limited to local browser origins and the configuration contains no credentials", () => {
  assert.match(auth, /location\.protocol === "file:" \|\| \["localhost", "127\.0\.0\.1"\]\.includes\(location\.hostname\)/);
  assert.match(auth, /config\.allowLocalPreview && localHost/);
  assert.match(authConfig, /supabaseUrl: ""/);
  assert.match(authConfig, /supabasePublishableKey: ""/);
  assert.match(authConfig, /enableAccountCreation: false/);
  assert.match(auth, /toggle\.hidden = !signupEnabled/);
  assert.match(authConfig, /supabaseUrl: ""/);
  assert.match(authConfig, /supabasePublishableKey: ""/);
  assert.doesNotMatch(authConfig, /supabase(?:Url|PublishableKey):\s*"https?:/i);
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

test("opportunity filters cover all target categories and the SAT section states its independent status", () => {
  for (const category of ["research", "volunteering", "internship", "competition", "club", "project"]) {
    assert.ok(app.includes(`category:"${category}"`), `${category} category missing`);
  }
  assert.match(html, /Independent SAT-aligned practice · not official College Board content/);
  assert.match(html, /satsuite\.collegeboard\.org\/practice/);
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
