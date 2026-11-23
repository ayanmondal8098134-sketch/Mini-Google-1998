// Dataset provided by the scenario
const webPages = [
  {
    page: 1,
    url: "pune-food-guide.com",
    text: "Where to eat in Pune - vada pav and biryani and pizza",
    links_to: [2]
  },
  {
    page: 2,
    url: "best-pizza-pune.com",
    text: "Fresh wood-fired pizza made daily - try our cheese pizza",
    links_to: [1, 3]
  },
  {
    page: 3,
    url: "college-canteen-blog.com",
    text: "Student reviews of canteen food and chai and Friday pizza",
    links_to: [2, 4]
  },
  {
    page: 4,
    url: "pizza-recipes-home.com",
    text: "Make pizza at home - pizza dough and pizza sauce",
    links_to: [2, 5]
  },
  {
    page: 5,
    url: "cheap-eats-pune.com",
    text: "Good food under 100 rupees - misal and dosa and pizza slices",
    links_to: [2]
  },
  {
    page: 6,
    url: "pizza-pizza-pizza.com",
    text: "pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza",
    links_to: [1]
  }
];

let pageRankScores = {};

/**
 * 100,000 Random Surfer moves ("Dice Throw" method)
 * Standard Google PageRank damping factor = 0.85
 * - 85% probability: randomly pick and follow an outgoing link
 * - 15% probability: teleport to any random page across the web
 */
function simulateRandomSurfer(pages, totalMoves = 100000, dampingFactor = 0.85) {
  const visitCounts = {};
  pages.forEach(p => (visitCounts[p.page] = 0));

  let currentPage = pages[Math.floor(Math.random() * pages.length)];

  for (let i = 0; i < totalMoves; i++) {
    const diceRoll = Math.random();

    // 15% teleportation OR if page has no links
    if (diceRoll >= dampingFactor || !currentPage.links_to || currentPage.links_to.length === 0) {
      currentPage = pages[Math.floor(Math.random() * pages.length)];
    } else {
      // 85% follow outgoing link uniformly at random
      const targetPageId = currentPage.links_to[Math.floor(Math.random() * currentPage.links_to.length)];
      currentPage = pages.find(p => p.page === targetPageId) || pages[0];
    }

    visitCounts[currentPage.page]++;
  }

  // Convert raw visit counts to percentage
  const scores = {};
  pages.forEach(p => {
    scores[p.page] = (visitCounts[p.page] / totalMoves) * 100;
  });

  return scores;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countKeywordMatches(text, query) {
  if (!query) return 0;
  const escaped = escapeRegExp(query);
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function highlightQuery(text, query) {
  if (!query) return text;
  const escaped = escapeRegExp(query);
  const regex = new RegExp(`(\\b${escaped}\\b)`, "gi");
  return text.replace(regex, '<mark class="highlight">$1</mark>');
}

function renderOldWay(results, query) {
  const container = document.getElementById("leftResults");
  container.innerHTML = "";

  if (results.length === 0) {
    container.innerHTML = `<div class="empty-state">No matching pages found for "${query}".</div>`;
    return;
  }

  results.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "result-card";
    const highlightedText = highlightQuery(item.text, query);

    card.innerHTML = `
      <div class="card-top">
        <a class="card-url" href="http://${item.url}" target="_blank" rel="noopener noreferrer">${item.url}</a>
        <span class="card-rank">#${index + 1}</span>
      </div>
      <div>
        <span class="badge badge-matches">Score: ${item.matchCount} ${item.matchCount === 1 ? 'match' : 'matches'}</span>
      </div>
      <div class="card-snippet">
        ${highlightedText}
      </div>
    `;

    container.appendChild(card);
  });
}

function renderPageRankWay(results, query) {
  const container = document.getElementById("rightResults");
  container.innerHTML = "";

  if (results.length === 0) {
    container.innerHTML = `<div class="empty-state">No matching pages found for "${query}".</div>`;
    return;
  }

  results.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "result-card";
    const scoreFormatted = item.pageRankScore.toFixed(2);
    const highlightedText = highlightQuery(item.text, query);

    card.innerHTML = `
      <div class="card-top">
        <a class="card-url" href="http://${item.url}" target="_blank" rel="noopener noreferrer">${item.url}</a>
        <span class="card-rank">#${index + 1}</span>
      </div>
      <div>
        <span class="badge badge-pagerank">Score: ${scoreFormatted}% PageRank</span>
      </div>
      <div class="card-snippet">
        ${highlightedText}
      </div>
    `;

    container.appendChild(card);
  });
}

function performSearch() {
  const searchInput = document.getElementById("searchInput");
  const query = searchInput.value.trim().toLowerCase();

  const analyzedPages = webPages.map(page => {
    const count = query ? countKeywordMatches(page.text, query) : 1;
    return {
      ...page,
      matchCount: count,
      pageRankScore: pageRankScores[page.page] || 0
    };
  });

  const filteredPages = query
    ? analyzedPages.filter(p => p.matchCount > 0)
    : analyzedPages;

  // 1. Old Way: Sort strictly by repetition / frequency (Descending)
  const oldWaySorted = [...filteredPages].sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    return a.page - b.page;
  });

  // 2. PageRank Way: Sort by random surfer score (Descending)
  const pageRankSorted = [...filteredPages].sort((a, b) => {
    return b.pageRankScore - a.pageRankScore;
  });

  renderOldWay(oldWaySorted, query);
  renderPageRankWay(pageRankSorted, query);
}

function runSurferSimulation() {
  const descEl = document.getElementById("pagerankDesc");
  if (descEl) descEl.innerText = "Simulating 100,000 dice throws...";

  setTimeout(() => {
    pageRankScores = simulateRandomSurfer(webPages, 100000, 0.85);
    if (descEl) descEl.innerText = "Sorted by PageRank (from 100,000 random surfer moves)";
    performSearch();
  }, 10);
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const rerollBtn = document.getElementById("rerollBtn");

  runSurferSimulation();

  searchBtn.addEventListener("click", performSearch);
  searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") performSearch();
  });

  rerollBtn.addEventListener("click", () => {
    runSurferSimulation();
  });

  document.querySelectorAll(".suggest-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const query = e.target.getAttribute("data-query");
      searchInput.value = query;
      performSearch();
    });
  });
});