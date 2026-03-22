import { useEffect, useState } from "react";

const STORAGE_KEY = "ai-news-radar-read-items";
const NEWS_API_URL = "https://hn.algolia.com/api/v1/search?query=ai";

function App() {
  const [newsItems, setNewsItems] = useState([]);
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
        const response = await fetch(NEWS_API_URL);
        const data = await response.json();

        const items = data.hits
          .filter((item) => item.title && item.url)
          .slice(0, 10)
          .map((item) => ({
            id: item.objectID,
            title: item.title,
            url: item.url,
          }));

        setNewsItems(items);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readItems));
  }, [readItems]);

  const handleRefresh = async () => {
    try {
      const response = await fetch(NEWS_API_URL);
      const data = await response.json();

      const items = data.hits
        .filter((item) => item.title && item.url)
        .slice(0, 10)
        .map((item) => ({
          id: item.objectID,
          title: item.title,
          url: item.url,
        }));

      setNewsItems(items);
    } catch (error) {
      console.error("Failed to refresh news:", error);
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
