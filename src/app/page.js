"use client";

import { useState, useEffect, useCallback } from "react";

// ── Cowboy Bebop palette (matches globals.css) ──────────────────────────────
const CB = {
  black:     "#070608",
  dark1:     "#0f0d0e",
  dark2:     "#16110f",
  amber:     "#d4891a",
  amberLt:   "#e8a838",
  red:       "#b5341e",
  redLt:     "#cc4a2a",
  cream:     "#e8d5b0",
  creamDim:  "#c4ad86",
  warmGray:  "#8c7a5e",
  dim:       "#4a3e30",
  surface:   "rgba(240, 180, 80, 0.03)",
  border:    "rgba(212, 137, 26, 0.1)",
  borderMd:  "rgba(212, 137, 26, 0.2)",
};

// ── Category definitions ─────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: "sports-nhl",  name: "Hockey",     emoji: "🏒", color: "#4aa8cc", feeds: ["https://www.nhl.com/rss/news"] },
  { id: "sports-nfl",  name: "Football",   emoji: "🏈", color: "#cc7a2e", feeds: ["https://www.espn.com/espn/rss/nfl/news"] },
  { id: "geopolitics", name: "World News", emoji: "🌍", color: "#b5341e", feeds: ["https://feeds.bbci.co.uk/news/world/rss.xml", "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"] },
  { id: "anime",       name: "Anime",      emoji: "🎌", color: "#d4891a", feeds: ["https://www.animenewsnetwork.com/all/rss.xml"] },
  { id: "tech",        name: "Tech & AI",  emoji: "🤖", color: "#6b9e4e", feeds: ["https://hnrss.org/frontpage"] },
];

const SUGGESTED_CATEGORIES = [
  { id: "gaming",  name: "Gaming",      emoji: "🎮", color: "#5c8a4a", feeds: ["https://www.gamespot.com/feeds/mashup/"] },
  { id: "science", name: "Science",     emoji: "🔬", color: "#4a7aaa", feeds: ["https://www.sciencedaily.com/rss/all.xml"] },
  { id: "space",   name: "Space",       emoji: "🚀", color: "#8b5c7e", feeds: ["https://www.nasa.gov/rss/dyn/breaking_news.rss"] },
  { id: "movies",  name: "Movies & TV", emoji: "🎬", color: "#aa6a2e", feeds: ["https://www.ign.com/articles.rss"] },
  { id: "music",   name: "Music",       emoji: "🎵", color: "#9e4a6a", feeds: ["https://pitchfork.com/rss/news/"] },
  { id: "finance", name: "Finance",     emoji: "📈", color: "#4a8a6e", feeds: ["https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114"] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60)   return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60)         return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)         return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(dateString).toLocaleDateString();
}

// ── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({ article, category, index }) {
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
      <article
        style={{
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 20,
          background: CB.surface,
          border: `1px solid ${CB.border}`,
          transition: "border-color 0.2s ease",
        }}
      >
        {/* ── Image ── */}
        {article.image && !imgError ? (
          <div style={{ position: "relative", height: 190, background: CB.dark2 }}>
            <img
              src={article.image}
              alt=""
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 0.5s ease",
              }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
            {!imgLoaded && <div className="skeleton" style={{ position: "absolute", inset: 0 }} />}
            {/* Gradient fade at bottom so text reads over image */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
              background: `linear-gradient(transparent, ${CB.dark2})`,
            }} />
          </div>
        ) : (
          <div style={{
            height: 72, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, background: `${color}12`,
            borderBottom: `1px solid ${CB.border}`,
          }}>
            {category?.emoji}
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ padding: "14px 18px 18px" }}>

          {/* Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
              textTransform: "uppercase", color,
            }}>
              {category?.emoji}&nbsp;{category?.name}
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

          {/* Summary paragraph */}
          {article.summary && (
            <p style={{ fontSize: 13, lineHeight: 1.6, color: CB.warmGray, marginBottom: 12 }}>
              {article.summary}
            </p>
          )}

          {/* Pull quote(s) ── the Bebop special ── */}
          {article.quotes?.length > 0 && article.quotes.map((quote, qi) => (
            <blockquote
              key={qi}
              style={{
                margin: "12px 0 0",
                paddingLeft: 14,
                borderLeft: `3px solid ${color}`,
                color: CB.creamDim,
                fontSize: 13,
                lineHeight: 1.65,
                fontStyle: "italic",
                letterSpacing: "0.005em",
              }}
            >
              &ldquo;{quote}&rdquo;
            </blockquote>
          ))}

          {/* Read more link indicator */}
          <div style={{
            marginTop: 14, display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", color: CB.warmGray,
          }}>
            Read full article
            <span style={{ fontSize: 12 }}>→</span>
          </div>
        </div>
      </article>
    </a>
  );
}

// ── Digest View ──────────────────────────────────────────────────────────────
function DigestView({ articlesByCategory, categories }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const totalArticles = Object.values(articlesByCategory).reduce((s, a) => s + a.length, 0);

  return (
    <div style={{ padding: "0 20px 120px", position: "relative", zIndex: 10 }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: CB.cream, marginBottom: 4, letterSpacing: "-0.02em" }}>
          ☀️ Daily Digest
        </h2>
        <p style={{ fontSize: 13, color: CB.warmGray }}>
          {today} — {totalArticles} stories
        </p>
      </div>

      {Object.entries(articlesByCategory).map(([catId, arts]) => {
        const cat = categories.find((c) => c.id === catId);
        if (!cat || arts.length === 0) return null;
        return (
          <div key={catId} className="animate-fade-in" style={{
            borderRadius: 14, background: CB.surface,
            border: `1px solid ${CB.border}`,
            padding: "16px 18px", marginBottom: 16,
          }}>
            {/* Category header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
              paddingBottom: 12, borderBottom: `1px solid ${cat.color}25`,
            }}>
              <span style={{ fontSize: 18 }}>{cat.emoji}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: cat.color, letterSpacing: "-0.01em" }}>
                {cat.name}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: CB.warmGray, fontWeight: 600 }}>
                {arts.length} {arts.length === 1 ? "story" : "stories"}
              </span>
            </div>

            {/* Articles in this category */}
            {arts.slice(0, 5).map((article, i) => (
              <a
                key={article.id}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", textDecoration: "none", color: "inherit",
                  padding: "10px 0",
                  borderBottom: i < arts.length - 1 ? `1px solid ${CB.border}` : "none",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: CB.cream, lineHeight: 1.4 }}>
                  {article.title}
                </span>
                <span style={{ display: "block", fontSize: 11, color: CB.warmGray, marginTop: 4 }}>
                  {article.source} • {timeAgo(article.pubDate)}
                </span>
              </a>
            ))}
          </div>
        );
      })}
    </div>
  );
}

oopener noreferrer"
                style={{
                  display: "block", padding: "10px 0",
                  borderBottom: i < Math.min(arts.length, 5) - 1 ? `1px solid ${CB.border}` : "none",
                  textDecoration: "none", color: "inherit",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: CB.cream, marginBottom: 3, lineHeight: 1.35 }}>
                  {article.title}
                </div>
                {/* First pull quote in digest */}
                {article.quotes?.[0] && (
                  <p style={{
                    fontSize: 12, color: CB.warmGray, fontStyle: "italic",
                    marginBottom: 3, lineHeight: 1.5,
                    paddingLeft: 8, borderLeft: `2px solid ${cat.color}60`,
                    marginTop: 5,
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

// ── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ categories, onClose, onRemove, onAdd, suggested }) {
  const [customName, setCustomName] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");
  const [customFeed, setCustomFeed] = useState("");

  const inputStyle = {
    padding: "10px 14px", borderRadius: 10, fontSize: 13,
    background: "rgba(240,180,80,0.05)", border: `1px solid ${CB.border}`,
    color: CB.cream, outline: "none", width: "100%",
  };

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
          background: `linear-gradient(180deg, #16110f, #0f0d0e)`,
          borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480,
          maxHeight: "88vh", overflowY: "auto",
          padding: "24px 22px 40px",
          border: `1px solid ${CB.borderMd}`,
          borderBottom: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: CB.dim, margin: "0 auto 22px" }} />

        <h2 style={{ fontSize: 20, fontWeight: 900, color: CB.cream, marginBottom: 4, letterSpacing: "-0.02em" }}>
          Manage Niches
        </h2>
        <p style={{ fontSize: 13, color: CB.warmGray, marginBottom: 24 }}>
          Add or remove topics to tune your feed
        </p>

        {/* Current topics */}
        <p style={{ fontSize: 10, fontWeight: 800, color: CB.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          Your Topics
        </p>
        {categories.map((cat) => (
          <div key={cat.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            borderRadius: 12, background: CB.surface, border: `1px solid ${CB.border}`, marginBottom: 8,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${cat.color}15`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18,
            }}>
              {cat.emoji}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: CB.cream, flex: 1 }}>{cat.name}</span>
            <button
              onClick={() => onRemove(cat.id)}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(181,52,30,0.12)", border: "1px solid rgba(181,52,30,0.25)",
                color: CB.red, cursor: "pointer", fontSize: 18, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >×</button>
          </div>
        ))}

        {/* Suggested */}
        {suggested.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 800, color: CB.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "22px 0 12px" }}>
              Add Topics
            </p>
            {suggested.map((cat) => (
              <div key={cat.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                borderRadius: 12, background: CB.surface, border: `1px solid ${CB.border}`, marginBottom: 8,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `${cat.color}15`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 18,
                }}>
                  {cat.emoji}
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

        {/* Custom topic */}
        <p style={{ fontSize: 10, fontWeight: 800, color: CB.dim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "22px 0 12px" }}>
          Custom Topic
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input style={{ ...inputStyle, width: 50, textAlign: "center", padding: "10px 6px", flex: "none" }}
            placeholder="📌" value={customEmoji} onChange={(e) => setCustomEmoji(e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }}
            placeholder="Topic name..." value={customName} onChange={(e) => setCustomName(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle, flex: 1 }}
            placeholder="RSS feed URL..." value={customFeed} onChange={(e) => setCustomFeed(e.target.value)} />
          <button
            onClick={() => {
              if (customName.trim() && customFeed.trim()) {
                onAdd({
                  id: customName.toLowerCase().replace(/\s+/g, "-"),
                  name: customName,
                  emoji: customEmoji || "📌",
                  color: CB.amber,
                  feeds: [customFeed],
                });
                setCustomName(""); setCustomEmoji(""); setCustomFeed("");
              }
            }}
            style={{
              padding: "10px 18px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap",
              background: `${CB.amber}20`, border: `1px solid ${CB.amber}40`,
              color: CB.amberLt, fontSize: 13, fontWeight: 700,
            }}
          >
            Add
          </button>
        </div>
        <p style={{ fontSize: 11, color: CB.dim, marginTop: 10 }}>
          Tip: Google &ldquo;[site name] RSS feed&rdquo; to find the URL.
        </p>
      </div>
    </div>
  );
}

// ── Loading Skeletons ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
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
tem("nichenews-v2-categories");
      if (saved) setCategories(JSON.parse(saved));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("nichenews-v2-categories", JSON.stringify(categories)); }
    catch (_) {}
  }, [categories]);

  // Fetch feeds
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = {};
    await Promise.all(categories.map(async (cat) => {
      if (!cat.feeds.length) return;
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

  // Derived
  const allArticles = Object.values(articles).flat()
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const filteredArticles = activeCategory === "all" ? allArticles : (articles[activeCategory] || []);
  const suggested = SUGGESTED_CATEGORIES.filter((s) => !categories.find((c) => c.id === s.id));

  const handleRemove = (id) => {
    setCategories((p) => p.filter((c) => c.id !== id));
    if (activeCategory === id) setActiveCategory("all");
  };
  const handleAdd = (cat) => {
    if (!categories.find((c) => c.id === cat.id))
      setCategories((p) => [...p, cat]);
  };

  return (
    <div style={{ minHeight: "100vh", maxWidth: 480, margin:  "0 auto", background: CB.black, position: "relative" }}>

      {/* Amber glow at top (like a jazz club lamp) */}
      <div style={{
        position: "fixed", top: -60, left: "50%", transform: "translateX(-50%)",
        width: 320, height: 320, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(212,137,26,0.08) 0%, transparent 70%)",
      }} />

      {/* ── Header ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 20px 10px", position: "relative", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Logo mark */}
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${CB.amber}, ${CB.red})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: `0 4px 20px ${CB.amber}30`,
          }}>
            ⚡
          </div>
          <div>
            <div style={{
              fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em", color: CB.cream,
              lineHeight: 1.1, textTransform: "uppercase",
            }}>
              NicheNews
            </div>
            <div style={{ fontSize: 9, color: CB.dim, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
              Your Signal · No Noise
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={fetchAll}
            style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${CB.border}`,
              background: CB.surface, color: CB.warmGray, cursor: "pointer", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Refresh"
          >🔄</button>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${CB.border}`,
              background: CB.surface, color: CB.warmGray, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Manage topics"
          >⚙</button>
        </div>
      </header>

      {/* ── Digest Banner ── */}
      {view === "feed" && !loading && allArticles.length > 0 && (
        <div
          className="animate-fade-in press-effect"
          onClick={() => setView("digest")}
          style={{
            margin: "4px 20px 16px", padding: "14px 16px", borderRadius: 12,
            background: `linear-gradient(135deg, ${CB.amber}12, ${CB.red}08)`,
            border: `1px solid ${CB.borderMd}`,
            cursor: "pointer", position: "relative", zIndex: 10,
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
          {/* All */}
          {[{ id: "all", name: "All", emoji: "🌐", color: CB.amber }, ...categories].map((cat) => {
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
                {cat.emojh} {cat.name}
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
          >
            + Add
          </button>
        </div>
      )}

      {/* Main Content */}
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

      {/* Bottom Navigation */}
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
            <button
              key={key}
              onClick={() => setView(key)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "8px 22px", borderRadius: 14, cursor: "pointer",
                background: isActive ? `${CB.amber}15` : "transparent",
                border: `1px solid ${isActive ? CB.borderMd : "transparent"}`,
                color: isActive ? CB.amberLt : CB.dim,
                fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 20 }}>{emoji}</span>
              {label}
            </button>
          );
        })}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "8px 22px", borderRadius: 14, cursor: "pointer",
            background: "transparent", border: "1px solid transparent",
            color: CB.dim, fontSize: 10, fontWeight: 800,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}
        >
          <span style={{ fontSize: 20 }}>⚙️</span>
          Settings
        </button>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          categories={categories}
          suggested={suggested}
          onClose={() => setShowSettings(false)}
          onRemove={handleRemove}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
