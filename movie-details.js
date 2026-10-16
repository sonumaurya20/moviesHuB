
const API_KEY = "6aafc966";
const API_URL = "https://www.omdbapi.com/";

const movieDetail = document.querySelector("#movieDetail");

// URL se IMDb ID lena
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

async function getMovieDetails() {
  if (!movieId) {
    showError("Movie ID nahi mili. Homepage se movie select karo.");
    return;
  }

  try {
    const url = new URL(API_URL);

    url.searchParams.set("apikey", API_KEY);
    url.searchParams.set("i", movieId);
    url.searchParams.set("plot", "full");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const movie = await response.json();

    if (movie.Response === "False") {
      showError(movie.Error || "Movie details nahi mil paayi.");
      return;
    }

    renderDetails(movie);

  } catch (error) {
    showError("Internet ya API connection check karo, phir dobara try karo.");
  }
}

function showError(message) {
  const error = document.createElement("div");
  error.className = "detail-error";
  error.textContent = message;
  movieDetail.replaceChildren(error);
}

function createFact(label, value) {
  const box = document.createElement("div");
  box.className = "detail-fact";

  const heading = document.createElement("strong");
  heading.textContent = label;

  const text = document.createElement("span");
  text.textContent = value && value !== "N/A"
    ? value
    : "Not available";

  box.append(heading, text);
  return box;
}

function renderDetails(movie) {
  movieDetail.replaceChildren();

  const layout = document.createElement("div");
  layout.className = "detail-layout";

  // Poster
  const poster = document.createElement("img");
  poster.className = "detail-poster";
  poster.alt = `${movie.Title} poster`;

  if (movie.Poster && movie.Poster !== "N/A") {
    poster.src = movie.Poster;
  } else {
    poster.alt = "Poster unavailable";
    poster.src = "";
    poster.style.display = "none";
  }

  // Information section
  const info = document.createElement("div");
  info.className = "detail-info";

  const title = document.createElement("h1");
  title.textContent = movie.Title;

  const meta = document.createElement("div");
  meta.className = "detail-meta";

  [
    movie.Year,
    movie.Rated,
    movie.Runtime,
    movie.Genre
  ].filter(value => value && value !== "N/A")
    .forEach(value => {
      const item = document.createElement("span");
      item.textContent = value;
      meta.append(item);
    });

  const rating = document.createElement("p");
  rating.className = "detail-rating";
  rating.textContent =
    `★ IMDb Rating: ${movie.imdbRating || "Not available"}`;

  const plotHeading = document.createElement("h3");
  plotHeading.textContent = "Story";

  plotHeading.style.marginBottom = "10px";

  const plot = document.createElement("p");
  plot.className = "detail-plot";
  plot.textContent =
    movie.Plot && movie.Plot !== "N/A"
      ? movie.Plot
      : "Story description is not available.";

  const facts = document.createElement("div");
  facts.className = "detail-facts";

  facts.append(
    createFact("Director", movie.Director),
    createFact("Cast", movie.Actors),
    createFact("Release Date", movie.Released),
    createFact("Language", movie.Language),
    createFact("Awards", movie.Awards),
    createFact("Box Office", movie.BoxOffice)
  );

  const trailerButton = document.createElement("button");
  trailerButton.className = "primary-btn";
  trailerButton.textContent = "Find Trailer ↗";
  trailerButton.type = "button";

  trailerButton.addEventListener("click", () => {
    const query = encodeURIComponent(
      `${movie.Title} official trailer`
    );

    window.open(
      `https://www.youtube.com/results?search_query=${query}`,
      "_blank",
      "noopener,noreferrer"
    );
  });

  info.append(
    title,
    meta,
    rating,
    plotHeading,
    plot,
    facts,
    trailerButton
  );

  layout.append(poster, info);
  movieDetail.append(layout);

  document.title = `${movie.Title} | MovieHub`;
}

getMovieDetails();