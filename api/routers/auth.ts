// add "type": "module", to package.json
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const authRouter = express.Router();

export function generateAccessToken(username: String) {
    return jwt.sign({name: username}, process.env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '15m' })
}

export function generateRefreshToken(username: String) {
    return jwt.sign({name: username}, process.env.JWT_REFRESH_KEY)
}

// sign up a new account
authRouter.post('/signup', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    if (!username || !password) {
        res.status(401).json({
            error: "Empty username or password."
        });
        return;
    }

    // hash password 
    const hashedPassword = bcrypt.hashSync(password, Number(process.env.BCRYPT_SALT_ROUNDS));
    
    // retrieve all username and password from db
    const { data, err } = await req.supabase
        .from('users')
        .select()
    
    // check if username and password entry exists in db
    for (const user of data) {
        if (username === user.username) {
            if (hashedPassword === user.password) {
                res.status(400).json({
                    error: 'You have an existing account. Please log in instead.'
                });
                return;
            }
            else {
                res.status(400).json({
                    error: `Username ${username} already exists. Please use a different username`
                });
                return;
            }
        }
    };

    // generate a refresh token for user
    const refreshToken = generateRefreshToken(username);

    // generate an access token for user
    const accessToken = generateAccessToken(username);

    const { error } = await req.supabase
        .from('users')
        .insert({ username: username, password: hashedPassword, refresh_token: refreshToken })

    if (error) {
        res.status(400).json({
            error: error
        });
        return;
    }
    else {
        res.status(200).json({
            access_token: accessToken,
            refresh_token: refreshToken
        });
        return;
    }
})

// login to account
authRouter.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        res.status(401).json({
            error: "Empty username or password."
        });
        return;
    }
    
    // retrieve all username and password from db
    const { data, err } = await req.supabase
        .from('users')
        .select()
        .eq('username', username)
    
    // check if user exists 
    if (data.length != 1) {
        res.status(400).json({
            error: `The account with username ${username} does not exist. Please sign up for a new account.`
        });
        return;
    }

    // check if user password is correct
    if (!bcrypt.compareSync(password, data[0].password)) {
        res.status(403).json({
            error: "The password you provided is incorrect. Please try again."
        })
        return;
    }

    // generate a refresh token for user
    const refreshToken = data[0].refresh_token;

    // generate an access token for user
    const accessToken = generateAccessToken(username);

    res.status(200).json({
        access_token: accessToken,
        refresh_token: refreshToken,
    });
    return;
});

// generate new access token with refresh token
authRouter.post('/token', async (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken) {
        res.status(401).json({
            error: "User not signed in. Please log in or sign up for an account."
        })
    }
    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
        if (err) {
            res.status(403).json({
                error: "Access forbidden."
            })
            return;
        }
        const accessToken = generateAccessToken(user.name);
        res.status(200).json({
            access_token: accessToken
        });
    });
})

// test GET request 
authRouter.get('/test', (req, res) => {
    const accessToken =  req.headers['authorization']?.split(" ")[1];
    const refreshToken =  req.body.token;

    if (!accessToken && !refreshToken) {
        console.log("Not signed in");
        res.sendStatus(403);
        return;
    }

    jwt.verify(accessToken, process.env.JWT_PUBLIC_KEY, { algorithm: 'RS256' }, (err, user) => {
        if (err) {
            console.log(err);
            res.status(401).json({
                error: 'Access token expired. Please use refresh token to generate a new one.'
            })
            return;
        }
        res.status(200).json({
            test: `user ${user.name} authorization request succeeded`
        });
    });
})

export default authRouter;