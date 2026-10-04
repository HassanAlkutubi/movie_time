import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function MovieCard(props) {
  const movie = props.movieItem || props.movie || {};
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(movie.title || "");
  const [description, setDescription] = useState(movie.description || "");
  const [rating, setRating] = useState(
    movie.rating !== undefined && movie.rating !== null ? movie.rating : ""
  );
  const [releaseYear, setReleaseYear] = useState(
    movie.releaseYear !== undefined && movie.releaseYear !== null
      ? movie.releaseYear
      : ""
  );

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!editMode) {
      setTitle(movie.title || "");
      setDescription(movie.description || "");
      setRating(
        movie.rating !== undefined && movie.rating !== null ? movie.rating : ""
      );
      setReleaseYear(
        movie.releaseYear !== undefined && movie.releaseYear !== null
          ? movie.releaseYear
          : ""
      );
    }
  }, [movie.title, movie.description, movie.rating, movie.releaseYear, editMode]);

  const editMutation = useMutation({
    mutationFn: async (updatedFields) => {
      const response = await fetch(`http://localhost:3000/api/movies/${movie.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFields),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      setEditMode(false);
      if (typeof props.handleEditMovie === "function") {
        props.handleEditMovie(movie.id, title, description, rating, releaseYear);
      }
    },
    onError: (err) => {
      const msg = err.message || "Failed to save changes";
      alert(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:3000/api/movies/${movie.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      if (typeof props.handleDeleteMovie === "function") {
        props.handleDeleteMovie(movie.id);
      }
    },
    onError: (err) => {
      const msg = err.message || "Failed to delete movie";
      alert(msg);
    },
  });

  function toggleEditMode() {
    setEditMode((prevState) => !prevState);
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full border border-gray-100"
      id={movie.id}
    >
      <div className="p-4 flex-grow flex flex-col">
        {editMode ? (
          <div className="flex flex-col space-y-3">
            <input
              className="border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500 w-full"
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              value={title}
              placeholder="Title"
            />
            <textarea
              className="border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500 w-full"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              placeholder="Description"
              rows="2"
            />
            <div className="flex space-x-2">
              <input
                className="border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500 w-1/2"
                onChange={(e) => setRating(e.target.value)}
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={rating}
                placeholder="Rating"
              />
              <input
                className="border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500 w-1/2"
                onChange={(e) => setReleaseYear(e.target.value)}
                type="number"
                min="1800"
                max="2100"
                value={releaseYear}
                placeholder="Year"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
                {movie.title}
              </h3>
              <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-semibold whitespace-nowrap ml-2">
                {movie.rating ? `${movie.rating} ⭐` : "N/A"}
              </div>
            </div>
            {movie.releaseYear && (
              <p className="text-sm text-gray-500 mb-2 font-medium">
                Released: {movie.releaseYear}
              </p>
            )}
            <p className="text-gray-600 text-sm flex-grow">
              {movie.description ? (
                movie.description
              ) : (
                <span className="italic text-gray-400">
                  No description provided.
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-end space-x-2">
        {editMode ? (
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
            disabled={editMutation.isPending}
            onClick={() => {
              const r =
                rating !== "" && rating !== null ? parseFloat(rating) : null;
              const y =
                releaseYear !== "" && releaseYear !== null
                  ? parseInt(releaseYear, 10)
                  : null;
              editMutation.mutate({
                title,
                description: description || null,
                rating: r,
                releaseYear: y,
              });
            }}
          >
            {editMutation.isPending ? "Saving..." : "Done ✅"}
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
            onClick={toggleEditMode}
          >
            Edit ✏️
          </button>
        )}
        {!editMode && (
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
            disabled={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate();
            }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete 🗑️"}
          </button>
        )}
      </div>
    </div>
  );
}

export default MovieCard;
