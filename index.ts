require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const { createClient } = require('redis');
const moviesRouter = require('./routes/movies.ts');

// const bodyParser = require('body-parser');
// Create application/x-www-form-urlencoded parser
// const urlencodedParser = bodyParser.urlencoded({ extended: false });

// set up redis client
const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_SOCKET_HOST,
        port: process.env.REDIS_SOCKET_PORT,
        reconnectStrategy: function(retries) {
            if (retries > 20) {
                console.log("Too many attempts to reconnect. Redis connection was terminated");
                return new Error("Too many retries.");
            } else {
                return retries * 500;
            }
        }
    }
});

client.on('error', err => console.log('Redis Client Error', err));

client.connect()
    .then(() => console.log('Connected to Redis'))
    .catch(err => console.error('Error connecting to Redis:', err));

app.use(cors({ origin: [process.env.FRONTEND_URL, process.env.GITHUB_FRONTEND_URL] }));
app.use(express.static('public'));

// Use middleware to attach the Redis client to the request object
app.use((req, res, next) => {
    req.redis = client;
    next();
});

app.use('/movies', moviesRouter);

app.listen(process.env.PORT || 3001, () => {
    console.log(`App listening on port ${process.env.PORT || 3001}`)
});

module.exports = app;