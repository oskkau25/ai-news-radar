import { useEffect, useState } from "react";

const STORAGE_KEY = "ai-news-radar-read-items";
const NEWS_API_URL = "https://hn.algolia.com/api/v1/search?query=ai";
const MAX_ITEMS = 10;
const MAX_AGE_DAYS = 14;

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

function isRecentEnough(dateString) {
  const publishedAt = new Date(dateString);

  if (Number.isNaN(publishedAt.getTime())) {
    return false;
  }

  const diffMs = Date.now() - publishedAt.getTime();
  const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  return diffMs <= maxAgeMs;
}

function App() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readItems, setReadItems] = useState(() => {
    const savedItems = localStorage.getItem(STORAGE_KEY);

    if (!savedItems) {
      return {};
    }

    return JSON.parse(savedItems);
  });

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(NEWS_API_URL);
        const data = await response.json();
        const seenUrls = new Set();

        const items = data.hits
          .filter((item) => item.title && item.url && isRecentEnough(item.created_at))
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

        setNewsItems(items);
      } catch (fetchError) {
        console.error("Failed to fetch news:", fetchError);
        setError("Could not load news right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readItems));
  }, [readItems]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(NEWS_API_URL);
      const data = await response.json();
      const seenUrls = new Set();

      const items = data.hits
        .filter((item) => item.title && item.url && isRecentEnough(item.created_at))
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

      setNewsItems(items);
    } catch (fetchError) {
      console.error("Failed to refresh news:", fetchError);
      setError("Could not refresh news right now.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRead = (id) => {
    setReadItems((currentReadItems) => ({
      ...currentReadItems,
      [id]: !currentReadItems[id],
    }));
  };

  return (
    <main className="page">
      <h1>AI News Radar</h1>
      <p className="subtitle">Latest AI-related stories from Hacker News</p>
      <button className="refresh-button" onClick={handleRefresh}>Refresh News</button>
      <section className="news-list">
        {loading && <p>Loading news...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && newsItems.length === 0 && (
          <p>No recent AI news found.</p>
        )}
        {newsItems.map((item) => {
          const isRead = readItems[item.id];

          return (
            <article
              key={item.id}
              className={`news-card ${isRead ? "news-card-read" : ""}`.trim()}
            >
              <h2>{item.title}</h2>
              <p>
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.url}
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
    </main>
  );
}

export default App;
