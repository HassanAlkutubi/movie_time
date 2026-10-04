import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useDebounce from "./useDebounce";
import AddMovieForm from "./AddMovieForm";
import MovieCard from "./MovieCard";

export async function fetchMovies(searchQuery = "") {
  const trimmed = searchQuery ? searchQuery.trim() : "";
  const url = `http://localhost:3000/api/movies${
    trimmed ? `?search=${encodeURIComponent(trimmed)}` : ""
  }`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

export function AppContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const {
    data: movies = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["movies", debouncedSearch],
    queryFn: () => fetchMovies(debouncedSearch),
  });

  const movieList = Array.isArray(movies) ? movies : [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Movie Time</h1>
          <nav className="space-x-4">
            <Link to="/" className="hover:text-blue-200 transition-colors">
              Home
            </Link>
            <Link to="/add" className="hover:text-blue-200 transition-colors">
              Add Movie
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-6">
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <div className="mb-6">
                  <input
                    type="text"
                    id="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search movies..."
                    aria-label="Search movies"
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-gray-800 placeholder-gray-400"
                  />
                </div>

                {isLoading && (
                  <div className="text-center py-10 text-gray-500">
                    <p>Loading movies...</p>
                  </div>
                )}

                {isError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error?.message || "Failed to fetch movies from server"}
                  </div>
                )}

                {!isLoading && !isError && (
                  <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {movieList.map((movieItem) => (
                      <MovieCard key={movieItem.id} movieItem={movieItem} />
                    ))}
                    {movieList.length === 0 && (
                      <p className="text-gray-500 col-span-full text-center py-10">
                        No movies found. Add one!
                      </p>
                    )}
                  </section>
                )}
              </div>
            }
          />
          <Route path="/add" element={<AddMovieForm />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
