import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildSatBank } from "./sat-bank.mjs";

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
  assert.match(html, /id="auth-loading"[^>]*role="status"/);
  assert.match(html, /id="app-shell" hidden/);
  assert.match(html, /id="mobile-nav"[^>]*hidden/);
  assert.doesNotMatch(html, /<script[^>]+src="app\.js"/);
  assert.match(auth, /if \(!appLoaded\)[\s\S]*script\.src = new URL\("app\.js"/);
  assert.match(auth, /currentSession\(\)\.then\(user =>/);
  assert.doesNotMatch(auth, /^\s*showScreen\(\);\s*currentSession\(\)/m, "auth screen must stay hidden while a returning session is checked");
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
  const delegated = /data-(?:view|go|category|cost|credential|save|detail|project|set|subject|auth-action|project-done)|class="[^"]*(?:modal-close|notice-close)[^"]*"/;
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

test("opportunity directory includes paid and free paths with cost and aid details", () => {
  assert.match(html, /data-cost="free"/);
  assert.match(html, /data-cost="paid"/);
  assert.match(html, /data-cost="varies"/);
  assert.match(app, /function costType\(item\)/);
  assert.match(app, /matchesCost=state\.cost==="all"\|\|costType\(item\)===state\.cost/);
  assert.match(app, /Financial aid \/ extra costs/);
  for (const id of ["questbridge-cps", "rsi", "simr", "yygs", "tass", "ssp", "mit-primes", "promys", "ross", "bank-america-leaders", "key-club", "ysa", "regeneron-sts"]) {
    assert.ok(app.includes(`id:"${id}"`), `${id} source listing missing`);
  }
  const ids = [...app.matchAll(/\{id:"([a-z0-9-]+)",title:/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, "listing IDs must be unique for save and detail actions");
});

test("SAT practice offers a varied, original question set in both sections", () => {
  const bank = buildSatBank();
  const rwIds = bank.rw.map(question => question.id);
  const mathIds = bank.math.map(question => question.id);
  assert.equal(rwIds.length, 500, "expected 500 original Reading and Writing questions");
  assert.equal(mathIds.length, 500, "expected 500 original Math questions");
  assert.equal(new Set(rwIds).size, rwIds.length, "Reading and Writing question IDs must be unique");
  assert.equal(new Set(mathIds).size, mathIds.length, "Math question IDs must be unique");
  for (const section of [bank.rw, bank.math]) {
    assert.equal(new Set(section.map(question => `${question.passage}|${question.prompt}`)).size, section.length, "question content must vary");
    for (const question of section) {
      assert.equal(question.options.length, 4, `${question.id} must have four choices`);
      assert.equal(new Set(question.options).size, 4, `${question.id} choices must be distinct`);
      assert.ok(question.answer >= 0 && question.answer < question.options.length, `${question.id} answer index must be valid`);
      assert.ok(question.explanation.length > 15, `${question.id} needs an explanation`);
    }
  }
  for (const skill of ["Words in Context", "Central Ideas and Details", "Command of Evidence", "Inferences", "Text Structure and Purpose", "Cross-Text Connections", "Transitions", "Rhetorical Synthesis", "Boundaries", "Form, Structure, and Sense"]) {
    assert.ok(bank.rw.some(question => question.skill === skill), `${skill} practice missing`);
  }
  for (const skill of ["Algebra", "Advanced Math", "Problem-Solving and Data Analysis", "Geometry and Trigonometry"]) {
    assert.ok(bank.math.some(question => question.skill === skill), `${skill} practice missing`);
  }
  assert.match(auth, /import\(new URL\("sat-bank\.mjs", location\.href\)\.href\)/, "bank must load before app initialization");
  assert.match(app, /window\.LAUNCHPAD_SAT_QUESTIONS/);
});

test("opportunity detail, quick quiz, and SAT scoring controls have observable outcomes", () => {
  assert.match(app, /function showDetail\(id\)[\s\S]*\$\("#detail-modal"\)\.showModal\(\)/);
  assert.match(app, /if\(detail\)\{showDetail\(detail\.dataset\.detail\);return\}/);
  assert.match(app, /if\(e\.target\.closest\("#check-study-answer"\)\)[\s\S]*feedback\.textContent=.*That's it/);
  assert.match(app, /if\(e\.target\.closest\("#sat-action"\)\)[\s\S]*state\.satChecked=true/);
  assert.match(app, /state\.satSelection===q\.answer\?`Nice work\./);
});

test("profile, feedback, opportunity rotation, research, credentials, and document import are wired", async () => {
  for (const id of ["home-date", "welcome-name", "opportunity-nav-count", "hs-only-toggle", "shuffle-opportunities", "shuffle-projects", "settings-name", "theme-toggle", "retake-interests", "interest-modal", "save-interests", "view-research", "research-grid", "view-credentials", "credential-grid", "credential-search", "global-contact"]) {
    assert.ok(html.includes(`id="${id}"`) || html.includes(id), `${id} missing from the page`);
  }
  assert.ok(html.includes("mailto:Bcharan.van@gmail.com?subject=Open%20Spark%20feedback"));
  const importAccept = html.match(/id="file-input"[^>]*accept="([^"]+)"/)?.[1] || "";
  for (const extension of [".pdf", ".docx", ".pptx", ".xlsx", ".epub", ".odt"]) assert.ok(importAccept.includes(extension), `${extension} import filter missing`);
  for (const format of ["docx", "pptx", "xlsx", "epub", "odt", "pdf", "rtf"]) assert.ok(app.includes(`"${format}"`), `${format} extraction path missing`);
  assert.match(app, /function updateHomeDate\(\)/);
  assert.match(app, /\$\$\("\[data-interest\]"\)\.forEach/, "profile initialization must use the multi-element selector for interest checkboxes");
  assert.match(app, /setInterval\(updateHomeDate/);
  assert.match(app, /item\.category!=="internship"\|\|!hsOnly\|\|item\.highSchoolOnly===true/);
  assert.match(css, /data-theme="dark"/);
  assert.match(app, /function renderResearch\(\)/);
  assert.match(app, /function renderCredentials\(\)/);
  assert.match(app, /function extractStudyFile\(file\)/);
  assert.match(app, /function extractPdfTextWithPdfJs\(file\)/);
  assert.match(app, /pdfjs\.getDocument\(/);
  assert.match(app, /function buildStudyItems\(raw\)/);
  assert.match(app, /history\.pushState\(\{view\}/);
  assert.match(app, /const requestedView=location\.hash\.slice\(1\)/);
  assert.match(app, /window\.addEventListener\("launchpad:ready"[\s\S]*setView\(view,\{navigate:false,scroll:false\}\)/);
  assert.match(css, /auth-arrive/);
  assert.match(css, /sidebar \.nav-item:hover/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  for (const path of ["./vendor/pdfjs/pdf.min.mjs", "./vendor/pdfjs/pdf.worker.min.mjs", "./vendor/pdfjs/LICENSE"]) {
    await readFile(new URL(path, import.meta.url));
  }
});

test("Vercel and local server security headers allow only the auth provider connection needed", async () => {
  const vercel = JSON.parse(await readFile(new URL("./vercel.json", import.meta.url), "utf8"));
  assert.equal(vercel.framework, null, "static app must not use Vercel's auto-detected Node preset");
  assert.equal(vercel.buildCommand, null, "static app must skip the inferred function build");
  assert.equal(vercel.outputDirectory, ".", "serve the site files from the project root");
  const headers = vercel.headers[0].headers;
  assert.ok(headers.some(header => header.key === "X-Content-Type-Options" && header.value === "nosniff"));
  assert.ok(headers.some(header => header.key === "Cache-Control" && header.value === "no-cache, must-revalidate"), "static app changes should be revalidated after deployment");
  const csp = headers.find(header => header.key === "Content-Security-Policy")?.value || "";
  assert.match(csp, /connect-src 'self' https:\/\/\*\.supabase\.co/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
