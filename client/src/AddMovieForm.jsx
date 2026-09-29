import { useState } from "react";
import styles from "./AddMovieForm.module.css";

function AddMovieForm(props) {
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState("");
  const [note, setNote] = useState("");

  async function handleAddMovie(e) {
    e.preventDefault();
    if (!title) {
      props.setError("Movie title is required");
      return;
    }
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
    } catch {
      props.setError("Failed to add movie");
      return false;
    }
  }

  return (
    <section className={styles.formContainer}>
      <form className={styles.form} onSubmit={handleAddMovie}>
        <label htmlFor="title">Movie Title:</label>
        <input
          className={styles.inputField}
          onChange={(e) => {
            if (props.error) {
              props.setError(null);
            }
            setTitle(e.target.value);
          }}
          type="text"
          id="title"
          name="title"
          value={title}
          required
        />
        <label htmlFor="rating">Rating (between 1 and 10):</label>
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
        <label htmlFor="note">Note:</label>
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
        <input
          className={`${styles.btn} ${styles.submitBtn}`}
          type="submit"
          value="Submit"
        />
      </form>
    </section>
  );
}

export default AddMovieForm;
