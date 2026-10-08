# Movie Time 🎬

A full-stack web application for tracking and managing your favorite movies. Built with a modern tech stack, this project features a clean, responsive UI, seamless data fetching and caching, and a robust backend API.

## 📸 Screenshots

![Home Page UI](https://via.placeholder.com/800x450?text=Home+Page+Screenshot)
<br/>
![Add Movie Form](https://via.placeholder.com/800x450?text=Add+Movie+Screenshot)

## ✨ Features

- **Full CRUD Functionality**: Add, view, edit, and delete movie entries.
- **Instant Search**: Search movies by title with a debounced input that queries the database efficiently.
- **Optimistic UI Updates**: Powered by TanStack React Query for seamless caching and instant UI feedback upon mutations without manual page reloads.
- **Modern Responsive Design**: Styled using Tailwind CSS to look great on any device.
- **Robust Data Management**: Uses Prisma ORM to safely interact with a PostgreSQL database.

## 🛠️ Tech Stack

**Frontend:**
- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS v3](https://tailwindcss.com/)
- [React Router v7](https://reactrouter.com/)
- [TanStack React Query v5](https://tanstack.com/query/latest)

**Backend:**
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- Node.js (v18+)
- PostgreSQL (v15+)

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd movie_time
```

### 2. Backend Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your environment variables:
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update the `DATABASE_URL` in your new `.env` file with your actual PostgreSQL connection string.
3. Push the Prisma schema to your database and generate the client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

### 3. Frontend Setup
1. Navigate to the client directory and install dependencies:
   ```bash
   cd client
   npm install
   ```

## 🏃‍♂️ Running the Application

You will need two separate terminal windows to run both the frontend and the backend simultaneously.

**Terminal 1 (Backend Server):**
```bash
# From the root of the movie_time directory
node server.js
# Or use nodemon if you have it installed:
# nodemon server.js
```
*The server will start on http://localhost:3000.*

**Terminal 2 (Frontend React App):**
```bash
# From the movie_time/client directory
npm run dev
```
*Vite will start the dev server, typically on http://localhost:5173.*

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/movies` | Fetch all movies. Supports `?search=keyword` for filtering by title. |
| `POST` | `/api/movies` | Create a new movie. |
| `PATCH` | `/api/movies/:id` | Update an existing movie's details. |
| `DELETE` | `/api/movies/:id` | Delete a movie from the database. |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ for movie lovers.*
