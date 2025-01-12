import express from 'express';

const movieRouter = express.Router();

movieRouter.get('/trending', async (req, res) => {
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
            console.log('Trending movies request succeeded. Sending JSON response back to front end server.')
            res.json(json)
        })
        .catch(err => console.error('error:' + err));
})

movieRouter.get('/popular', async (req, res) => {
    const page = parseInt(String(req.query.page)) || 1;
    const url = `https://api.themoviedb.org/3/movie/popular?language=en-US&page=${page}`;
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
            console.log('Popular movies request succeeded. Sending JSON response back to front end server.')
            res.json(json)
        })
        .catch(err => console.error('error:' + err));
})

movieRouter.get('/top-rated', async (req, res) => {
    const page = parseInt(String(req.query.page)) || 1;
    const url = `https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${page}`;
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
            console.log('Top Rated movies request succeeded. Sending JSON response back to front end server.')
            res.json(json)
        })
        .catch(err => console.error('error:' + err));
})

movieRouter.get('/upcoming', async (req, res) => {
    const page = parseInt(String(req.query.page)) || 1;
    const url = `https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=${page}`;
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
            console.log('Upcoming movies request succeeded. Sending JSON response back to front end server.')
            res.json(json)
        })
        .catch(err => console.error('error:' + err));
})

movieRouter.get('/:id/video', async (req, res) => {
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
            console.log('Movie video fetched successfully. Sending JSON response back to front end server.')
            res.json(json)
        })
        .catch((err) => console.error("Failed to fetch movie video: ", err));
})

movieRouter.get('/:id/streaming-options', async (req, res) => {
    const id = req.params.id;
    const cacheId = `movie-info:${id}`;

    try {
        // check if streaming options for a movie is in cache
        const result = await req.redis.json.get(cacheId);

        if (result !== null) {
            console.log("cache hit " + cacheId)
            res.json(result)
        }
        else {
            console.log("cache miss " + cacheId)
            const url = `https://streaming-availability.p.rapidapi.com/shows/movie/${id}?series_granularity=show&output_language=en`;
            const rapid_api_key = process.env.RAPID_API_KEY || "";
            const options = {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': rapid_api_key,
                    'x-rapidapi-host': 'streaming-availability.p.rapidapi.com'
                }
            };
    
            await fetch(url, options)
                .then(response => response.json())
                .then(async json => {
                    // add streaming options result to cache
                    await req.redis.json.set(cacheId, "$", json)
                    await req.redis.expire(cacheId, 86400)
                    console.log("Movie " + id + " info cached with key " + cacheId + ". Cache expires in 24 hrs.")
                    res.json(json)
                })
                .catch(err => console.error('error: ' + err));
        }
    }
    catch (err) {
        console.error('error: ' + err);
    }

})

export default movieRouter; 