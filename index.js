
const API_KEY = "6aafc966";
const API_URL = "https://www.omdbapi.com/";

const searchForm = document.querySelector("#searchForm");
const movieInput = document.querySelector("#movieInput");
const searchButton = document.querySelector("#searchButton");
const movieHub = document.querySelector("#movieHub");
const resultsMessage = document.querySelector("#resultsMessage");
const sectionTitle = document.querySelector("#sectionTitle");
const sortSelect = document.querySelector("#sortSelect");
const filters = document.querySelector("#filters");
const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector("#navLinks");
const watchlistLink = document.querySelector("#watchlistLink");

let movies = [];
let currentFilter = "all";
let isShowingWatchlist = false;
let currentRequest = null;

let favorites = loadFavorites();

// Safely load favorites from localStorage
function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem("moviehub-favorites"));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

// Save complete movie objects, not just their IDs
function saveFavorites() {
  localStorage.setItem("moviehub-favorites", JSON.stringify(favorites));
}

function getMovieId(movie) {
  return movie.imdbID;
}

function isFavorite(movie) {
  return favorites.some(
    favorite => getMovieId(favorite) === getMovieId(movie)
  );
}

// Fetch movies from OMDb
async function searchMovies(query) {
  if (currentRequest) {
    currentRequest.abort();
  }

  const controller = new AbortController();
  currentRequest = controller;

  resultsMessage.textContent = "Searching movies...";
  movieHub.replaceChildren();
  searchButton.disabled = true;
  searchButton.textContent = "Searching...";

  try {
    const url = new URL(API_URL);
    url.searchParams.set("apikey", API_KEY);
    url.searchParams.set("s", query.trim());

    const response = await fetch(url, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("Could not connect to the movie service.");
    }

    const data = await response.json();

    if (data.Response === "False") {
      movies = [];
      renderMovies();
      resultsMessage.textContent =
        data.Error || "No movies found. Try another title.";
      return;
    }

    movies = data.Search || [];
    isShowingWatchlist = false;
    currentFilter = "all";
    updateFilterButtons();
    sectionTitle.textContent = `Results for "${query}"`;
    renderMovies();

  } catch (error) {
    if (error.name === "AbortError") return;

    resultsMessage.textContent =
      "Something went wrong. Check your internet or API key.";
    movieHub.replaceChildren();

  } finally {
    if (currentRequest === controller) {
      currentRequest = null;
      searchButton.disabled = false;
      searchButton.textContent = "Search";
    }
  }
}

// Show favorites saved in localStorage
function showWatchlist() {
  isShowingWatchlist = true;
  currentFilter = "favorites";
  sectionTitle.textContent = "My Watchlist";
  updateFilterButtons();
  renderMovies();
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach(button => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle("active", selected);
  });
}

// Create one movie card
function createMovieCard(movie) {
  const card = document.createElement("article");
  card.className = "movie-card";

  const posterWrap = document.createElement("div");
  posterWrap.className = "poster-wrap";

  const poster = document.createElement("img");
  poster.className = "movie-poster";
  poster.alt = `${movie.Title} poster`;
  poster.loading = "lazy";

  if (movie.Poster && movie.Poster !== "N/A") {
    poster.src = movie.Poster;

    poster.addEventListener("error", () => {
      const placeholder = document.createElement("div");
      placeholder.className = "poster-placeholder";
      placeholder.textContent = "Poster unavailable";
      poster.replaceWith(placeholder);
    }, { once: true });
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "poster-placeholder";
    placeholder.textContent = "Poster unavailable";
    poster.replaceWith(placeholder);
  }

  posterWrap.append(poster);

  const favoriteButton = document.createElement("button");
  favoriteButton.className = "favorite-btn";
  favoriteButton.type = "button";
  favoriteButton.textContent = isFavorite(movie) ? "♥" : "♡";
  favoriteButton.classList.toggle("is-favorite", isFavorite(movie));
  favoriteButton.setAttribute(
    "aria-label",
    isFavorite(movie) ? "Remove from watchlist" : "Add to watchlist"
  );
  favoriteButton.dataset.action = "favorite";
  favoriteButton.dataset.id = movie.imdbID;

  posterWrap.append(favoriteButton);

  const info = document.createElement("div");
  info.className = "movie-card-info";

  const title = document.createElement("h3");
  title.className = "movie-card-title";
  title.textContent = movie.Title;

  const meta = document.createElement("div");
  meta.className = "movie-card-meta";

  const year = document.createElement("span");
  year.textContent = movie.Year || "Year unknown";

  const type = document.createElement("span");
  type.textContent = movie.Type
    ? movie.Type.charAt(0).toUpperCase() + movie.Type.slice(1)
    : "Title";

  meta.append(year, type);

  const actions = document.createElement("div");
  actions.className = "movie-actions";

  const detailsButton = document.createElement("button");
  detailsButton.className = "details-btn";
  detailsButton.textContent = "Details";
  detailsButton.type = "button";
  detailsButton.dataset.action = "details";
  detailsButton.dataset.id = movie.imdbID;

  const trailerButton = document.createElement("button");
  trailerButton.className = "trailer-btn";
  trailerButton.textContent = "Trailer ↗";
  trailerButton.type = "button";
  trailerButton.dataset.action = "trailer";
  trailerButton.dataset.title = movie.Title;

  actions.append(detailsButton, trailerButton);
  info.append(title, meta, actions);
  card.append(posterWrap, info);

  return card;
}

// Filter and sort movie results
function renderMovies() {
  let visibleMovies = isShowingWatchlist
    ? [...favorites]
    : [...movies];

  if (!isShowingWatchlist && currentFilter !== "all") {
    visibleMovies = visibleMovies.filter(movie =>
      movie.Type === currentFilter
    );
  }

  const sortMode = sortSelect.value;

  if (sortMode === "year-desc") {
    visibleMovies.sort(
      (a, b) => parseInt(b.Year) - parseInt(a.Year)
    );
  } else if (sortMode === "year-asc") {
    visibleMovies.sort(
      (a, b) => parseInt(a.Year) - parseInt(b.Year)
    );
  } else if (sortMode === "title-asc") {
    visibleMovies.sort((a, b) =>
      a.Title.localeCompare(b.Title)
    );
  }

  movieHub.replaceChildren();

  if (visibleMovies.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = isShowingWatchlist
      ? "Your watchlist is empty. Search for a movie and tap ♡ to save it."
      : "No movies to show. Try another filter or search.";
    movieHub.append(empty);

    resultsMessage.textContent = "0 titles found";
    return;
  }

  const fragment = document.createDocumentFragment();

  visibleMovies.forEach(movie => {
    fragment.append(createMovieCard(movie));
  });

  movieHub.append(fragment);
  resultsMessage.textContent = `${visibleMovies.length} title(s) found`;
}

// Search form
searchForm.addEventListener("submit", event => {
  event.preventDefault();

  const query = movieInput.value.trim();

  if (!query) {
    movieInput.focus();
    return;
  }

  isShowingWatchlist = false;
  currentFilter = "all";
  sortSelect.value = "default";
  updateFilterButtons();
  searchMovies(query);
});

// Filter buttons
filters.addEventListener("click", event => {
  const button = event.target.closest(".filter-btn");

  if (!button) return;

  currentFilter = button.dataset.filter;
  isShowingWatchlist = currentFilter === "favorites";

  if (isShowingWatchlist) {
    sectionTitle.textContent = "My Watchlist";
  } else {
    sectionTitle.textContent = "Discover Movies";
  }

  updateFilterButtons();
  renderMovies();
});

// Sorting
sortSelect.addEventListener("change", renderMovies);

// Handle card buttons using event delegation
movieHub.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "favorite") {
    const allMovies = [...movies, ...favorites];
    const selectedMovie = allMovies.find(
      movie => movie.imdbID === id
    );

    if (!selectedMovie) return;

    if (isFavorite(selectedMovie)) {
      favorites = favorites.filter(
        movie => movie.imdbID !== id
      );
    } else {
      favorites.push(selectedMovie);
    }

    saveFavorites();
    renderMovies();
  }

  if (action === "details") {
    window.location.href =
      `movie-details.html?id=${encodeURIComponent(id)}`;
  }

  if (action === "trailer") {
    const title = button.dataset.title;
    const query = encodeURIComponent(`${title} official trailer`);

    window.open(
      `https://www.youtube.com/results?search_query=${query}`,
      "_blank",
      "noopener,noreferrer"
    );
  }
});

// Mobile navigation
menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", event => {
  if (event.target.closest("a")) {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

watchlistLink.addEventListener("click", event => {
  event.preventDefault();
  showWatchlist();
  document.querySelector("#discover").scrollIntoView({
    behavior: "smooth"
  });
});

// Initial movies
searchMovies("Interstellar");