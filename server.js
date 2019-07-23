const express = require('express')
const app = express()
const request = require('request')
const cheerio = require('cheerio')
const logger = require('./middleware/logger')
const port = process.env.PORT || 5000


let currentPageOfMovies = []
const serverLog = []

app.set('view engine', 'ejs')

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

app.use(logger)
app.use(express.static('public'))


app.get('/search', (req, res) => {
    const { movieSearch } = req.query
    const url = movieDatabaseUrl(movieSearch)
    getMovies(url, (data) => {
        res.render('search', data)
    }, movieSearch, ()=> {
        res.render('error.ejs', {})
    })
})

function movieDatabaseUrl(title) {
    return `https://api.themoviedb.org/3/search/movie?api_key=08b04df70e193c1152b28e7fb114c323&query=${title}`
}

app.get('/', (req, res) => {
    // let url = getMovieDatabaseURL()
    // getMovies(url, (data) => {
    //     res.render('index', data)
    // })
    res.json("TEST");
})

function getMovieDatabaseURL() {
    return "https://api.themoviedb.org/3/movie/now_playing?api_key=08b04df70e193c1152b28e7fb114c323&language=en-US&page=1&region=US"
}

function getMovies(url, renderMovies, movieSearch, noResults) {
    request(url, (error, response, data) => {
        if (!error && response.statusCode === 200 && JSON.parse(data).results.length > 0) {
            currentPageOfMovies = JSON.parse(data).results
            replaceCurrentPOM(currentPageOfMovies)
            const min = shortestMovieOverview(currentPageOfMovies)
            renderMovies({ movies: currentPageOfMovies, min, movieSearch })
        }
        else{
            noResults()
        }
    })
}

app.get('/movie-page/:title', (req, res, next) => {
    const { title } = req.params
    if (title !== 'search') {
        findMovieDetails(title, (data) => {
            res.render('movie', data)
        })
    }
    else next()
})

function findMovieDetails(title, renderMoviePage) {
    const movie = currentPageOfMovies.find((movie) => {
        return movie.title.toLowerCase().replace(/[^\w\s]/gi, "").replace(/\s/g, "-") === title
    })
    renderMoviePage(movie)
}

function detailedMovieUrl(id) {
    return `https://api.themoviedb.org/3/movie/${id}?api_key=08b04df70e193c1152b28e7fb114c323&append_to_response=credits`
}

function replaceCurrentPOM(movies) {
    movies.forEach((movie, index) => {
        request(detailedMovieUrl(movie.id), (error, response, data) => {
            if (!error && response.statusCode === 200) {
                //let cleanTitle = movie.title.toLowerCase().replace(/[^\w\s]/gi, "").replace(/\s/g, "-")
                currentPageOfMovies[index] = JSON.parse(data)
            }
        })
    })
}

function shortestMovieOverview(movies) {
    let min = Infinity
    movies.forEach((movie) => { if (min > movie.overview.length) min = movie.overview.length })
    return Math.round(min * .9)

}