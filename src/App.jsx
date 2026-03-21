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
  {
    title: "Hugging Face update",
    summary: "Hugging Face launches new community benchmarks for open models.",
  },
  {
    title: "Meta AI update",
    summary: "Meta AI publishes a new set of lightweight research models.",
  },
];

function App() {
  const handleRefresh = () => {
    alert("Refresh coming soon");
  };

  return (
    <main className="page">
      <h1>AI News Radar</h1>
      <p className="subtitle">Example feed (hard-coded for now)</p>
      <button className="refresh-button" onClick={handleRefresh}>Refresh News</button>
      <section className="news-list">
        {newsItems.map((item) => (
          <article key={item.title} className="news-card">
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
