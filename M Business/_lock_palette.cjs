const fs = require("fs");
const path = require("path");

const ROOTS = [
  path.join(__dirname, "src"),
  path.join(__dirname, "public", "template-designer.html"),
  path.join(__dirname, "index.html"),
];

const ALLOWED = [
  ["#0F172A", [15, 23, 42]],
  ["#2563EB", [37, 99, 235]],
  ["#EFF6FF", [239, 246, 255]],
  ["#F8FAFC", [248, 250, 252]],
  ["#FFFFFF", [255, 255, 255]],
  ["#1E293B", [30, 41, 59]],
  ["#64748B", [100, 116, 139]],
  ["#E2E8F0", [226, 232, 240]],
  ["#16A34A", [22, 163, 74]],
];

const ALLOWED_SET = new Set(ALLOWED.map(([h]) => h.toUpperCase()));

function nearestHex(r, g, b) {
  let best = ALLOWED[0][0];
  let bestD = Infinity;
  for (const [hex, rgb] of ALLOWED) {
    const d =
      (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = hex;
    }
  }
  return best;
}

function nearestRgb(r, g, b) {
  const hex = nearestHex(r, g, b);
  return ALLOWED.find(([h]) => h === hex)[1];
}

function parseHex(raw) {
  let h = raw.slice(1);
  if (h.length === 3 || h.length === 4) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? h.slice(6, 8) : null;
  return { r, g, b, a };
}

function remapHex(match) {
  const { r, g, b, a } = parseHex(match);
  // Keep true black shadows? Plan: #000 → #0F172A for solid fills
  const next = nearestHex(r, g, b);
  if (a) return next + a.toUpperCase();
  return next;
}

function walk(file, acc) {
  const st = fs.statSync(file);
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(file)) {
      if (name === "node_modules" || name === ".git") continue;
      walk(path.join(file, name), acc);
    }
    return;
  }
  if (/\.(jsx?|css|html|js)$/i.test(file)) acc.push(file);
}

const files = [];
for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  const st = fs.statSync(root);
  if (st.isDirectory()) walk(root, files);
  else files.push(root);
}

const VAR_REPLACEMENTS = [
  [/var\(--red-bg\)/g, "var(--app-accent-light)"],
  [/var\(--red-dark\)/g, "var(--app-text)"],
  [/var\(--red-light\)/g, "var(--app-accent-light)"],
  [/var\(--red-rgb\)/g, "30, 41, 59"],
  [/var\(--amber-bg\)/g, "var(--app-accent-light)"],
  [/var\(--purple-bg\)/g, "var(--app-accent-light)"],
  [/var\(--purple-light\)/g, "var(--app-accent-light)"],
  [/var\(--green-bg\)/g, "var(--app-accent-light)"],
  [/var\(--orange-light\)/g, "var(--app-accent-light)"],
  [/var\(--orange-dark\)/g, "var(--app-muted)"],
  [/var\(--orange\)/g, "var(--app-muted)"],
  [/var\(--amber\)/g, "var(--app-muted)"],
  [/var\(--purple\)/g, "var(--app-accent)"],
  [/var\(--red\)/g, "var(--app-text)"],
  [/var\(--teal3\)/g, "var(--app-accent)"],
  [/var\(--teal4\)/g, "var(--app-primary)"],
];

let changedFiles = 0;
for (const file of files) {
  const orig = fs.readFileSync(file, "utf8");
  let next = orig;

  next = next.replace(/#([0-9a-fA-F]{3,8})\b/g, (m) => remapHex(m));

  next = next.replace(
    /\brgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([^)]+))?\)/g,
    (m, r, g, b, a) => {
      r = Number(r);
      g = Number(g);
      b = Number(b);
      // keep black/white opacity (shadows / overlays)
      if (r === 0 && g === 0 && b === 0) return m;
      if (r === 255 && g === 255 && b === 255) return m;
      const [nr, ng, nb] = nearestRgb(r, g, b);
      if (a !== undefined && a !== null) return `rgba(${nr}, ${ng}, ${nb}, ${a.trim()})`;
      return `rgb(${nr}, ${ng}, ${nb})`;
    }
  );

  for (const [re, val] of VAR_REPLACEMENTS) {
    next = next.replace(re, val);
  }

  if (next !== orig) {
    fs.writeFileSync(file, next, "utf8");
    changedFiles++;
  }
}

console.log(`Updated ${changedFiles} files of ${files.length}`);
