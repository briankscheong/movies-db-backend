import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createClient as createRedisClient } from 'redis';
import movieRouter from './routers/movies'; 
import { createClient as createDatabaseClient } from '@supabase/supabase-js'

dotenv.config();
const app = express();
app.use(express.json());

declare global {
    namespace Express {
        interface Request {
            redis?: any;
            supabase?: any;
        }
    }
}

// set up postgres db client
const supabaseClient = createDatabaseClient(
    process.env.SUPABASE_URL || "", 
    process.env.SUPABASE_KEY || ""
);

// set up redis client
const redisClient = createRedisClient({
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

redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.connect()
    .then(() => console.log('Connected to Redis'))
    .catch(err => console.error('Error connecting to Redis:', err));

app.use(cors({ origin: [process.env.FRONTEND_URL, process.env.GITHUB_FRONTEND_URL] }));
app.use(express.static('public'));

// Use middleware to attach the Redis client to the request object
app.use((req, res, next) => {
    req.redis = redisClient;
    req.supabase = supabaseClient;
    next();
});

app.use('/movies', movieRouter);

app.listen(process.env.PORT || 3001, () => {
    console.log(`App listening on port ${process.env.PORT || 3001}`)
});

export default app;