import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function AddMovieForm(props = {}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [localError, setLocalError] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const addMovieMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("http://localhost:3000/api/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      setTitle("");
      setDescription("");
      setRating("");
      setReleaseYear("");
      navigate("/");
    },
    onError: (err) => {
      const msg = err.message || "Failed to add movie";
      setLocalError(msg);
      if (typeof props.setError === "function") {
        props.setError(msg);
      }
      alert(msg);
    },
  });

  async function handleAddMovie(e) {
    e.preventDefault();
    if (!title.trim()) {
      const msg = "Movie title is required";
      setLocalError(msg);
      if (typeof props.setError === "function") {
        props.setError(msg);
      }
      return;
    }
    setLocalError(null);
    if (typeof props.setError === "function") {
      props.setError(null);
    }

    const payload = {
      title: title.trim(),
      description: description || null,
      rating: rating ? parseFloat(rating) : null,
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
    };

    addMovieMutation.mutate(payload);
  }

  const errorMessage = localError || props.error;

  return (
    <section className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Add a New Movie</h2>
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {errorMessage}
        </div>
      )}
      <form className="flex flex-col space-y-4" onSubmit={handleAddMovie}>
        <div className="flex flex-col">
          <label htmlFor="title" className="mb-1 font-semibold text-gray-700">
            Movie Title:
          </label>
          <input
            className="border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            onChange={(e) => {
              if (localError) setLocalError(null);
              if (typeof props.setError === "function") props.setError(null);
              setTitle(e.target.value);
            }}
            type="text"
            id="title"
            name="title"
            value={title}
            required
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="description" className="mb-1 font-semibold text-gray-700">
            Description:
          </label>
          <textarea
            className="border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            onChange={(e) => setDescription(e.target.value)}
            id="description"
            name="description"
            value={description}
            rows="3"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="rating" className="mb-1 font-semibold text-gray-700">
            Rating (1-10):
          </label>
          <input
            className="border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            onChange={(e) => setRating(e.target.value)}
            type="number"
            id="rating"
            name="rating"
            min="1"
            max="10"
            step="0.1"
            value={rating}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="releaseYear" className="mb-1 font-semibold text-gray-700">
            Release Year:
          </label>
          <input
            className="border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            onChange={(e) => setReleaseYear(e.target.value)}
            type="number"
            id="releaseYear"
            name="releaseYear"
            min="1800"
            max="2100"
            value={releaseYear}
          />
        </div>
        <input
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-colors"
          type="submit"
          value="Submit"
        />
      </form>
    </section>
  );
}

export default AddMovieForm;
