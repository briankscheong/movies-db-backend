const express = require('express')
const app = express()
const port = 3001
const fetch = require('node-fetch');
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL
}));

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/movies', async (req, res) => {
    const url = 'https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1';
    const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${process.env.BEARER_TOKEN}`
        }
    };
    
    const movieRes = await fetch(url, options)
        .then(response => response.json())
        .then(json => {
            console.log(json)
            res.json(json)
        })
        .catch(err => console.error('error:' + err));

})

app.get('/movie/:id/streaming-options', async (req, res) => {
  const id = req.params.id;
  const url = `https://streaming-availability.p.rapidapi.com/shows/movie/${id}?series_granularity=show&output_language=en`;
  const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPID_API_KEY,
        'x-rapidapi-host': 'streaming-availability.p.rapidapi.com'
      }
  };

  const movieRes = await fetch(url, options)
      .then(response => response.json())
      .then(json => {
          console.log(json)
          res.json(json)
      })
      .catch(err => console.error('error:' + err));

})

app.listen(process.env.PORT || port, () => {
  console.log(`App listening on port ${process.env.PORT || port}`)
})