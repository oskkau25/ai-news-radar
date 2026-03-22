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
    }));
}

function App() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
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
    </main>
  );
}

export default App;
