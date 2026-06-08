"use client";

import { useEffect, useMemo, useState } from "react";

const ENDPOINTS: { id: string; label: string }[] = [
  { id: "stats", label: "Stats" },
  { id: "streak", label: "Streak" },
  { id: "contributions", label: "Contributions" },
  { id: "activity", label: "Activity" },
];

export default function Home() {
  const [theme, setTheme] = useState("dark");
  const [accent, setAccent] = useState("#e3b341");
  const [compact, setCompact] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (theme !== "dark") p.set("theme", theme);
    if (accent && accent.toLowerCase() !== "#e3b341")
      p.set("accent", accent.replace("#", ""));
    if (compact) p.set("compact", "true");
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [theme, accent, compact]);

  return (
    <main style={S.main}>
      <header style={S.header}>
        <div style={S.brandRow}>
          <span style={{ ...S.dot, background: accent }} />
          <h1 style={S.h1}>Obsidian</h1>
          <span style={S.badge}>GitHub Analytics</span>
        </div>
        <p style={S.tagline}>
          Self-hosted, premium SVG cards for your GitHub profile README.
          Configure once, embed anywhere.
        </p>
      </header>

      <section style={S.controls}>
        <label style={S.control}>
          <span style={S.controlLabel}>THEME</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={S.select}
          >
            <option value="dark">dark</option>
            <option value="light">light</option>
          </select>
        </label>

        <label style={S.control}>
          <span style={S.controlLabel}>ACCENT</span>
          <span style={S.colorWrap}>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              style={S.color}
            />
            <input
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              style={S.hexInput}
              spellCheck={false}
            />
          </span>
        </label>

        <label style={{ ...S.control, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={compact}
            onChange={(e) => setCompact(e.target.checked)}
          />
          <span style={S.controlLabel}>COMPACT</span>
        </label>
      </section>

      <section style={S.grid}>
        {ENDPOINTS.map((ep) => {
          const path = `/api/${ep.id}${query}`;
          const md = `![${ep.label}](${origin || "https://YOUR-APP.vercel.app"}${path})`;
          return (
            <article key={ep.id} style={S.card}>
              <div style={S.cardHead}>
                <h2 style={S.cardTitle}>{ep.label}</h2>
                <code style={S.endpoint}>/api/{ep.id}</code>
              </div>
              <div style={S.preview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={path} alt={`${ep.label} card`} style={S.img} />
              </div>
              <CopyField text={md} />
            </article>
          );
        })}
      </section>

      <footer style={S.footer}>
        <p>
          Set <code style={S.inlineCode}>GITHUB_TOKEN</code> and{" "}
          <code style={S.inlineCode}>GITHUB_USERNAME</code> in your environment.
          See <code style={S.inlineCode}>.env.example</code> and the README for
          deployment.
        </p>
      </footer>
    </main>
  );
}

function CopyField({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={S.copyRow}>
      <code style={S.copyText}>{text}</code>
      <button
        style={S.copyBtn}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            /* clipboard unavailable */
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "56px 24px 80px",
  },
  header: { marginBottom: 32 },
  brandRow: { display: "flex", alignItems: "center", gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 99, boxShadow: "0 0 16px var(--accent)" },
  h1: { margin: 0, fontSize: 30, letterSpacing: "-0.01em", fontWeight: 800 },
  badge: {
    fontSize: 11,
    letterSpacing: "0.14em",
    color: "var(--muted)",
    border: "1px solid var(--line)",
    borderRadius: 99,
    padding: "4px 10px",
    textTransform: "uppercase",
  },
  tagline: { color: "var(--muted)", marginTop: 12, maxWidth: 560, lineHeight: 1.6 },
  controls: {
    display: "flex",
    gap: 24,
    alignItems: "flex-end",
    flexWrap: "wrap",
    padding: "18px 20px",
    border: "1px solid var(--line)",
    borderRadius: 14,
    background: "var(--panel)",
    marginBottom: 28,
  },
  control: { display: "flex", flexDirection: "column", gap: 8 },
  controlLabel: { fontSize: 10.5, letterSpacing: "0.12em", color: "var(--muted)", fontWeight: 600 },
  select: {
    background: "var(--bg)",
    color: "var(--text)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 14,
  },
  colorWrap: { display: "flex", gap: 8, alignItems: "center" },
  color: { width: 36, height: 36, border: "1px solid var(--line)", borderRadius: 8, background: "transparent", padding: 2 },
  hexInput: {
    background: "var(--bg)",
    color: "var(--text)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "8px 10px",
    width: 100,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 13,
  },
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: 20 },
  card: {
    border: "1px solid var(--line)",
    borderRadius: 16,
    background: "var(--panel)",
    padding: 18,
  },
  cardHead: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 700 },
  endpoint: { color: "var(--muted)", fontSize: 12, fontFamily: "ui-monospace, monospace" },
  preview: {
    display: "flex",
    justifyContent: "center",
    padding: "10px 0 16px",
    overflowX: "auto",
  },
  img: { maxWidth: "100%" },
  copyRow: { display: "flex", gap: 8, alignItems: "stretch" },
  copyText: {
    flex: 1,
    overflowX: "auto",
    whiteSpace: "nowrap",
    background: "var(--bg)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 12.5,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    color: "var(--muted)",
  },
  copyBtn: {
    background: "var(--accent)",
    color: "#0b0e14",
    border: "none",
    borderRadius: 8,
    padding: "0 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  footer: { marginTop: 40, color: "var(--muted)", fontSize: 13, lineHeight: 1.7 },
  inlineCode: {
    fontFamily: "ui-monospace, monospace",
    background: "var(--bg)",
    border: "1px solid var(--line)",
    borderRadius: 6,
    padding: "2px 6px",
    fontSize: 12,
  },
};
