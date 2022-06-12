# tweetapi

# Before start
Make sure you have a redis instance running locally or have docker installed.

# With docker
	docker pull redis
	docker run -p 6379:6379 --name redis-local -d redis	

# Install dependencies
	npm i

# Create your .env file
	Use the .env.example file to create your .env file and insert your TWITTER_BEARER_TOKEN there.
	
	You can set the REDIS_URL variable in here. If you do, make sure you pass in the whole connection string as Redis expects it. By default, if you don't set this in the .env file it will connect to localhost:6379

# Start the API
	npm start

# Start the API for development
	DEBUG=myapp:* npm start

# Run the tests
	npm test

# How to use
Make a call to http://localhost:3000/tweets/"your hashtag here"

## Configurable values can be found at the top of these files
	services/tweetService.js
	services/twitter.js

# Notes
On the first run you will see some "failed" messages logged out on the server, these are due to the missing redis keys. This could be improved on with an initialization process.

The lot of console logs are left in for easier tracking of what is happening in the code. These should be removed/pruned for production and for some performance gain.

There are only a few tests for the Redis functions and only for happy paths.

The configurable values could be moved to config file for better visibility/ease of use.

The default cache time value can be tuned as required/desired depending on usecases. I have no idea what is the potential expectation of the API, what is the average expected amount of active hashtags and what is the ideal expected refresh rate. Based on that information better tuning for ideal behaviour would be possible. For development these values were sufficient.

Error handling should be improved with more informative error responses for users to know what went wrong.