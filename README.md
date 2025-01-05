# Movies.DB Backend
Movies.DB is a movie database that has the most up-to-date information about trending movies, including streaming options. This is a Node.js REST API back-end application created with an Express.js server. The server is deployed on Vercel with the Hobby plan.

Given the rate limit of 100 daily API calls to the streaming availability API service, server-side caching has been implemented with Redis to avoid repeating API calls for the same movie. Therefore, the application supports providing streaming availability information for 100 unique movies daily.

Check out Movies.DB [here](https://movie-db-phi-peach.vercel.app)!