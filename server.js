import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import movieRoutes from './routes/movieRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Server is Working');
});

app.use('/api/movies', movieRoutes);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});