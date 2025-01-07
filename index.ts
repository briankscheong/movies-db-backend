import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import moviesRouter from './routes/movies.ts';

dotenv.config();
const app = express();

declare global {
    namespace Express {
        interface Request {
            redis?: any;  // Optional property 'redis' attached to the request object
        }
    }
}

console.log(process.env.FRONTEND_URL)
console.log(process.env.GITHUB_FRONTEND_URL)

// const bodyParser = require('body-parser');
// Create application/x-www-form-urlencoded parser
// const urlencodedParser = bodyParser.urlencoded({ extended: false });

// set up redis client
const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_SOCKET_HOST,
        port: Number(process.env.REDIS_SOCKET_PORT),
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