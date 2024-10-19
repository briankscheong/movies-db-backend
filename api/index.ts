require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
// const bodyParser = require('body-parser');

// Create application/x-www-form-urlencoded parser
// const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(cors({origin: process.env.FRONTEND_URL}));
console.log(process.env.FRONTEND_URL);
app.use(express.static('public'));

app.get('/', (req, res) => {
res.send('Hello World!')
})

app.get('/movies/trending', async (req, res) => {
    const url = 'https://api.themoviedb.org/3/trending/movie/day?language=en-US';
    const options = {
        method: 'GET',
        headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.BEARER_TOKEN}`
        }
    };
    
    await fetch(url, options)
        .then(response => response.json())
        .then(json => {
            console.log(json)
            res.json(json)
        })
        .catch(err => console.error('error:' + err));
})

app.get('/movies/popular', async (req, res) => {
    const url = 'https://api.themoviedb.org/3/movie/popular?language=en-US&page=1';
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${process.env.BEARER_TOKEN}`
        }
    };

    await fetch(url, options)
        .then(response => response.json())
        .then(json => {
            console.log(json)
            res.json(json)
        })
        .catch(err => console.error('error:' + err));
})

app.get('/movies/top-rated', async (req, res) => {
    const url = 'https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=1';
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${process.env.BEARER_TOKEN}`
        }
    };

    await fetch(url, options)
        .then(response => response.json())
        .then(json => {
            console.log(json)
            res.json(json)
        })
        .catch(err => console.error('error:' + err));
})

app.get('/movies/upcoming', async (req, res) => {
    const url = 'https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=1';
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${process.env.BEARER_TOKEN}`
        }
    };

    await fetch(url, options)
        .then(response => response.json())
        .then(json => {
            console.log(json)
            res.json(json)
        })
        .catch(err => console.error('error:' + err));
})

app.get('/movie/:id/video', async(req, res) => {
    const id = req.params.id;
    const url = `https://api.themoviedb.org/3/movie/${id}/videos?language=en-US`;
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${process.env.BEARER_TOKEN}`
        }
    };

    await fetch(url, options)
        .then(response => response.json())
        .then((json) => {
        console.log(json)
        res.json(json)
        })
        .catch((err) => console.error("Failed to fetch movie video: ", err));
})

app.get('/movie/:id/streaming-options', async (req, res) => {
    const id = req.params.id;
    const url = `https://streaming-availability.p.rapidapi.com/shows/movie/${id}?series_granularity=show&output_language=en`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': process.env.RAPID_API_KEY as string,
            'x-rapidapi-host': 'streaming-availability.p.rapidapi.com'
        }
    };

    await fetch(url, options)
        .then(response => response.json())
        .then(json => {
            res.json(json)
        })
        .catch(err => console.error('error:' + err));
})

app.listen(process.env.PORT || 3001, () => {
    console.log(`App listening on port ${process.env.PORT || 3001}`)
});

module.exports = app;