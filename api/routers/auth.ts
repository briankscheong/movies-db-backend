// add "type": "module", to package.json
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const authRouter = express.Router();

export function generateAccessToken(username: String) {
    return jwt.sign({name: username}, process.env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '15m' })
}

export function generateRefreshToken(username: String) {
    return jwt.sign({name: username}, process.env.JWT_REFRESH_KEY, { expiresIn: '7d'})
}

// sign up a new account
authRouter.post('/signup', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const uuid = crypto.randomUUID();
    
    if (!username || !password) {
        res.status(401).json({
            error: "Empty username or password."
        });
        return;
    }

    // hash password 
    const hashedPassword = bcrypt.hashSync(password, Number(process.env.BCRYPT_SALT_ROUNDS));
    
    // retrieve all username and password from db
    const { data: getUserData, error: getUserError } = await req.supabase
        .from('users')
        .select()

    if (getUserError) {
        res.status(400).json({
            error: getUserError
        });
        return;
    }
    
    // check if username and password entry exists in db
    if (getUserData !== undefined) {
        for (const user of getUserData) {
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
    }

    // generate a refresh token for user
    const now = new Date();
    const timestampNow = now.toISOString();
    const timestampExpirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    const refreshToken = generateRefreshToken(username);

    // generate an access token for user
    const accessToken = generateAccessToken(username);

    const { error: insertUserError } = await req.supabase
        .from('users')
        .insert({ id: uuid, username: username, password: hashedPassword })

    if (insertUserError) {
        res.status(400).json({
            error: insertUserError
        });
        return;
    }

    const { error: authUserError } = await req.supabase
        .from('user_auth')
        .insert([{ user_id: uuid, refresh_token: refreshToken, created_at: timestampNow, expires_at: timestampExpirationDate }])

    if (authUserError) {
        res.status(400).json({
            error: authUserError
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
    const { data: getUserData, error: getUserError } = await req.supabase
        .from('users')
        .select()
        .eq('username', username)

    if (getUserError) {
        res.status(400).json({
            error: getUserError
        });
        return;
    }
    
    // check if user exists 
    if (getUserData.length != 1) {
        res.status(400).json({
            error: `The account with username ${username} does not exist. Please sign up for a new account.`
        });
        return;
    }

    // check if user password is correct
    if (!bcrypt.compareSync(password, getUserData[0].password)) {
        res.status(403).json({
            error: "The password you provided is incorrect. Please try again."
        })
        return;
    }

    const { data: getUserAuthData, error: getUserAuthError } = await req.supabase
        .from('user_auth')
        .select()
        .eq('user_id', getUserData[0].id)

    if (getUserAuthError) {
        res.status(400).json({
            error: getUserAuthError
        });
        return;
    }
    
    let activeRefreshToken = "";

    if (getUserAuthData.length >= 1) {
        for (const auth of getUserAuthData) {
            if (new Date().toISOString() > auth.expires_at) {
                const { error: deleteUserAuthError } = await req.supabase
                    .from('user_auth')
                    .delete()
                    .or(`expires_at.eq.${auth.expires_at},and(user_id.eq.${auth.id})`)
                if (deleteUserAuthError) {
                    res.status(400).json({
                        error: deleteUserAuthError
                    });
                    return;
                }
                else {
                    console.log(`successfully deleted expired refresh token for user ${auth.id}`);
                }
            }
            else {
                activeRefreshToken = auth.refresh_token;
                console.log(`found an active refresh token for user ${auth.id}`)
            }
        }
    }

    if (activeRefreshToken !== "") {
        const accessToken = generateAccessToken(username);
        res.status(200).json({
            access_token: accessToken,
            refresh_token: activeRefreshToken,
        });
        return;
    }

    // generate a refresh token for user
    const refreshToken = generateRefreshToken(username);

    // generate an access token for user
    const accessToken = generateAccessToken(username);

    res.status(200).json({
        access_token: accessToken,
        refresh_token: refreshToken,
    });
    return;
});

authRouter.delete('/logout', async (req, res) => {
    const refreshToken = req.body.token;
    const { error } = await req.supabase
        .from('user_auth')
        .delete()
        .eq('refresh_token', refreshToken)

    if (error) {
        res.status(400).json({
            error: error
        });
        return;
    }
    else {
        res.status(200).json({
            message: "successfully logged out"
        });
        return;
    }
})

// generate new access token with refresh token
authRouter.post('/token', async (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken) {
        res.status(401).json({
            error: "User not signed in. Please log in or sign up for an account."
        })
    }

    const { data, error } = await req.supabase
        .from('user_auth')
        .select()
        .eq('refresh_token', refreshToken)

    if (error) {
        res.status(400).json({
            error: error
        });
        return;
    }

    if (data.length == 0) {
        res.status(403).json({
            error: "refresh token not found. Access forbidden."
        })
        return;
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
        console.log("User not signed in");
        res.status(403).json({
            error: 'User not signed in'
        });
        return;
    }

    jwt.verify(accessToken, process.env.JWT_PUBLIC_KEY, { algorithm: 'RS256' }, (err, user) => {
        if (err) {
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