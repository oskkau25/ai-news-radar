import { useEffect, useState } from "react";

const newsItems = [
  {
    title: "OpenAI update",
    summary: "OpenAI previews faster multimodal reasoning for assistant workflows.",
  },
  {
    title: "Anthropic update",
    summary: "Anthropic announces improved model reliability for coding tasks.",
  },
  {
    title: "Google DeepMind update",
    summary: "DeepMind shares progress on agent planning and tool use.",
  },
];

const STORAGE_KEY = "ai-news-radar-read-items";

function App() {
  const [readItems, setReadItems] = useState(() => {
    const savedItems = localStorage.getItem(STORAGE_KEY);

    if (!savedItems) {
      return {};
    }

    return JSON.parse(savedItems);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readItems));
  }, [readItems]);

  const handleRefresh = () => {
    alert("Refresh coming soon");
  };

  const toggleRead = (title) => {
    setReadItems((currentReadItems) => ({
      ...currentReadItems,
      [title]: !currentReadItems[title],
    }));
  };

  return (
    <main className="page">
      <h1>AI News Radar</h1>
      <p className="subtitle">Example feed (hard-coded for now)</p>
      <button className="refresh-button" onClick={handleRefresh}>Refresh News</button>
      <section className="news-list">
        {newsItems.map((item) => {
          const isRead = readItems[item.title];

          return (
            <article
              key={item.title}
              className={`news-card ${isRead ? "news-card-read" : ""}`.trim()}
            >
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <button
                className="toggle-read-button"
                onClick={() => toggleRead(item.title)}
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
