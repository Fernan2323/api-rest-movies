const express = require('express');
const movies = require('./movies.json');
const crypto = require('node:crypto');
const z = require('zod');
const { validateMovie, validatePartialMovie } = require('./schemas');
const app = express();
app.use(express.json()); // middleware para extraer info de un body
app.disable('x-powered-by');

app.get('/', (req, res) => {
    res.json('<h1>Hola mundo</h1>');
})

const ACCEPTED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:1234',
    'http://movies.com',
]

// todos los recursos que sean MOVIES se identifica con /movies
app.get('/movies', (req, res) => {
    const origin = req.header('origin');
    if(ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin);
    }

    const { genre } = req.query;
    if(genre) {
        const filteredMovies = movies.filter(mov => mov.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        );
        return res.json(filteredMovies);
    }
    res.json(movies);
})

app.get('/movies/:id', (req, res) => {
    const {id} = req.params;
    const movie = movies.find(mov => mov.id === id);
    if(movie) return res.json(movie);
    
    res.status(404).json({message: 'Movie not found'});
})

app.post('/movies', (req, res) => {

    const result = validateMovie(req.body);

    if(result.error) {
        return res.status(400).json({ error: JSON.parse(result.error.message)});
    }

    const newMovie = {
        id: crypto.randomUUID,
        ...result.data
    }
                          
    movies.push(newMovie); // esto no se considera REST porque estamos guardando el estado de la app en memoria

    res.status(201).json(newMovie)
    
})

app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body)
    
    if(result.error) {
        return res.status(400).json({error: JSON.parse(result.error.message)})
    }
    
    
    const {id} = req.params;
    const movieIndex = movies.findIndex(mov => mov.id === id);

    if(movieIndex === -1) {
        return res.status(404).json({message: 'Movie not found'});
    }

   const updateMovie = {
    ...movies[movieIndex],
    ...result.data
   }
    console.log(updateMovie);
    
   movies[movieIndex] = updateMovie;
   
   return res.json(updateMovie);
})

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`);
    
})