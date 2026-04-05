"use client";

import { useState, useEffect, useCallback, useContext, createContext, useMemo } from "react";

// ── Theme definitions ─────────────────────────────────────────────────────────
const THEME_DEFS = {
  bebop: {
    id: "bebop", name: "Bebop", label: "🚀",
    black: "#070608", dark1: "#0f0d0e", dark2: "#16110f",
    amber: "#d4891a", amberLt: "#e8a838",
    red: "#b5341e", redLt: "#cc4a2a",
    cream: "#e8d5b0", creamDim: "#c4ad86",
    warmGray: "#8c7a5e", dim: "#4a3e30",
    glowRgb: "212, 137, 26",
  },
  matrix: {
    id: "matrix", name: "Matrix", label: "💾",
    black: "#010c01", dark1: "#020f02", dark2: "#031503",
    amber: "#00cc44", amberLt: "#22ee66",
    red: "#008833", redLt: "#00aa44",
    cream: "#b8ffb8", creamDim: "#80dd80",
    warmGray: "#449944", dim: "#1a3a1a",
    glowRgb: "0, 204, 68",
  },
  ocean: {
    id: "ocean", name: "Ocean", label: "🌊",
    black: "#030810", dark1: "#060e1a", dark2: "#081420",
    amber: "#1a8acc", amberLt: "#3aaaea",
    red: "#1a5a8c", redLt: "#2272aa",
    cream: "#d8eef8", creamDim: "#a8cce8",
    warmGray: "#5888aa", dim: "#2a4a66",
    glowRgb: "26, 138, 204",
  },
  synthwave: {
    id: "synthwave", name: "Synthwave", label: "🌆",
    black: "#080514", dark1: "#0e0a1e", dark2: "#120e28",
    amber: "#cc44cc", amberLt: "#ee66ee",
    red: "#8833cc", redLt: "#aa44ee",
    cream: "#f0d8f8", creamDim: "#cca8e8",
    warmGray: "#8858aa", dim: "#443366",
    glowRgb: "204, 68, 204",
  },
  minimal: {
    id: "minimal", name: "Minimal", label: "◻",
    black: "#0a0a0a", dark1: "#111111", dark2: "#161616",
    amber: "#e0e0e0", amberLt: "#ffffff",
    red: "#888888", redLt: "#aaaaaa",
    cream: "#f8f8f8", creamDim: "#cccccc",
    warmGray: "#888888", dim: "#444444",
    glowRgb: "224, 224, 224",
  },
};

function buildTheme(def) {
  return {
    ...def,
    surface:  `rgba(${def.glowRgb}, 0.03)`,
    border:   `rgba(${def.glowRgb}, 0.10)`,
    borderMd: `rgba(${def.glowRgb}, 0.22)`,
  };
}

// ── Theme context ─────────────────────────────────────────────────────────────
const ThemeCtx = createContext(buildTheme(THEME_DEFS.bebop));
const useTheme = () => useContext(ThemeCtx);

// ── Niche color palette (for auto-assigning colors to new niches) ─────────────
const NICHE_COLORS = [
  "#4aa8cc", "#cc7a2e", "#b5341e", "#d4891a", "#6b9e4e",
  "#9e4a6a", "#5c8a4a", "#4a7aaa", "#8b5c7e", "#aa6a2e",
  "#cc4444", "#44aacc", "#cc8844", "#7744cc", "#44cc88",
];
function pickColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return NICHE_COLORS[Math.abs(h) % NICHE_COLORS.length];
}

// ── Default categories ────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: "sports-nhl",  name: "Hockey",     emoji: "🏒", color: "#4aa8cc", logo: null,
    feeds: ["https://www.nhl.com/rss/news"] },
  { id: "sports-nfl",  name: "Football",   emoji: "🏈", color: "#cc7a2e", logo: null,
    feeds: ["https://www.espn.com/espn/rss/nfl/news"] },
  { id: "geopolitics", name: "World News", emoji: "🌍", color: "#b5341e", logo: null,
    feeds: ["https://feeds.bbci.co.uk/news/world/rss.xml", "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"] },
  { id: "anime",       name: "Anime",      emoji: "🎌", color: "#d4891a", logo: null,
    feeds: ["https://www.animenewsnetwork.com/all/rss.xml"] },
  { id: "tech",        name: "Tech & AI",  emoji: "🤖", color: "#6b9e4e", logo: null,
    feeds: ["https://hnrss.org/frontpage"] },
];

const SUGGESTED_CATEGORIES = [
  { id: "gaming",  name: "Gaming",      emoji: "🎮", color: "#5c8a4a", logo: null, feeds: ["https://www.gamespot.com/feeds/mashup/"] },
  { id: "science", name: "Science",     emoji: "🔬", color: "#4a7aaa", logo: null, feeds: ["https://www.sciencedaily.com/rss/all.xml"] },
  { id: "space",   name: "Space",       emoji: "🚀", color: "#8b5c7e", logo: null, feeds: ["https://www.nasa.gov/rss/dyn/breaking_news.rss"] },
  { id: "movies",  name: "Movies & TV", emoji: "🎬", color: "#aa6a2e", logo: null, feeds: ["https://www.ign.com/articles.rss"] },
  { id: "music",   name: "Music",       emoji: "🎵", color: "#9e4a6a", logo: null, feeds: ["https://pitchfork.com/rss/news/"] },
  { id: "finance", name: "Finance",     emoji: "📈", color: "#4a8a6e", logo: null, feeds: ["https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114"] },
];

// ── Wikipedia logo fetcher ────────────────────────────────────────────────────
async function fetchWikiLogo(query) {
  try {
    const slug = encodeURIComponent(query.trim().replace(/ /g, "_"));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
      headers: { "Api-User-Agent": "NicheNews/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

// ── Google News RSS for any topic ─────────────────────────────────────────────
function googleNewsUrl(topic) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60)  return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60)        return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)        return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(dateString).toLocaleDateString();
}

// ── NicheIcon: image logo or emoji fallback ────────────────────────────────────
function NicheIcon({ category, size = 22, rounded = false }) {
  const [err, setErr] = useState(false);
  const style = {
    width: size, height: size,
    objectFit: "contain",
    borderRadius: rounded ? "50%" : 4,
    display: "block",
  };
  if (category?.logo && !err) {
    return (
      <img src={category.logo} alt={category.name} style={style}
        onError={() => setErr(true)} />
    );
  }
  return <span style={{ fontSize: size * 0.82, lineHeight: 1 }}>{category?.emoji || "📌"}</span>;
}

// ── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ article, category, index }) {
  const CB = useTheme();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const color = category?.color || CB.amber;

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="press-effect animate-fade-in block"
      style={{ animationDelay: `${index * 0.07}s`, textDecoration: "none", color: "inherit" }}
    >
      <article style={{
        borderRadius: 14, overflow: "hidden", marginBottom: 20,
        background: CB.surface, border: `1px solid ${CB.border}`,
        transition: "border-color 0.2s ease",
      }}>
        {/* Image */}
        {article.image && !imgError ? (
          <div style={{ position: "relative", height: 190, background: CB.dark2 }}>
            <img
              src={article.image} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                opacity: imgLoaded ? 1 : 0, transition: "opacity 0.5s ease" }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
            {!imgLoaded && <div className="skeleton" style={{ position: "absolute", inset: 0 }} />}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
              background: `linear-gradient(transparent, ${CB.dark2})`,
            }} />
          </div>
        ) : (
          <div style={{
            height: 60, display: "flex", alignItems: "center", justifyContent: "center",
            background: `${color}12`, borderBottom: `1px solid ${CB.border}`,
          }}>
            <NicheIcon category={category} size={32} />
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "14px 18px 18px" }}>
          {/* Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
              textTransform: "uppercase", color,
            }}>
              <NicheIcon category={category} size={14} />
              {category?.name}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: CB.dim }} />
            <span style={{ fontSize: 11, color: CB.warmGray, fontWeight: 500 }}>{article.source}</span>
            <span style={{ fontSize: 11, color: CB.dim, marginLeft: "auto" }}>{timeAgo(article.pubDate)}</span>
          </div>

          {/* Headline */}
          <h3 style={{
            fontSize: 16, fontWeight: 800, lineHeight: 1.3, color: CB.cream,
            marginBottom: 10, letterSpacing: "-0.01em",
          }}>
            {article.title}
          </h3>

          {/* Summary */}
          {article.summary && (
            <p style={{ fontSize: 13, lineHeight: 1.6, color: CB.warmGray, marginBottom: 12 }}>
              {article.summary}
            </p>
          )}

          {/* Pull quote */}
          {article.quotes?.length > 0 && article.quotes.map((quote, qi) => (
            <blockquote key={qi} style={{
              margin: "12px 0 0", paddingLeft: 14,
              borderLeft: `3px solid ${color}`,
              color: CB.creamDim, fontSize: 13, lineHeight: 1.65,
              fontStyle: "italic", letterSpacing: "0.005em",
            }}>
              &ldquo;{quote}&rdquo;
            </blockquote>
          ))}

          <div style={{
            marginTop: 14, display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", color: CB.warmGray,
          }}>
            Read full article <span style={{ fontSize: 12 }}>→</span>
          </div>
        </div>
      </article>
    </a>
  );
}

// ── Digest View ───────────────────────────────────────────────────────────────
function DigestView({ articlesByCategory, categories }) {
  const CB = useTheme();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const totalArticles = Object.values(articlesByCategory).reduce((s, a) => s + a.length, 0);

  return (
    <div style={{ padding: "0 20px 120px", position: "relative", zIndex: 10 }}>
      <div className="animate-fade-in" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: CB.cream, marginBottom: 4, letterSpacing: "-0.02em" }}>
          ☀️ Daily Digest
        </h2>
        <p style={{ fontSize: 13, color: CB.warmGray }}>{today} — {totalArticles} stories</p>
      </div>

      {Object.entries(articlesByCategory).map(([catId, arts]) => {
        const cat = categories.find((c) => c.id === catId);
        if (!cat || arts.length === 0) return null;
        return (
          <div key={catId} className="animate-fade-in" style={{
            borderRadius: 14, background: CB.surface,
            border: `1px solid ${CB.border}`, padding: "16px 18px", marginBottom: 16,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
              paddingBottom: 12, borderBottom: `1px solid ${cat.color}25`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${cat.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <NicheIcon category={cat} size={20} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: cat.color, letterSpacing: "-0.01em" }}>
                {cat.name}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: CB.warmGray, fontWeight: 600 }}>
                {arts.length} {arts.length === 1 ? "story" : "stories"}
              </span>
            </div>

            {arts.slice(0, 5).map((article, i) => (
              <a key={article.id} href={article.link} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "block", padding: "10px 0",
                  borderBottom: i < Math.min(arts.length, 5) - 1 ? `1px solid ${CB.border}` : "none",
                  textDecoration: "none", color: "inherit",
                }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: CB.cream, marginBottom: 3, lineHeight: 1.35 }}>
                  {article.title}
                </div>
                {article.quotes?.[0] && (
                  <p style={{
                    fontSize: 12, color: CB.warmGray, fontStyle: "italic",
                    marginBottom: 3, lineHeight: 1.5,
                    paddingLeft: 8, borderLeft: `2px solid ${cat.color}60`, marginTop: 5,
                  }}>
                    &ldquo;{article.quotes[0].slice(0, 140)}…&rdquo;
                  </p>
                )}
                <div style={{ fontSize: 11, color: CB.dim, marginTop: 4 }}>
                  {article.source} · {timeAgo(article.pubDate)}
                </div>
              </a>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Theme Picker ──────────────────────────────────────────────────────────────
function ThemePicker({ current, onChange }) {
  const CB = useTheme();
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 800, color: CB.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        App Theme
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {Object.values(THEME_DEFS).map((t) => {
          const isActive = current === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              title={t.name}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                background: isActive ? `${t.amber}18` : "rgba(255,255,255,0.03)",
                border: `2px solid ${isActive ? t.amber : "rgba(255,255,255,0.08)"}`,
                transition: "all 0.2s ease",
              }}
            >
              {/* Color swatch */}
              <div style={{ display: "flex", gap: 3 }}>
                {[t.amber, t.red, t.cream].map((c) => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? t.amber : "#888", whiteSpace: "nowrap" }}>
                {t.label} {t.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({ categories, suggested, onClose, onRemove, onAdd, themeName, onThemeChange }) {
  const CB = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching]     = useState(false);
  const [searchMsg, setSearchMsg]     = useState("");

  const inputStyle = {
    padding: "10px 14px", borderRadius: 10, fontSize: 13,
    background: "rgba(255,255,255,0.05)", border: `1px solid ${CB.border}`,
    color: CB.cream, outline: "none", width: "100%",
    boxSizing: "border-box",
  };

  async function handleAddBySearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchMsg("Searching…");

    // Auto-fetch Wikipedia logo
    const logo = await fetchWikiLogo(q);

    const niche = {
      id:    q.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      name:  q,
      emoji: "📌",
      color: pickColor(q),
      logo,
      feeds: [googleNewsUrl(q)],
      custom: true,
    };

    onAdd(niche);
    setSearchQuery("");
    setSearchMsg(logo ? `✓ Added "${q}" with logo` : `✓ Added "${q}"`);
    setSearching(false);
    setTimeout(() => setSearchMsg(""), 3000);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(7,6,8,0.85)",
        backdropFilter: "blur(12px)", zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          background: `linear-gradient(180deg, ${CB.dark2}, ${CB.dark1})`,
          borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480,
          maxHeight: "92vh", overflowY: "auto",
          padding: "24px 22px 48px",
          border: `1px solid ${CB.borderMd}`, borderBottom: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: CB.dim, margin: "0 auto 22px" }} />

        <h2 style={{ fontSize: 20, fontWeight: 900, color: CB.cream, marginBottom: 4, letterSpacing: "-0.02em" }}>
          Settings
        </h2>
        <p style={{ fontSize: 13, color: CB.warmGray, marginBottom: 28 }}>
          Customize your feed and appearance
        </p>

        {/* Theme picker */}
        <ThemePicker current={themeName} onChange={onThemeChange} />

        <div style={{ height: 1, background: CB.border, margin: "24px 0" }} />

        {/* Search & Add niche */}
        <p style={{ fontSize: 10, fontWeight: 800, color: CB.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Add a Niche
        </p>
        <p style={{ fontSize: 12, color: CB.warmGray, marginBottom: 12 }}>
          Type anything — a team, topic, person, or interest. We&apos;ll find the news and logo automatically.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="e.g. Buffalo Sabres, Formula 1, Taylor Swift…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddBySearch()}
          />
          <button
            onClick={handleAddBySearch}
            disabled={searching || !searchQuery.trim()}
            style={{
              padding: "10px 16px", borderRadius: 10, cursor: searching ? "default" : "pointer",
              background: `${CB.amber}22`, border: `1px solid ${CB.amber}44`,
              color: CB.amberLt, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
              opacity: searching || !searchQuery.trim() ? 0.5 : 1,
            }}
          >
            {searching ? "…" : "Add"}
          </button>
        </div>
        {searchMsg && (
          <p style={{ fontSize: 12, color: CB.amber, marginBottom: 8 }}>{searchMsg}</p>
        )}

        <div style={{ height: 1, background: CB.border, margin: "24px 0" }} />

        {/* Current niches */}
        <p style={{ fontSize: 10, fontWeight: 800, color: CB.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          Your Niches
        </p>
        {categories.map((cat) => (
          <div key={cat.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            borderRadius: 12, background: CB.surface, border: `1px solid ${CB.border}`, marginBottom: 8,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: `${cat.color}15`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <NicheIcon category={cat} size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: CB.cream }}>{cat.name}</div>
              {cat.custom && (
                <div style={{ fontSize: 10, color: CB.dim, marginTop: 1 }}>Custom niche</div>
              )}
            </div>
            <button
              onClick={() => onRemove(cat.id)}
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: "rgba(181,52,30,0.12)", border: "1px solid rgba(181,52,30,0.25)",
                color: CB.red, cursor: "pointer", fontSize: 18, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >×</button>
          </div>
        ))}

        {/* Suggested niches */}
        {suggested.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 800, color: CB.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "22px 0 12px" }}>
              Suggested
            </p>
            {suggested.map((cat) => (
              <div key={cat.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                borderRadius: 12, background: CB.surface, border: `1px solid ${CB.border}`, marginBottom: 8,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: `${cat.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <NicheIcon category={cat} size={22} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: CB.cream, flex: 1 }}>{cat.name}</span>
                <button
                  onClick={() => onAdd(cat)}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "rgba(107,158,78,0.12)", border: "1px solid rgba(107,158,78,0.25)",
                    color: "#6b9e4e", cursor: "pointer", fontSize: 20, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >+</button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const CB = useTheme();
  return (
    <div style={{ padding: "0 20px 120px" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ borderRadius: 14, overflow: "hidden", marginBottom: 20, border: `1px solid ${CB.border}` }}>
          <div className="skeleton" style={{ height: 190 }} />
          <div style={{ padding: "14px 18px 18px" }}>
            <div className="skeleton" style={{ height: 10, width: "30%", borderRadius: 6, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 16, width: "90%", borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 16, width: "70%", borderRadius: 6, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 13, width: "100%", borderRadius: 6, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 13, width: "80%", borderRadius: 6, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 40, borderRadius: 6, borderLeft: `3px solid ${CB.amber}30` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [themeName, setThemeName] = useState("bebop");
  const CB = useMemo(() => buildTheme(THEME_DEFS[themeName] || THEME_DEFS.bebop), [themeName]);

  const [categories, setCategories]         = useState(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState("all");
  const [articles, setArticles]             = useState({});
  const [loading, setLoading]               = useState(true);
  const [view, setView]                     = useState("feed");
  const [showSettings, setShowSettings]     = useState(false);

  // Persist to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nichenews-v3-categories");
      if (saved) setCategories(JSON.parse(saved));
      const savedTheme = localStorage.getItem("nichenews-v3-theme");
      if (savedTheme && THEME_DEFS[savedTheme]) setThemeName(savedTheme);
    } catch (_) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("nichenews-v3-categories", JSON.stringify(categories)); }
    catch (_) {}
  }, [categories]);

  useEffect(() => {
    try { localStorage.setItem("nichenews-v3-theme", themeName); }
    catch (_) {}
  }, [themeName]);

  // Auto-fetch Wikipedia logos for categories that don't have one
  useEffect(() => {
    const missing = categories.filter((c) => !c.logo);
    if (missing.length === 0) return;
    missing.forEach(async (cat) => {
      const logo = await fetchWikiLogo(cat.name);
      if (logo) {
        setCategories((prev) =>
          prev.map((c) => c.id === cat.id ? { ...c, logo } : c)
        );
      }
    });
  }, []); // only on mount

  // Fetch feeds
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = {};
    await Promise.all(categories.map(async (cat) => {
      if (!cat.feeds?.length) return;
      try {
        const res = await fetch(`/api/feeds?urls=${encodeURIComponent(cat.feeds.join(","))}&categoryId=${cat.id}`);
        const data = await res.json();
        results[cat.id] = data.articles || [];
      } catch (_) { results[cat.id] = []; }
    }));
    setArticles(results);
    setLoading(false);
  }, [categories]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Derived state
  const allArticles = Object.values(articles).flat()
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const filteredArticles = activeCategory === "all" ? allArticles : (articles[activeCategory] || []);
  const suggested = SUGGESTED_CATEGORIES.filter((s) => !categories.find((c) => c.id === s.id));

  const handleRemove = (id) => {
    setCategories((p) => p.filter((c) => c.id !== id));
    if (activeCategory === id) setActiveCategory("all");
  };

  const handleAdd = async (cat) => {
    if (categories.find((c) => c.id === cat.id)) return;
    // If it's a suggested category without a logo, fetch one
    const withLogo = cat.logo ? cat : { ...cat };
    if (!withLogo.logo) {
      const logo = await fetchWikiLogo(cat.name);
      if (logo) withLogo.logo = logo;
    }
    setCategories((p) => [...p, withLogo]);
  };

  return (
    <ThemeCtx.Provider value={CB}>
      <div style={{
        minHeight: "100vh", maxWidth: 480, margin: "0 auto",
        background: CB.black, position: "relative",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "fixed", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 320, height: 320, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(circle, rgba(${CB.glowRgb},0.09) 0%, transparent 70%)`,
        }} />

        {/* ── Header ── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 10px", position: "relative", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg, ${CB.amber}, ${CB.red})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: `0 4px 20px rgba(${CB.glowRgb},0.3)`,
            }}>⚡</div>
            <div>
              <div style={{
                fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em", color: CB.cream,
                lineHeight: 1.1, textTransform: "uppercase",
              }}>NicheNews</div>
              <div style={{ fontSize: 9, color: CB.dim, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
                Your Signal · No Noise
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchAll} title="Refresh" style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${CB.border}`,
              background: CB.surface, color: CB.warmGray, cursor: "pointer", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>🔄</button>
            <button onClick={() => setShowSettings(true)} title="Settings" style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${CB.border}`,
              background: CB.surface, color: CB.warmGray, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>⚙</button>
          </div>
        </header>

        {/* ── Digest Banner ── */}
        {view === "feed" && !loading && allArticles.length > 0 && (
          <div
            className="animate-fade-in press-effect"
            onClick={() => setView("digest")}
            style={{
              margin: "4px 20px 16px", padding: "14px 16px", borderRadius: 12,
              background: `linear-gradient(135deg, rgba(${CB.glowRgb},0.08), rgba(${CB.glowRgb},0.03))`,
              border: `1px solid ${CB.borderMd}`, cursor: "pointer", position: "relative", zIndex: 10,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: CB.cream, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📋</span> Daily Digest Ready
            </div>
            <div style={{ fontSize: 12, color: CB.warmGray }}>
              {allArticles.length} stories across {categories.length} niches — tap to read
            </div>
          </div>
        )}

        {/* ── Category Pills ── */}
        {view === "feed" && (
          <div style={{
            display: "flex", gap: 8, padding: "4px 20px 12px",
            overflowX: "auto", position: "relative", zIndex: 10,
          }}>
            {[{ id: "all", name: "All", emoji: "🌐", color: CB.amber, logo: null }, ...categories].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", borderRadius: 20,
                    background: isActive ? `${cat.color}18` : CB.surface,
                    border: `1.5px solid ${isActive ? cat.color : CB.border}`,
                    color: isActive ? cat.color : CB.warmGray,
                    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer",
                    boxShadow: isActive ? `0 2px 12px ${cat.color}18` : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <NicheIcon category={cat} size={14} />
                  {cat.name}
                </button>
              );
            })}
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: "7px 14px", borderRadius: 20, whiteSpace: "nowrap",
                border: `1.5px dashed ${CB.dim}`, background: "transparent",
                color: CB.dim, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >+ Add</button>
          </div>
        )}

        {/* ── Main Content ── */}
        <div style={{ position: "relative", zIndex: 10 }}>
          {loading ? (
            <LoadingSkeleton />
          ) : view === "feed" ? (
            <div style={{ padding: "4px 20px 120px" }}>
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article, i) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    category={categories.find((c) => c.id === article.categoryId)}
                    index={i}
                  />
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "64px 20px", color: CB.warmGray }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: CB.creamDim }}>Nothing here yet</div>
                  <p style={{ fontSize: 13, marginTop: 8, color: CB.warmGray }}>Try refreshing or adding more niches.</p>
                </div>
              )}
            </div>
          ) : (
            <DigestView articlesByCategory={articles} categories={categories} />
          )}
        </div>

        {/* ── Bottom Navigation ── */}
        <nav style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480, zIndex: 50,
          background: `linear-gradient(180deg, transparent, ${CB.black} 28%)`,
          display: "flex", justifyContent: "center", gap: 4,
          padding: "14px 20px 22px",
        }}>
          {[
            { key: "feed",   emoji: "📰", label: "Feed" },
            { key: "digest", emoji: "📋", label: "Digest" },
          ].map(({ key, emoji, label }) => {
            const isActive = view === key;
            return (
              <button key={key} onClick={() => setView(key)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "8px 22px", borderRadius: 14, cursor: "pointer",
                background: isActive ? `rgba(${CB.glowRgb},0.08)` : "transparent",
                border: `1px solid ${isActive ? CB.borderMd : "transparent"}`,
                color: isActive ? CB.amberLt : CB.dim,
                fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                transition: "all 0.2s ease",
              }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                {label}
              </button>
            );
          })}
          <button onClick={() => setShowSettings(true)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 22px", borderRadius: 14, cursor: "pointer",
            background: "transparent", border: "1px solid transparent",
            color: CB.dim, fontSize: 10, fontWeight: 800,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <span style={{ fontSize: 20 }}>⚙️</span>
            Settings
          </button>
        </nav>

        {/* ── Settings Modal ── */}
        {showSettings && (
          <SettingsModal
            categories={categories}
            suggested={suggested}
            onClose={() => setShowSettings(false)}
            onRemove={handleRemove}
            onAdd={handleAdd}
            themeName={themeName}
            onThemeChange={(t) => setThemeName(t)}
          />
        )}
      </div>
    </ThemeCtx.Provider>
  );
}
