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
  const [readItems, setReadItems] = useState(() => {
    const savedItems = localStorage.getItem(STORAGE_KEY);

    if (!savedItems) {
      return {};
    }

    return JSON.parse(savedItems);
  });

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchNews();
      setNewsItems(items);
    } catch (error) {
      console.error("Failed to fetch news:", error);
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

  return (
    <main className="page">
      <h1>AI News Radar</h1>
      <p className="subtitle">Latest AI-related stories from Hacker News</p>
      <button className="refresh-button" onClick={() => void loadNews()}>
        Refresh News
      </button>
      {newsItems.length > 0 && (
        <button className="refresh-button" onClick={markAllAsRead}>
          Mark all as read
        </button>
      )}
      <section className="news-list">
        {loading && <p>Loading news...</p>}
        {!loading && newsItems.length === 0 && (
          <p>No news available right now.</p>
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
