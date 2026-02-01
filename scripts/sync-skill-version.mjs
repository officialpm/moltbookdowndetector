import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkgPath = path.join(root, "package.json");
const skillPath = path.join(root, "public", "skill.md");

function fail(msg) {
  console.error(`[sync-skill-version] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(pkgPath)) fail(`Missing ${pkgPath}`);
if (!fs.existsSync(skillPath)) fail(`Missing ${skillPath}`);

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const version = pkg?.version;
if (typeof version !== "string" || !version.trim()) {
  fail("package.json has no valid version");
}

const raw = fs.readFileSync(skillPath, "utf8");

// Expect YAML frontmatter starting at the top of the file.
if (!raw.startsWith("---\n")) {
  fail("public/skill.md does not start with YAML frontmatter (---)");
}

const endIdx = raw.indexOf("\n---\n", 4);
if (endIdx === -1) {
  fail("public/skill.md frontmatter is missing closing ---");
}

const frontmatter = raw.slice(4, endIdx + 1); // include trailing newline
const rest = raw.slice(endIdx + 5); // skip "\n---\n"

const lines = frontmatter.split("\n");
let changed = false;
const outLines = lines.map((line) => {
  if (!line.startsWith("version:")) return line;
  const next = `version: ${version}`;
  if (line !== next) changed = true;
  return next;
});

if (!outLines.some((l) => l.startsWith("version:"))) {
  fail("public/skill.md frontmatter is missing a version: field");
}

if (!changed) {
  console.log(`[sync-skill-version] OK (already ${version})`);
  process.exit(0);
}

const updated = `---\n${outLines.join("\n")}\n---\n${rest}`;
fs.writeFileSync(skillPath, updated, "utf8");
console.log(`[sync-skill-version] Updated public/skill.md version -> ${version}`);
