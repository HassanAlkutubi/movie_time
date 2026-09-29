import { useState, useEffect } from "react";
import AddMovieForm from "./AddMovieForm";
import MovieCard from "./MovieCard";
import "./App.css";

function App() {
  const [movies, setMovies] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getMovies() {
      try {
        setError(null);
        const response = await fetch("http://localhost:3000/movies");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setMovies(data);
      } catch {
        setError("Failed to fetch movies from server");
      }
    }

    getMovies();
  }, []);

  async function handleEditMovie(id, title, rating, note) {
    try {
      setError(null);
      const response = await fetch(`http://localhost:3000/movies/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, rating, note }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const editedMovie = await response.json();
      setMovies((prevMovies) =>
        prevMovies.map((movie) => (movie.id === id ? editedMovie : movie)),
      );
      return true;
    } catch {
      setError("Failed to save changes");
      return false;
    }
  }

  async function handleDeleteMovie(id) {
    try {
      setError(null);
      console.log(id);
      const response = await fetch(`http://localhost:3000/movies/${id}`, {
        method: "DELETE",
        headers: {
          "content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setMovies((prevMovies) => {
        return prevMovies.filter((movie) => movie.id !== id);
      });
      return true;
    } catch {
      setError("Failed to delete movie");
      return false;
    }
  }

  function handleShowAddingMovie() {
    if (showAddForm == false) {
      setShowAddForm(true);
    } else {
      setShowAddForm(false);
    }
  }

  console.log(movies);

  return (
    <main className="appShell">
      <header className="appHeader">
        <h1>Movie Time</h1>
      </header>
      {error && <p className="errorMessage">{error}</p>}
      {showAddForm && (
        <AddMovieForm setMovies={setMovies} error={error} setError={setError} />
      )}
      {showAddForm ? (
        <button
          className="toggleBtn"
          onClick={handleShowAddingMovie}
          aria-label="Close add movie form"
        >
          -
        </button>
      ) : (
        <button
          className="toggleBtn"
          onClick={handleShowAddingMovie}
          aria-label="Add a movie"
        >
          +
        </button>
      )}
      <section className="movieList" aria-label="Your movies">
        {movies.map((movieItem) => (
          <MovieCard
            key={movieItem.id}
            movieItem={movieItem}
            handleDeleteMovie={handleDeleteMovie}
            handleEditMovie={handleEditMovie}
          />
        ))}
      </section>
    </main>
  );
}

export default App;
