import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMovies = async (req, res) => {
  try {
    const { search } = req.query;
    const searchTerm = typeof search === 'string' ? search.trim() : '';

    const movies = await prisma.movie.findMany({
      where: searchTerm
        ? {
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          }
        : undefined,
    });
    res.json(movies);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const createMovie = async (req, res) => {
  try {
    const { title, description, rating, releaseYear } = req.body;
    const newMovie = await prisma.movie.create({
      data: {
        title,
        description,
        rating: rating ? parseFloat(rating) : null,
        releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
      },
    });
    res.json(newMovie);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const updateMovie = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, description, rating, releaseYear } = req.body;
    
    const updatedMovie = await prisma.movie.update({
      where: { id },
      data: {
        title,
        description,
        rating: rating ? parseFloat(rating) : null,
        releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
      },
    });
    res.json(updatedMovie);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deletedMovie = await prisma.movie.delete({
      where: { id },
    });
    res.json(deletedMovie);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};
