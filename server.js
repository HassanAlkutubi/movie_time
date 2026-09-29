import express from 'express';
import cors from 'cors';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

try {
  await pool.connect();
  console.log('Successfully connected to movie_time database');
} catch (err) {
  console.error('Database connection error:', err);
}

app.get('/', (req, res) => {
  res.send('Server is Working')
})

app.get('/movies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies');
    res.json(result.rows)
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post('/movies', async (req, res) => {
  try {
    console.log(req.body);
    const title = req.body.title;
    const rating = req.body.rating;
    const note = req.body.note;
    const result = await pool.query(
      `INSERT INTO movies (title, rating, note)
      VALUES ($1, $2, $3) RETURNING *`,
      [title, rating, note]);
    res.json(result.rows[0]);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.patch('/movies/:id', async (req, res) => {
  try {
    const edited_id = req.params.id;
    console.log(req.body);
    const { title, rating, note } = req.body;
    const result = await pool.query(
      `UPDATE movies
      SET title = $1, rating = $2, note = $3
      WHERE id = $4 RETURNING *`,
      [title, rating, note, edited_id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.delete('/movies/:id', async (req, res) => {
  try {
    const deleted_id = req.params.id;
    const result = await pool.query(
      `DELETE FROM movies WHERE id = $1 RETURNING *;`,
      [deleted_id]);
    res.json(result.rows[0])
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});