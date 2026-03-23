import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ai-news-radar-read-items";
const NEWS_API_URL = "https://hn.algolia.com/api/v1/search?query=ai";

async function fetchNews() {
  const response = await fetch(NEWS_API_URL);
  const data = await response.json();

  return data.hits
    .filter((item) => item.title && item.url)
    .slice(0, 10)
    .map((item) => ({
      id: item.objectID,
      title: item.title,
      url: item.url,
      points: item.points ?? 0,
      comments: item.num_comments ?? 0,
      createdAt: item.created_at,
    }));
}

function formatHoursAgo(dateString) {
  const publishedAtMs = Date.parse(dateString);
  if (Number.isNaN(publishedAtMs)) {
    return "recently";
  }

  const diffMs = Date.now() - publishedAtMs;
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  return `${diffHours}h ago`;
}

function getImportanceScore(item) {
  return (item.points ?? 0) + (item.comments ?? 0) * 2;
}

function buildDigestText(items) {
  if (items.length === 0) {
    return "AI News Radar Daily\n\nNo major AI stories found right now.";
  }

  const topItems = [...items]
    .sort((a, b) => getImportanceScore(b) - getImportanceScore(a))
    .slice(0, 5);

  const lines = [
    `AI News Radar Daily - ${new Date().toLocaleDateString()}`,
    "",
    "Top stories:",
  ];

  topItems.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.title} (${item.points} points, ${item.comments} comments, ${formatHoursAgo(item.createdAt)})`,
    );
  });

  lines.push("", "Links:");
  topItems.forEach((item) => {
    lines.push(`- ${item.url}`);
  });

  return lines.join("\n");
}

function App() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [digestText, setDigestText] = useState("");
  const [digestNotice, setDigestNotice] = useState("");
  const [readItems, setReadItems] = useState(() => {
    const savedItems = localStorage.getItem(STORAGE_KEY);

    if (!savedItems) {
      return {};
    }

    return JSON.parse(savedItems);
  });

  const loadNews = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const items = await fetchNews();
      setNewsItems(items);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch news:", error);
      setFetchError(
        "Couldn’t load news. Check your connection and tap Refresh.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readItems));
  }, [readItems]);

  const toggleRead = (id) => {
    setReadItems((currentReadItems) => ({
      ...currentReadItems,
      [id]: !currentReadItems[id],
    }));
  };

  const markAllAsRead = () => {
    setReadItems((current) => {
      const next = { ...current };
      for (const item of newsItems) {
        next[item.id] = true;
      }
      return next;
    });
  };

  const generateDigest = () => {
    const digest = buildDigestText(newsItems);
    setDigestText(digest);
    setDigestNotice("");
  };

  const copyDigest = async () => {
    if (!digestText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(digestText);
      setDigestNotice("Digest copied. Paste it into WhatsApp.");
    } catch (error) {
      console.error("Failed to copy digest:", error);
      setDigestNotice("Copy failed. Select and copy manually.");
    }
  };

  const displayedItems = showUnreadOnly
    ? newsItems.filter((item) => !readItems[item.id])
    : newsItems;

  const lastUpdatedLabel =
    lastUpdated != null
      ? lastUpdated.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

  return (
    <main className="page">
      <h1>AI News Radar</h1>
      <p className="subtitle">Latest AI-related stories from Hacker News</p>
      {lastUpdatedLabel && (
        <p className="meta-updated">Last updated {lastUpdatedLabel}</p>
      )}
      <div className="toolbar">
        <button className="refresh-button" onClick={() => void loadNews()}>
          Refresh News
        </button>
        {newsItems.length > 0 && (
          <button className="refresh-button" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
        {newsItems.length > 0 && (
          <button className="refresh-button" onClick={generateDigest}>
            Generate daily digest
          </button>
        )}
        {newsItems.length > 0 && (
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
            />
            Show unread only
          </label>
        )}
      </div>
      <section className="news-list">
        {loading && <p>Loading news...</p>}
        {fetchError && <p className="error-message">{fetchError}</p>}
        {!loading && newsItems.length === 0 && !fetchError && (
          <p>No news available right now.</p>
        )}
        {!loading &&
          newsItems.length > 0 &&
          displayedItems.length === 0 &&
          showUnreadOnly && <p>All stories in this list are read.</p>}
        {displayedItems.map((item) => {
          const isRead = readItems[item.id];

          return (
            <article
              key={item.id}
              className={`news-card ${isRead ? "news-card-read" : ""}`.trim()}
            >
              <h2>{item.title}</h2>
              <p>
                <a href={item.url} target="_blank" rel="noreferrer">
                  Read article →
                </a>
              </p>
              <button
                className="toggle-read-button"
                onClick={() => toggleRead(item.id)}
              >
                Mark as {isRead ? "Unread" : "Read"}
              </button>
            </article>
          );
        })}
      </section>
      {digestText && (
        <section className="digest-card">
          <div className="digest-header">
            <h2>Digest Preview</h2>
            <button className="toggle-read-button" onClick={() => void copyDigest()}>
              Copy for WhatsApp
            </button>
          </div>
          <pre className="digest-text">{digestText}</pre>
          {digestNotice && <p className="meta-updated">{digestNotice}</p>}
        </section>
      )}
    </main>
  );
}

export default App;
