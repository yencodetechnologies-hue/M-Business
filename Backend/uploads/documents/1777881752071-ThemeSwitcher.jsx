import { useState, useEffect, useRef } from "react";

// ── 8 preset themes ──────────────────────────────────────────
const THEMES = [
  { id: "purple", label: "Purple", a: "#9333ea", b: "#7c3aed" },
  { id: "ocean", label: "Ocean", a: "#0284c7", b: "#0369a1" },
  { id: "forest", label: "Forest", a: "#16a34a", b: "#15803d" },
  { id: "sunset", label: "Sunset", a: "#ea580c", b: "#c2410c" },
  { id: "rose", label: "Rose", a: "#e11d48", b: "#be123c" },
  { id: "slate", label: "Slate", a: "#475569", b: "#334155" },
  { id: "mint", label: "Mint", a: "#0d9488", b: "#0f766e" },
  { id: "candy", label: "Candy", a: "#c026d3", b: "#a21caf" },
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function darken(hex, ratio = 0.15) {
  const { r, g, b } = hexToRgb(hex);
  const d = (v) => Math.max(0, Math.round(v * (1 - ratio)));
  return `#${[d(r), d(g), d(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function lighten(hex, ratio = 0.92) {
  const { r, g, b } = hexToRgb(hex);
  const l = (v) => Math.min(255, Math.round(v + (255 - v) * ratio));
  return `#${[l(r), l(g), l(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState("purple");
  const [isDark, setIsDark] = useState(false);
  const [customColor, setCustomColor] = useState("#9333ea");
  const [isCustom, setIsCustom] = useState(false);
  const panelRef = useRef();

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("app-theme");
    const savedDark = localStorage.getItem("app-dark") === "true";
    const savedCustom = localStorage.getItem("app-custom-color");
    if (savedDark) setIsDark(true);
    if (savedCustom && saved === "custom") {
      setIsCustom(true);
      setCustomColor(savedCustom);
      applyCustomColor(savedCustom, savedDark);
    } else if (saved) {
      setActiveTheme(saved);
      applyTheme(saved, savedDark);
    }
  }, []);

  // Closepanel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applyTheme = (themeId, dark = isDark) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", themeId);
    root.setAttribute("data-dark", dark ? "true" : "false");
    localStorage.setItem("app-theme", themeId);
    localStorage.setItem("app-dark", String(dark));
    setActiveTheme(themeId);
    setIsCustom(false);
  };

  const applyCustomColor = (hex, dark = isDark) => {
    const root = document.documentElement;
    const accent2 = darken(hex, 0.15);
    const bg = lighten(hex, 0.94);
    const sidebar = darken(hex, 0.45);
    const border = lighten(hex, 0.6);
    root.style.setProperty("--app-accent", hex);
    root.style.setProperty("--app-accent2", accent2);
    root.style.setProperty("--app-sidebar", sidebar);
    root.style.setProperty("--app-primary", sidebar);
    root.style.setProperty("--app-bg", dark ? "#0f0f1a" : bg);
    root.style.setProperty("--app-card", dark ? "#1a1a2e" : "#ffffff");
    root.style.setProperty("--app-text", dark ? "#e2e8f0" : sidebar);
    root.style.setProperty("--app-muted", dark ? "#94a3b8" : "#6b7280");
    root.style.setProperty("--app-border", dark ? "#2d2d4e" : border);
    root.style.setProperty("--app-accent-gradient", `linear-gradient(135deg, ${hex}, ${accent2})`);
    root.setAttribute("data-theme", "custom");
    root.setAttribute("data-dark", dark ? "true" : "false");
    localStorage.setItem("app-theme", "custom");
    localStorage.setItem("app-custom-color", hex);
    localStorage.setItem("app-dark", String(dark));
  };

  const handleThemeClick = (themeId) => {
    const root = document.documentElement;
    ["--app-accent", "--app-accent2", "--app-sidebar", "--app-primary",
      "--app-bg", "--app-card", "--app-text", "--app-muted", "--app-border",
      "--app-accent-gradient"].forEach(v => root.style.removeProperty(v));
    applyTheme(themeId);
  };

  const handleCustomColor = (hex) => {
    setCustomColor(hex);
    setIsCustom(true);
    applyCustomColor(hex);
  };

  const handleDarkToggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (isCustom) applyCustomColor(customColor, newDark);
    else applyTheme(activeTheme, newDark);
  };

  return (
    <div ref={panelRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Change Theme"
        style={{
          background: "var(--app-accent-gradient, linear-gradient(135deg,#9333ea,#7c3aed))",
          border: "none", borderRadius: 10, padding: "8px 14px",
          color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "all 0.2s",
        }}
      >
        🎨 Theme
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          width: 260, background: "#fff", borderRadius: 14,
          border: "1px solid #ede9fe", boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
          zIndex: 9999, padding: 16, fontFamily: "inherit",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
            Choose Theme
          </div>

          {/* 8 Preset Swatches */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
            {THEMES.map(t => {
              const active = !isCustom && activeTheme === t.id;
              return (
                <button key={t.id} onClick={() => handleThemeClick(t.id)} title={t.label} style={{
                  border: active ? "2px solid #1e0a3c" : "2px solid transparent",
                  borderRadius: 10, padding: "8px 4px 6px", cursor: "pointer",
                  background: active ? "#f3e8ff" : "#f8f7ff",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  transition: "all 0.18s",
                  boxShadow: active ? "0 0 0 2px rgba(147,51,234,0.2)" : "none",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${t.a}, ${t.b})`,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#4b5563", letterSpacing: 0.3 }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ height: 1, background: "#f3f0ff", margin: "10px 0" }} />

          {/* Custom Color Picker */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
              Custom Color
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="color"
                value={customColor}
                onChange={e => handleCustomColor(e.target.value)}
                style={{
                  width: 44, height: 44,
                  border: isCustom ? "2px solid #1e0a3c" : "2px solid #ede9fe",
                  borderRadius: 10, cursor: "pointer", padding: 2, background: "none",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e0a3c" }}>
                  {isCustom ? "Custom active" : "Pick any color"}
                </div>
                <div style={{ fontSize: 10, color: "#a78bfa" }}>{customColor.toUpperCase()}</div>
              </div>
              {isCustom && (
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `linear-gradient(135deg, ${customColor}, ${darken(customColor, 0.2)})`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }} />
              )}
            </div>
          </div>

          <div style={{ height: 1, background: "#f3f0ff", margin: "10px 0" }} />

          {/* Dark Mode Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>
              {isDark ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </span>
            <button onClick={handleDarkToggle} style={{
              width: 44, height: 24, borderRadius: 12,
              background: isDark ? "var(--app-accent, #9333ea)" : "#d1d5db",
              border: "none", cursor: "pointer", position: "relative",
              transition: "background 0.3s", flexShrink: 0,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3, left: isDark ? 23 : 3,
                transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
