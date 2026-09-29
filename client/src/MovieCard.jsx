import { useState } from "react";
import styles from "./MovieCard.module.css";

function MovieCard(props) {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(props.movieItem.title);
  const [rating, setRating] = useState(props.movieItem.rating);
  const [note, setNote] = useState(props.movieItem.note);

  function toggleEditMode() {
    setEditMode((prevState) => !prevState);
  }

  return (
    <div className={styles.card} id={props.movieItem.id}>
      {editMode ? (
        <div className={styles.contentContainer}>
          <input
            className={styles.inputField}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            type="text"
            value={title}
          />
          <input
            className={styles.inputField}
            onChange={(e) => {
              setRating(e.target.value);
            }}
            type="text"
            value={rating}
          />
          <input
            className={styles.inputField}
            onChange={(e) => {
              setNote(e.target.value);
            }}
            type="text"
            value={note}
          />
        </div>
      ) : (
        <div className={styles.contentContainer}>
          <p className={styles.title}>{props.movieItem.title}</p>
          <p className={styles.rating}>{props.movieItem.rating}⭐</p>
          <p className={styles.note}>{props.movieItem.note}</p>
        </div>
      )}
      <div className={styles.buttonsContainer}>
        {editMode ? (
          <button
            className={`${styles.btn} ${styles.doneBtn}`}
            onClick={async () => {
              const success = await props.handleEditMovie(
                props.movieItem.id,
                title,
                rating,
                note,
              );
              if (success) {
                toggleEditMode();
              }
            }}
          >
            Done ✅
          </button>
        ) : (
          <button
            className={`${styles.btn} ${styles.editBtn}`}
            onClick={toggleEditMode}
          >
            Edit ✏️
          </button>
        )}
        {!editMode && (
          <button
            className={`${styles.btn} ${styles.deleteBtn}`}
            onClick={() => {
              props.handleDeleteMovie(props.movieItem.id);
            }}
          >
            Delete 🗑️
          </button>
        )}
      </div>
    </div>
  );
}

export default MovieCard;
