import { useEffect, useState } from "react";

const STORAGE_KEY = "ai-news-radar-read-items";
const NEWS_API_URL = "https://hn.algolia.com/api/v1/search?query=artificial%20intelligence";
const MAX_ITEMS = 5;
const AI_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "machine learning",
  "deep learning",
  "llm",
  "gpt",
  "openai",
  "anthropic",
  "deepmind",
  "hugging face",
  "transformer",
  "neural network",
  "claude",
  "gemini",
  "agent",
];

function formatTimeAgo(dateString) {
  const publishedAt = new Date(dateString);
  const now = new Date();
  const diffMs = now - publishedAt;

  if (Number.isNaN(publishedAt.getTime())) {
    return "Recently";
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${Math.max(minutes, 1)} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getImportanceScore(item) {
  return (item.points ?? 0) + (item.comments ?? 0) * 2;
}

function isAiRelated(text) {
  const normalizedText = text.toLowerCase();
  return AI_KEYWORDS.some((keyword) => normalizedText.includes(keyword));
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
      `${index + 1}. ${item.title} (${item.points} points, ${item.comments} comments, ${formatTimeAgo(item.createdAt)})`,
    );
  });

  lines.push("", "Links:");
  topItems.forEach((item) => {
    lines.push(`- ${item.url}`);
  });

  return lines.join("\n");
}

async function fetchNewsItems() {
  const response = await fetch(NEWS_API_URL);
  const data = await response.json();
  const seenUrls = new Set();

  return data.hits
    .filter((item) => item.title && item.url)
    .filter((item) => isAiRelated(item.title))
    .filter((item) => {
      if (seenUrls.has(item.url)) {
        return false;
      }

      seenUrls.add(item.url);
      return true;
    })
    .slice(0, MAX_ITEMS)
    .map((item) => ({
      id: item.objectID,
      title: item.title,
      url: item.url,
      points: item.points ?? 0,
      comments: item.num_comments ?? 0,
      createdAt: item.created_at,
    }));
}

function App() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const loadNews = async (errorMessage) => {
    try {
      setLoading(true);
      setError("");

      const items = await fetchNewsItems();
      setNewsItems(items);
      setLastUpdated(new Date());
    } catch (fetchError) {
      console.error("Failed to fetch news:", fetchError);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews("Could not load news right now.");
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readItems));
  }, [readItems]);

  const handleRefresh = async () => {
    await loadNews("Could not refresh news right now.");
  };

  const toggleRead = (id) => {
    setReadItems((currentReadItems) => ({
      ...currentReadItems,
      [id]: !currentReadItems[id],
    }));
  };

  const markAllAsRead = () => {
    setReadItems((currentReadItems) => {
      const nextReadItems = { ...currentReadItems };
      for (const item of newsItems) {
        nextReadItems[item.id] = true;
      }
      return nextReadItems;
    });
  };

  const generateDigest = () => {
    const digestSource = showUnreadOnly
      ? newsItems.filter((item) => !readItems[item.id])
      : newsItems;
    setDigestText(buildDigestText(digestSource));
    setDigestNotice("");
  };

  const copyDigest = async () => {
    if (!digestText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(digestText);
      setDigestNotice("Digest copied. Paste it into WhatsApp.");
    } catch (copyError) {
      console.error("Failed to copy digest:", copyError);
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
        <button className="refresh-button" onClick={handleRefresh}>
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
              onChange={(event) => setShowUnreadOnly(event.target.checked)}
            />
            Show unread only
          </label>
        )}
      </div>
      <section className="news-list">
        {loading && <p>Loading news...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && newsItems.length === 0 && (
          <p>No recent AI news found.</p>
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
              <p className="news-meta">
                {item.points} points • {item.comments} comments • {formatTimeAgo(item.createdAt)}
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
