"use client";

import {
  useState, useEffect, useCallback, useContext,
  createContext, useMemo,
} from "react";

// ── Themes (muted, sophisticated) ─────────────────────────────────────────────
const THEME_DEFS = {
  bebop: {
    id: "bebop", name: "Bebop",
    black: "#080604", dark1: "#110e09", dark2: "#1a1510",
    accent: "#c07830", accentLt: "#d4944a",
    muted: "#7a5a2a", cream: "#ede0c4", creamDim: "#c4a87c",
    warm: "#8c7050", dim: "#4a3c28", glowRgb: "192,120,48",
  },
  matrix: {
    id: "matrix", name: "Forest",
    black: "#040804", dark1: "#090f09", dark2: "#101810",
    accent: "#4a7a40", accentLt: "#60944e",
    muted: "#2e5226", cream: "#cce0c0", creamDim: "#90b080",
    warm: "#587048", dim: "#243820", glowRgb: "74,122,64",
  },
  ocean: {
    id: "ocean", name: "Slate",
    black: "#040608", dark1: "#080e14", dark2: "#0e1620",
    accent: "#3a6a90", accentLt: "#4e80aa",
    muted: "#244e72", cream: "#c8d8ec", creamDim: "#88a8c8",
    warm: "#446280", dim: "#1e3450", glowRgb: "58,106,144",
  },
  synthwave: {
    id: "synthwave", name: "Dusk",
    black: "#08040c", dark1: "#100818", dark2: "#180c22",
    accent: "#7a4a8a", accentLt: "#9460a4",
    muted: "#582a6a", cream: "#dcc8ec", creamDim: "#a888c8",
    warm: "#6a4878", dim: "#3c2050", glowRgb: "122,74,138",
  },
  minimal: {
    id: "minimal", name: "Ink",
    black: "#080808", dark1: "#101010", dark2: "#181818",
    accent: "#b0b0b0", accentLt: "#d8d8d8",
    muted: "#707070", cream: "#efefef", creamDim: "#b8b8b8",
    warm: "#888888", dim: "#404040", glowRgb: "176,176,176",
  },
};

function buildTheme(def) {
  return {
    ...def,
    surface:  `rgba(${def.glowRgb},0.04)`,
    border:   `rgba(${def.glowRgb},0.12)`,
    borderMd: `rgba(${def.glowRgb},0.25)`,
    // compat aliases
    amber: def.accent, amberLt: def.accentLt,
    red: def.muted, warmGray: def.warm,
  };
}

const ThemeCtx = createContext(buildTheme(THEME_DEFS.bebop));
const useTheme = () => useContext(ThemeCtx);

// ── Niche color palette ───────────────────────────────────────────────────────
const NICHE_COLORS = [
  "#c07830","#4a7a40","#3a6a90","#7a4a8a","#886050",
  "#8a4840","#507050","#405880","#704870","#806040",
  "#6a3838","#386868","#786040","#604878","#408858",
];
function pickColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return NICHE_COLORS[Math.abs(h) % NICHE_COLORS.length];
}

// ── Default categories (multiple feeds per niche for source diversity) ─────────
const DEFAULT_CATEGORIES = [
  {
    id: "hockey", name: "Hockey", emoji: "🏒", color: "#4a7aaa", logo: null,
    feeds: [
      "https://www.nhl.com/rss/news",
      "https://www.espn.com/espn/rss/nhl/news",
      "https://news.google.com/rss/search?q=NHL+hockey&hl=en-US&gl=US&ceid=US:en",
    ],
  },
  {
    id: "football", name: "Football", emoji: "🏈", color: "#c07830", logo: null,
    feeds: [
      "https://www.espn.com/espn/rss/nfl/news",
      "https://news.google.com/rss/search?q=NFL+football&hl=en-US&gl=US&ceid=US:en",
    ],
  },
  {
    id: "world-news", name: "World News", emoji: "🌍", color: "#7a4a4a", logo: null,
    feeds: [
      "https://feeds.bbci.co.uk/news/world/rss.xml",
      "https://feeds.npr.org/1004/rss.xml",
      "https://www.theguardian.com/world/rss",
      "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB",
    ],
  },
  {
    id: "tech", name: "Tech & AI", emoji: "💻", color: "#4a7a50", logo: null,
    feeds: [
      "https://hnrss.org/frontpage",
      "https://feeds.arstechnica.com/arstechnica/index",
      "https://news.google.com/rss/search?q=artificial+intelligence+technology&hl=en-US&gl=US&ceid=US:en",
    ],
  },
  {
    id: "anime", name: "Anime", emoji: "🎌", color: "#8a4870", logo: null,
    feeds: [
      "https://www.animenewsnetwork.com/all/rss.xml",
      "https://news.google.com/rss/search?q=anime+manga&hl=en-US&gl=US&ceid=US:en",
    ],
  },
];

const SUGGESTED_CATEGORIES = [
  { id: "gaming",  name: "Gaming",      emoji: "🎮", color: "#507050", logo: null,
    feeds: ["https://www.gamespot.com/feeds/mashup/","https://news.google.com/rss/search?q=video+games&hl=en-US&gl=US&ceid=US:en"] },
  { id: "science", name: "Science",     emoji: "🔬", color: "#405880", logo: null,
    feeds: ["https://www.sciencedaily.com/rss/all.xml","https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"] },
  { id: "space",   name: "Space",       emoji: "🚀", color: "#704870", logo: null,
    feeds: ["https://www.nasa.gov/rss/dyn/breaking_news.rss","https://news.google.com/rss/search?q=space+exploration+NASA&hl=en-US&gl=US&ceid=US:en"] },
  { id: "movies",  name: "Movies & TV", emoji: "🎬", color: "#806040", logo: null,
    feeds: ["https://www.ign.com/articles.rss","https://news.google.com/rss/search?q=movies+TV+shows&hl=en-US&gl=US&ceid=US:en"] },
  { id: "music",   name: "Music",       emoji: "🎵", color: "#6a3838", logo: null,
    feeds: ["https://pitchfork.com/rss/news/","https://news.google.com/rss/search?q=music+albums+artists&hl=en-US&gl=US&ceid=US:en"] },
  { id: "finance", name: "Finance",     emoji: "📈", color: "#386868", logo: null,
    feeds: ["https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114","https://news.google.com/rss/search?q=stock+market+economy&hl=en-US&gl=US&ceid=US:en"] },
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
  } catch { return null; }
}

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

// ── NicheIcon ─────────────────────────────────────────────────────────────────
function NicheIcon({ category, size = 22 }) {
  const [err, setErr] = useState(false);
  if (category?.logo && !err) {
    return (
      <img
        src={category.logo} alt={category.name}
        style={{ width: size, height: size, objectFit: "contain", borderRadius: 4, display: "block" }}
        onError={() => setErr(true)}
      />
    );
  }
  return <span style={{ fontSize: size * 0.8, lineHeight: 1 }}>{category?.emoji || "·"}</span>;
}

// ── Briefing Card ─────────────────────────────────────────────────────────────
function BriefingCard({ cat, articles }) {
  const CB = useTheme();
  const color = cat.color || CB.accent;
  const uniqueSources = [...new Set(articles.map((a) => a.source))].length;

  return (
    <div className="animate-fade-in" style={{
      borderRadius: 14, marginBottom: 14,
      background: CB.surface,
      border: `1px solid ${CB.border}`,
    }}>
      {/* Niche header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "13px 16px 11px",
        borderBottom: `1px solid ${CB.border}`,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: `${color}1a`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <NicheIcon category={cat} size={17} />
        </div>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 800, color, letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}>
            {cat.name}
          </div>
          <div style={{ fontSize: 10, color: CB.dim, marginTop: 1 }}>
            {articles.length} {articles.length === 1 ? "story" : "stories"}
            {uniqueSources > 1 ? ` · ${uniqueSources} sources` : ""}
          </div>
        </div>
      </div>

      {/* Story rows */}
      <div>
        {articles.slice(0, 6).map((article, i) => (
          <a
            key={article.id}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="press-effect"
            style={{ display: "block", textDecoration: "none", color: "inherit" }}
          >
            <div style={{
              padding: "11px 16px",
              borderBottom: i < Math.min(articles.length, 6) - 1
                ? `1px solid ${CB.border}` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color,
                  letterSpacing: "0.04em",
                }}>{article.source}</span>
                <span style={{ fontSize: 10, color: CB.dim }}>·</span>
                <span style={{ fontSize: 10, color: CB.dim }}>{timeAgo(article.pubDate)}</span>
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: CB.cream,
                lineHeight: 1.35,
                marginBottom: article.quotes?.[0] ? 7 : 0,
              }}>
                {article.title}
              </div>
              {article.quotes?.[0] && (
                <p style={{
                  fontSize: 12, color: CB.creamDim, fontStyle: "italic",
                  lineHeight: 1.55, margin: 0,
                  paddingLeft: 10,
                  borderLeft: `2px solid ${color}45`,
                }}>
                  &ldquo;{article.quotes[0].slice(0, 180)}&rdquo;
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Briefing View ─────────────────────────────────────────────────────────────
function BriefingView({ articlesByCategory, categories }) {
  const CB = useTheme();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const totalStories = Object.values(articlesByCategory).reduce((s, a) => s + a.length, 0);

  return (
    <div style={{ padding: "0 16px 120px", position: "relative", zIndex: 10 }}>
      <div style={{ padding: "2px 2px 14px" }}>
        <div style={{
          fontSize: 10, color: CB.dim, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2,
        }}>
          {today}
        </div>
        {totalStories > 0 && (
          <div style={{ fontSize: 12, color: CB.warm }}>
            {totalStories} stories across {categories.length} {categories.length === 1 ? "niche" : "niches"}
          </div>
        )}
      </div>

      {Object.entries(articlesByCategory).map(([catId, arts]) => {
        const cat = categories.find((c) => c.id === catId);
        if (!cat || arts.length === 0) return null;
        return <BriefingCard key={catId} cat={cat} articles={arts} />;
      })}

      {Object.keys(articlesByCategory).length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: CB.dim }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: CB.creamDim, marginBottom: 6 }}>
            Nothing loaded yet
          </div>
          <p style={{ fontSize: 13, color: CB.warm }}>
            Try refreshing or add niches in Settings.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Story Card (All Stories view) ─────────────────────────────────────────────
function StoryCard({ article, category, index }) {
  const CB = useTheme();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const color = category?.color || CB.accent;

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="press-effect animate-fade-in block"
      style={{ animationDelay: `${index * 0.05}s`, textDecoration: "none", color: "inherit" }}
    >
      <div style={{
        borderRadius: 12, overflow: "hidden", marginBottom: 12,
        background: CB.surface, border: `1px solid ${CB.border}`,
      }}>
        {article.image && !imgError && (
          <div style={{ position: "relative", height: 150, background: CB.dark2 }}>
            <img src={article.image} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
              onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} />
            {!imgLoaded && <div className="skeleton" style={{ position: "absolute", inset: 0 }} />}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50,
              background: `linear-gradient(transparent, ${CB.dark2})` }} />
          </div>
        )}
        <div style={{ padding: "12px 16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", color,
            }}>
              <NicheIcon category={category} size={12} />
              {category?.name}
            </span>
            <span style={{ width: 2, height: 2, borderRadius: "50%", background: CB.dim }} />
            <span style={{ fontSize: 10, color: CB.warm }}>{article.source}</span>
            <span style={{ fontSize: 10, color: CB.dim, marginLeft: "auto" }}>{timeAgo(article.pubDate)}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: CB.cream, lineHeight: 1.35, marginBottom: 7 }}>
            {article.title}
          </div>
          {article.quotes?.[0] && (
            <p style={{
              fontSize: 12, fontStyle: "italic", color: CB.creamDim, lineHeight: 1.5,
              paddingLeft: 10, borderLeft: `2px solid ${color}45`, margin: 0,
            }}>
              &ldquo;{article.quotes[0].slice(0, 140)}&rdquo;
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

// ── Theme Picker ──────────────────────────────────────────────────────────────
function ThemePicker({ current, onChange }) {
  const CB = useTheme();
  return (
    <div>
      <p style={{
        fontSize: 10, fontWeight: 800, color: CB.dim,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
      }}>
        Appearance
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.values(THEME_DEFS).map((t) => {
          const isActive = current === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                background: isActive ? `${t.accent}18` : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${isActive ? t.accent : "rgba(255,255,255,0.07)"}`,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", gap: 3 }}>
                {[t.accent, t.muted, t.cream].map((c, ci) => (
                  <div key={ci} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
                ))}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: isActive ? t.accent : "#666", whiteSpace: "nowrap",
              }}>
                {t.name}
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
  const [query,   setQuery]   = useState("");
  const [adding,  setAdding]  = useState(false);
  const [msg,     setMsg]     = useState("");

  const inputStyle = {
    padding: "10px 14px", borderRadius: 10, fontSize: 13,
    background: "rgba(255,255,255,0.05)", border: `1px solid ${CB.border}`,
    color: CB.cream, outline: "none", width: "100%", boxSizing: "border-box",
  };

  async function handleAdd() {
    const q = query.trim();
    if (!q) return;
    setAdding(true);
    setMsg("Finding…");
    const logo = await fetchWikiLogo(q);
    const niche = {
      id:     q.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      name:   q,
      emoji:  "·",
      color:  pickColor(q),
      logo,
      feeds:  [googleNewsUrl(q)],
      custom: true,
    };
    onAdd(niche);
    setQuery("");
    setMsg(logo ? `Added "${q}" with logo` : `Added "${q}"`);
    setAdding(false);
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(4,3,2,0.88)",
        backdropFilter: "blur(14px)", zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          background: `linear-gradient(180deg, ${CB.dark2}, ${CB.dark1})`,
          borderRadius: "18px 18px 0 0", width: "100%", maxWidth: 480,
          maxHeight: "92vh", overflowY: "auto",
          padding: "20px 20px 48px",
          border: `1px solid ${CB.borderMd}`, borderBottom: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 34, height: 4, borderRadius: 2, background: CB.dim, margin: "0 auto 20px" }} />

        <h2 style={{ fontSize: 18, fontWeight: 800, color: CB.cream, marginBottom: 4, letterSpacing: "-0.02em" }}>
          Settings
        </h2>
        <p style={{ fontSize: 12, color: CB.warm, marginBottom: 22 }}>
          Customize your briefing and appearance
        </p>

        <ThemePicker current={themeName} onChange={onThemeChange} />

        <div style={{ height: 1, background: CB.border, margin: "20px 0" }} />

        {/* Add niche */}
        <p style={{ fontSize: 10, fontWeight: 800, color: CB.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          Add a Niche
        </p>
        <p style={{ fontSize: 12, color: CB.warm, marginBottom: 10 }}>
          Type any team, topic, or interest — we&apos;ll find the news and logo automatically.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="e.g. Buffalo Sabres, Formula 1, Taylor Swift…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !query.trim()}
            style={{
              padding: "10px 16px", borderRadius: 10,
              cursor: adding || !query.trim() ? "default" : "pointer",
              background: `${CB.accent}20`, border: `1px solid ${CB.accent}40`,
              color: CB.accentLt, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
              opacity: adding || !query.trim() ? 0.45 : 1,
            }}
          >
            {adding ? "…" : "Add"}
          </button>
        </div>
        {msg && <p style={{ fontSize: 12, color: CB.accent, marginBottom: 8 }}>{msg}</p>}

        <div style={{ height: 1, background: CB.border, margin: "20px 0" }} />

        {/* Your niches */}
        <p style={{ fontSize: 10, fontWeight: 800, color: CB.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          Your Niches
        </p>
        {categories.map((cat) => (
          <div key={cat.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 10, background: CB.surface, border: `1px solid ${CB.border}`, marginBottom: 6,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: `${cat.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <NicheIcon category={cat} size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: CB.cream }}>{cat.name}</div>
              {cat.custom && <div style={{ fontSize: 10, color: CB.dim, marginTop: 1 }}>Custom</div>}
            </div>
            <button
              onClick={() => onRemove(cat.id)}
              style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: "rgba(160,60,40,0.10)", border: "1px solid rgba(160,60,40,0.22)",
                color: "#a03828", cursor: "pointer", fontSize: 16, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >×</button>
          </div>
        ))}

        {/* Suggested */}
        {suggested.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 800, color: CB.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "18px 0 10px" }}>
              Suggested
            </p>
            {suggested.map((cat) => (
              <div key={cat.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 10, background: CB.surface, border: `1px solid ${CB.border}`, marginBottom: 6,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: `${cat.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <NicheIcon category={cat} size={20} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: CB.cream, flex: 1 }}>{cat.name}</span>
                <button
                  onClick={() => onAdd(cat)}
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: "rgba(60,120,60,0.10)", border: "1px solid rgba(60,120,60,0.22)",
                    color: "#3c7840", cursor: "pointer", fontSize: 18, fontWeight: 700,
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
    <div style={{ padding: "0 16px 120px" }}>
      <div style={{ padding: "2px 2px 14px" }}>
        <div className="skeleton" style={{ height: 9, width: "38%", borderRadius: 4, marginBottom: 7 }} />
        <div className="skeleton" style={{ height: 11, width: "55%", borderRadius: 4 }} />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ borderRadius: 14, overflow: "hidden", marginBottom: 14, border: `1px solid ${CB.border}` }}>
          <div style={{ padding: "13px 16px 11px", borderBottom: `1px solid ${CB.border}` }}>
            <div className="skeleton" style={{ height: 9, width: "22%", borderRadius: 4, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 8, width: "32%", borderRadius: 4 }} />
          </div>
          {[1, 2, 3, 4].map((j) => (
            <div key={j} style={{ padding: "11px 16px", borderBottom: j < 4 ? `1px solid ${CB.border}` : "none" }}>
              <div className="skeleton" style={{ height: 8, width: "18%", borderRadius: 4, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 13, width: "92%", borderRadius: 4, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 13, width: "68%", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [themeName, setThemeName] = useState("bebop");
  const CB = useMemo(() => buildTheme(THEME_DEFS[themeName] || THEME_DEFS.bebop), [themeName]);

  const [categories,    setCategories]    = useState(DEFAULT_CATEGORIES);
  const [articles,      setArticles]      = useState({});
  const [loading,       setLoading]       = useState(true);
  const [view,          setView]          = useState("briefing");
  const [showSettings,  setShowSettings]  = useState(false);

  // ── Persistence — fixed: don't save until after the initial load ────────────
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      // Migrate from v3 → v4 if needed
      const raw = localStorage.getItem("nichenews-v4-categories")
               || localStorage.getItem("nichenews-v3-categories");
      if (raw) setCategories(JSON.parse(raw));

      const savedTheme = localStorage.getItem("nichenews-v4-theme")
                      || localStorage.getItem("nichenews-v3-theme");
      if (savedTheme && THEME_DEFS[savedTheme]) setThemeName(savedTheme);
    } catch {}
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    try { localStorage.setItem("nichenews-v4-categories", JSON.stringify(categories)); }
    catch {}
  }, [categories, initialized]);

  useEffect(() => {
    if (!initialized) return;
    try { localStorage.setItem("nichenews-v4-theme", themeName); }
    catch {}
  }, [themeName, initialized]);

  // ── Auto-fetch missing logos (mount only) ──────────────────────────────────
  useEffect(() => {
    categories.forEach(async (cat) => {
      if (cat.logo) return;
      const logo = await fetchWikiLogo(cat.name);
      if (logo) setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, logo } : c));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch feeds ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = {};
    await Promise.all(
      categories.map(async (cat) => {
        if (!cat.feeds?.length) return;
        try {
          const res  = await fetch(`/api/feeds?urls=${encodeURIComponent(cat.feeds.join(","))}&categoryId=${cat.id}`);
          const data = await res.json();
          results[cat.id] = data.articles || [];
        } catch { results[cat.id] = []; }
      })
    );
    setArticles(results);
    setLoading(false);
  }, [categories]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const allArticles = Object.values(articles).flat()
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const suggested = SUGGESTED_CATEGORIES.filter((s) => !categories.find((c) => c.id === s.id));

  const handleRemove = (id) => setCategories((p) => p.filter((c) => c.id !== id));

  const handleAdd = async (cat) => {
    if (categories.find((c) => c.id === cat.id)) return;
    const item = { ...cat };
    if (!item.logo) {
      const logo = await fetchWikiLogo(cat.name);
      if (logo) item.logo = logo;
    }
    setCategories((p) => [...p, item]);
  };

  return (
    <ThemeCtx.Provider value={CB}>
      <div style={{
        minHeight: "100vh", maxWidth: 480, margin: "0 auto",
        background: CB.black, position: "relative",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "fixed", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 340, height: 340, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(circle, rgba(${CB.glowRgb},0.07) 0%, transparent 70%)`,
        }} />

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 10px", position: "relative", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* NN monogram */}
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: `linear-gradient(135deg, ${CB.dark2}, ${CB.black})`,
              border: `1.5px solid ${CB.borderMd}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 2px 14px rgba(${CB.glowRgb},0.18)`,
            }}>
              <span style={{
                fontSize: 12, fontWeight: 900, color: CB.accent,
                letterSpacing: "-0.04em", lineHeight: 1,
              }}>NN</span>
            </div>
            <div>
              <div style={{
                fontSize: 15, fontWeight: 900, letterSpacing: "-0.03em",
                color: CB.cream, lineHeight: 1.1, textTransform: "uppercase",
              }}>NicheNews</div>
              <div style={{
                fontSize: 8, color: CB.dim, letterSpacing: "0.14em",
                textTransform: "uppercase", fontWeight: 700,
              }}>
                Your Signal · No Noise
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={fetchAll}
              style={{
                height: 30, padding: "0 11px", borderRadius: 8,
                border: `1px solid ${CB.border}`,
                background: CB.surface, color: CB.warm, cursor: "pointer",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
              }}
            >
              Refresh
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                height: 30, padding: "0 11px", borderRadius: 8,
                border: `1px solid ${CB.border}`,
                background: CB.surface, color: CB.warm, cursor: "pointer",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
              }}
            >
              Settings
            </button>
          </div>
        </header>

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <div style={{ position: "relative", zIndex: 10 }}>
          {loading ? (
            <LoadingSkeleton />
          ) : view === "briefing" ? (
            <BriefingView articlesByCategory={articles} categories={categories} />
          ) : (
            <div style={{ padding: "4px 16px 120px" }}>
              {allArticles.length > 0 ? (
                allArticles.map((article, i) => (
                  <StoryCard
                    key={article.id}
                    article={article}
                    category={categories.find((c) => c.id === article.categoryId)}
                    index={i}
                  />
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "64px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: CB.creamDim, marginBottom: 6 }}>
                    No stories yet
                  </div>
                  <p style={{ fontSize: 13, color: CB.warm }}>
                    Try refreshing or add niches in Settings.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom Navigation ─────────────────────────────────────────── */}
        <nav style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480, zIndex: 50,
          background: `linear-gradient(180deg, transparent, ${CB.black} 32%)`,
          display: "flex", justifyContent: "center", gap: 4,
          padding: "16px 20px 24px",
        }}>
          {[
            { key: "briefing",  label: "Briefing" },
            { key: "stories",   label: "All Stories" },
          ].map(({ key, label }) => {
            const isActive = view === key;
            return (
              <button
                key={key}
                onClick={() => setView(key)}
                style={{
                  padding: "7px 18px", borderRadius: 20, cursor: "pointer",
                  background: isActive ? `rgba(${CB.glowRgb},0.10)` : "transparent",
                  border: `1px solid ${isActive ? CB.borderMd : "transparent"}`,
                  color: isActive ? CB.accentLt : CB.dim,
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                  transition: "all 0.2s ease",
                }}
              >
                {label}
              </button>
            );
          })}
          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: "7px 18px", borderRadius: 20, cursor: "pointer",
              background: "transparent", border: "1px solid transparent",
              color: CB.dim, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
            }}
          >
            Settings
          </button>
        </nav>

        {/* ── Settings Modal ────────────────────────────────────────────── */}
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
