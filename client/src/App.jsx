import { useState, useEffect } from "react";
import AddMovieForm from "./AddMovieForm";
import MovieCard from "./MovieCard";
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
      } catch (error) {
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
    } catch (error) {
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
      const deletedMovie = await response.json();
      setMovies((prevMovies) => {
        return prevMovies.filter((movie, index) => {
          return movie.id !== id;
        });
      });
      return true;
    } catch (error) {
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
    <div>
      <div>
        <h1>Movie Time 🍿</h1>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {showAddForm && (
        <AddMovieForm setMovies={setMovies} setError={setError} />
      )}
      {showAddForm ? (
        <button onClick={handleShowAddingMovie}>➖</button>
      ) : (
        <button onClick={handleShowAddingMovie}>➕</button>
      )}
      {movies.map((movieItem, index) => {
        return (
          <MovieCard
            key={movieItem.id}
            movieItem={movieItem}
            handleDeleteMovie={handleDeleteMovie}
            handleEditMovie={handleEditMovie}
          />
        );
      })}
    </div>
  );
}

export default App;
