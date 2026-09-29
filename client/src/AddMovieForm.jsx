import { useState } from "react";
import styles from "./AddMovieForm.module.css";

function AddMovieForm(props) {
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState("");
  const [note, setNote] = useState("");

  async function handleAddMovie(e) {
    e.preventDefault();
    try {
      props.setError(null);

      const response = await fetch("http://localhost:3000/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: title, rating: rating, note: note }), //JSON.stringify({ title, rating, note })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const newMovie = await response.json();
      props.setMovies((prevMovies) => {
        return [...prevMovies, newMovie];
      });
      setTitle("");
      setRating("");
      setNote("");
      return true;
    } catch (error) {
      props.setError("Failed to add movie");
      return false;
    }
  }

  return (
    <div className="addNewMovie">
      <form onSubmit={handleAddMovie}>
        <label htmlFor="title">Movie Title:</label>
        <br />
        <input
          className={styles.inputField}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          type="text"
          id="title"
          name="title"
          value={title}
        />
        <br />
        <label htmlFor="rating">Rating (between 1 and 10):</label>
        <br />
        <input
          className={styles.inputField}
          onChange={(e) => {
            setRating(e.target.value);
          }}
          type="number"
          id="rating"
          name="rating"
          min="1"
          max="10"
          value={rating}
        />
        <br />
        <label htmlFor="note">Note:</label>
        <br />
        <input
          className={styles.inputField}
          onChange={(e) => {
            setNote(e.target.value);
          }}
          type="text"
          id="note"
          name="note"
          value={note}
        />
        <br />
        <br />
        <input
          className={`${styles.btn} ${styles.submitBtn}`}
          type="submit"
          value="Submit"
        />
      </form>
    </div>
  );
}

export default AddMovieForm;
