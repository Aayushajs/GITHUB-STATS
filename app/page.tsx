"use client";

import { useEffect, useMemo, useState } from "react";

const ENDPOINTS: { id: string; label: string }[] = [
  { id: "stats", label: "Stats" },
  { id: "streak", label: "Streak" },
  { id: "contributions", label: "Contributions" },
  { id: "activity", label: "Activity" },
];

type Health = "checking" | "live" | "setup";

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [accent, setAccent] = useState("#e3b341");
  const [compact, setCompact] = useState(false);
  const [origin, setOrigin] = useState("");
  const [health, setHealth] = useState<Health>("checking");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealth(d?.ok ? "live" : "setup"))
      .catch(() => setHealth("setup"));
  }, []);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (theme !== "dark") p.set("theme", theme);
    if (accent && accent.toLowerCase() !== "#e3b341")
      p.set("accent", accent.replace("#", ""));
    if (compact) p.set("compact", "true");
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [theme, accent, compact]);

  const statusText =
    health === "checking" ? "Connecting" : health === "live" ? "Live" : "Awaiting env";

  return (
    <div className="ob-shell">
      <div className="ob-topbar">
        <span>
          <b>Obsidian</b>
        </span>
        <span>GitHub Analytics</span>
        <span>Edition 01 — 2026</span>
      </div>
      <hr className="ob-rule" />

      <header className="ob-hero">
        <p className="ob-eyebrow">Self-hosted · Rendered on the edge</p>
        <h1 className="ob-wordmark">
          Obsidian<span className="dot">.</span>
        </h1>
        <p className="ob-standfirst">
          Premium SVG cards for your GitHub profile README — rendered server-side,
          powered by <em>your</em> token. No third party, no tracking.
        </p>
        <ul className="ob-spec">
          <li>GraphQL</li>
          <li>Edge runtime</li>
          <li>Vercel-native</li>
          <li>Free</li>
          <li>
            <span
              className="ob-status"
              data-state={health === "setup" ? "setup" : "live"}
            >
              <span className="pip" />
              {statusText}
            </span>
          </li>
        </ul>
      </header>

      <section className="ob-controls" aria-label="Card options">
        <div className="ob-control">
          <span className="k">Theme</span>
          <div className="ob-seg" role="group" aria-label="Theme">
            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
          </div>
        </div>

        <div className="ob-control">
          <span className="k">Accent</span>
          <span className="ob-color">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              aria-label="Accent colour"
            />
            <input
              className="ob-hex"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              spellCheck={false}
              aria-label="Accent hex"
            />
          </span>
        </div>

        <div className="ob-control">
          <span className="k">Compact</span>
          <label className="ob-toggle">
            <input
              type="checkbox"
              checked={compact}
              onChange={(e) => setCompact(e.target.checked)}
              aria-label="Compact mode"
            />
            <span className="track" />
            <span className="thumb" />
          </label>
        </div>
      </section>

      <ol className="ob-cards">
        {ENDPOINTS.map((ep, i) => {
          const path = `/api/${ep.id}${query}${query ? "&" : "?"}mock=true`;
          const md = `![${ep.label}](${origin || "https://YOUR-APP.vercel.app"}${path})`;
          return (
            <li className="ob-card" key={ep.id}>
              <div className="ob-card-meta">
                <div className="ob-card-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="ob-card-head">
                  <h2 className="ob-card-title">{ep.label}</h2>
                  <span className="ob-card-endpoint">
                    <span className="slash">/</span>api
                    <span className="slash">/</span>
                    {ep.id}
                  </span>
                </div>
                <Snippet text={md} />
              </div>
              <div className="ob-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={path} alt={`${ep.label} card preview`} />
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="ob-colophon">
        <div>
          <h3>Setup</h3>
          <p>
            Set <code>GITHUB_TOKEN</code> and <code>GITHUB_USERNAME</code> in
            your environment — locally in <code>.env.local</code>, or in Vercel
            project settings.
          </p>
        </div>
        <div>
          <h3>Token scopes</h3>
          <p>
            <code>read:user</code> · <code>repo</code> · <code>read:org</code>
          </p>
        </div>
        <div>
          <h3>Colophon</h3>
          <p className="ob-sign">
            Set in Fraunces &amp; IBM&nbsp;Plex&nbsp;Mono.
            <br />
            Rendered on the edge.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Snippet({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="ob-snippet">
      <code>{text}</code>
      <button
        className="ob-copy"
        data-copied={copied}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1300);
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
