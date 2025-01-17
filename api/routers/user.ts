import express from 'express';
import jwt from 'jsonwebtoken';
import { generateAccessToken } from './auth';

const userRouter = express.Router();

// middleware for handling tokens
userRouter.use((req, res, next) => {
    const accessToken = req.headers['authorization']?.split(" ")[1];
    const refreshToken = req.body.token;

    // if refresh token does not exist, user is not signed in
    if (!refreshToken) {
        console.log("User not signed in. Please log in or sign up for an account");
        res.sendStatus(401);
        return;
    }
    else {
        // if refresh token invalid, user access forbidden
        // else if access token invalid, generate new access token for user
        // else if access token valid, route request to intended endpoint
        jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
            if (err) {
                res.status(403).json({
                    error: `Access forbidden: ${err}`
                })
                return;
            }
            jwt.verify(accessToken, process.env.JWT_PUBLIC_KEY, { algorithm: 'RS256' }, (err, accessUser) => {
                // Access token expired
                if (err) {
                    // res.status(401)
                    const newAccessToken = generateAccessToken(user.name);
                    res.locals.access_token = newAccessToken;
                    req.body.username = user.name;
                    next();

                }
                req.body.username = accessUser.name;
            });
            next();
        });
    }
});

// get user favorite movie list
userRouter.get('/favorites', async (req, res) => {
    const username = req.body.username;
    const favorites: String[] = [];

    const { data, error } = await req.supabase
        .from('favorite_movies')
        .select('movie_id')
        .eq('username', username)

    if (error) {
        res.status(400).json({
            error: error
        })
        return;
    }

    if (data.length == 0) {
        res.status(200).json({
            message: `No favorite movie found for user ${username}`
        })
        return;
    }

    for (const entry of data) {
        favorites.push(entry.movie_id || "");
    }

    res.status(200).json({
        result: favorites
    })
    return;

})

// add movie to user favorite movie list
userRouter.post('/favorites', async (req, res) => {
    const username = req.body.username;
    const movieId = req.body.movie_id;

    const { data, error } = await req.supabase
        .from('favorite_movies')
        .upsert({username: username, movie_id: movieId}, {ignoreDuplicates: true})
        .select()

    if (error) {
        res.status(500).json({
            error: error
        })
        return;
    }

    res.status(200).json({
        message: `Movie id ${movieId} added to user ${username} favorites`,
        data: data
    })
    return;

})

// delete movie from user favorite movie list
userRouter.delete('/favorites', async (req, res) => {
    const username = req.body.username;
    const movieId = req.body.movie_id;

    const { data, error } = await req.supabase
        .from('favorite_movies')
        .delete()
        .match({ username: username, movie_id: movieId })
        .select()

    if (error) {
        res.status(500).json({
            error: error
        })
        return;
    }

    if (data.length != 1) {
        res.status(400).json({
            error: `Movie id ${movieId} not found in user ${username} favorite movie list`
        })
        return;
    }

    res.status(200).json({
        message: `Movie id ${movieId} deleted from user ${username} favorite movie list`,
        data: data
    })
    return;

})

export default userRouter;