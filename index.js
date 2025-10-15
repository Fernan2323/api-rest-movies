const express = require("express")
const crypto = require("node:crypto")
const moviesJSON = require("./movies.json") // en commonJS se puede importar y usar json directamente
const { validateMovie, validatePartialMovie } = require("./schemas/movies")

const app = express()
app.use(express.json())
app.disable("x-powered-by")

// Métodos comunes: GET/HEAD/POST
// Métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight - métodos complejos
// OPTIONS
const ACCEPTED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:1234"
]

app.use(express.json())

app.get("/", (req, res) => {
  res.json({ message: "Hola mundo" })
})

app.get("/movies", (req, res) => {
  const origin = req.header("origin")
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin)
  }

  const { genre } = req.query
  if (genre) {
    const filteredMovies = moviesJSON.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )

    return res.json(filteredMovies)
  }
  res.json(moviesJSON)
})

app.get("/movies/:id", (req, res) => {
  const { id } = req.params
  const movie = moviesJSON.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: "Movie not found " })
})

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  // Esto no sería REST porque estamos guardando
  // el estado de la app en memoria
  moviesJSON.push(newMovie)

  res.status(201).json(newMovie)
})

app.delete("/movies/:id", (req, res) => {
  const origin = req.header("origin")
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin)
  }

  const { id } = req.params
  const movieIndex = moviesJSON.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: "movie not found" })
  }

  moviesJSON.splice(movieIndex, 1)

  return res.json({ message: "movie deleted" })
})

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = moviesJSON.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" })
  }

  const updateMovie = {
    ...moviesJSON[movieIndex],
    ...result.data
  }

  moviesJSON[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.options("/movies/:id", (req, res) => {
  const origin = req.header("origin")
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin)
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE")
  }
  res.send(200)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Server running on port: http://localhost:${PORT}`)
})

