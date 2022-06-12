const twitter = require("./twitter");
const redis = require("./redis");

// config values
const defaultCacheTime = 20000; // 20 sec
const defaultActiveHashtags = 10;
const defaultRateLimitTimer = 900000; // 15 mins

exports.getTweets = async (hashtag) => {
  try {
    // check stored rate limit
    const storedRateLimit = await redis.getRateLimit();
    
    // debug, should be removed later
    if (storedRateLimit) {
      // console.log("stored rateLimit -> ", storedRateLimit);
      console.log("Elapsed since last call to API -> ", (Date.now() - storedRateLimit.lastCall) / 1000);
    }

    // if we don't have stored rate limit this is most likely a 1st call/new instance. Go to Twitter
    if (!storedRateLimit) {
      console.log("No rate limit... Probably 1st request. Go straight to Twitter API.");
      return getNewTweets(hashtag);
    }

    const latestInRedis = await redis.getTweets(hashtag);
    
    // if we have no requests left and nothing in cache then return a message to try later
    if (storedRateLimit.rateLimit.remaining === 0 && !latestInRedis) {
      console.log("No requests left and no cache available...");
      return "Sorry, we hit our Twitter rate limit... please try again later.";
    }

    // if we don't have any requests left but we have something cached then return that
    if (storedRateLimit.rateLimit.remaining === 0 && latestInRedis) {
      console.log("No requests left but we have cached tweets!");
      return JSON.parse(latestInRedis.tweets);
    }

    // if we have no cache available and we have requests left then go to Twitter API
    if (!latestInRedis) {
      console.log("New hashtag, going to Twitter API...");
      return getNewTweets(hashtag);
    }

    // we have requests available and we have cached tweets, evaluate the state of the cache and see if it should be used
    const storedRateLimitTimer = await redis.getRateLimitTimer();
    console.log("Stored rate limit timer -> ", storedRateLimitTimer);
    
    const storedActiveHashtags = await redis.getActiveHashtagsCounter();
    console.log("Stored active hashtags -> ", storedActiveHashtags);

    const rateLimitTimer = storedRateLimitTimer ? parseInt(storedRateLimitTimer) : defaultRateLimitTimer;
    const activeHashtags = storedActiveHashtags ? storedActiveHashtags : defaultActiveHashtags;
    
    const cacheTime = calculateCacheTime(rateLimitTimer, storedRateLimit.rateLimit.remaining, activeHashtags);
    console.log("Our cache time for this hashtag -> ", cacheTime);

    console.log("Elapsed since last call for this hashtag -> ", (Date.now() - latestInRedis.createdAt) / 1000);
    const cacheOutdated = Date.now() - latestInRedis.createdAt >= cacheTime ? true : false;

    if (cacheOutdated) {
      console.log(`Cache is out of date... getting new tweets for hashtag -->> ${hashtag}`);
      return getNewTweets(hashtag);
    }

    // at this point we just return the cached element, hopefully covering all other scenarios
    console.log(`Cache is OK for hashtag -->> ${hashtag}`);
    return JSON.parse(latestInRedis.tweets);
  }catch(err) {
    console.log("Failed to get tweets... please try it later?! -> ", err);
    throw new Error("Something went wrong... Please try it again later...", err);
  }
};

const calculateCacheTime = (rateLimitTimer, rateLimit, activeHashtags) => {
  // using this simple formula to try to calculate ideal cache time
  // use a buffer in case of a lot of new hashtags are requested in a short period
  const rateLimitTimeLeft = Date.now() - rateLimitTimer;
  const buffer = 5000;
  const cacheTime = Math.floor( (rateLimitTimeLeft / rateLimit) * activeHashtags + buffer );
  console.log("Calculated cache time -> ", cacheTime);
  // use the default cache time as a fail safe if we are not too busy.
  // set the default to a low number or 0 if you want the calculation to work all the time.
  return cacheTime > defaultCacheTime ? cacheTime : defaultCacheTime;
};

const getNewTweets = async (hashtag) => {
  try{
    const response = await twitter.getTweets(hashtag);
    if (response && response.tweets.length > 0) {
      saveTweetsDetails(hashtag, response);
      return response.tweets;
    }
    return false;
  }catch(err) {
    console.log("Could not get new tweets from twitter... ->", err);
    return false;
  }
};

const saveTweetsDetails = async (hashtag, newTweets) => {
  try {
    const tweetsResponse = await saveTweets(hashtag, newTweets.tweets);
    if (tweetsResponse) {
      console.log(`Cache refreshed with tweets for hashtag -> ${hashtag}`);
    }else {
      console.log(`Failed to refresh cache in redis for hashtag -> ${hashtag}`);
    }
    const detailsResponse = await updateDetails(hashtag, newTweets.rateLimit);
    if (detailsResponse) {
      console.log(`Details updated for hashtag -> ${hashtag}`);
    } else {
      console.log(`Failed to update details for hashtag -> ${hashtag}`);
    }
    if (tweetsResponse && detailsResponse){
      console.log("Tweet details updated successfully.");
      return true;
    }
    console.log("Failed to save tweet details to Redis...");
    return false;
  }catch(err) {
    console.log("Could not save tweets and details to Redis... Oops... -> ", err);
    return false;
  }
};

const saveTweets = async (hashtag, tweets) => {
  try {
    const response = await redis.setTweets(hashtag, tweets);
    if (response) {
      // console.log(`Cache refreshed with tweets for hashtag -> ${hashtag}`);
      return true;
    }
    console.log(`Failed to refresh cache in redis for hashtag -> ${hashtag}`);
    return false;
  }catch(err) {
    console.log("Could not save tweets to Redis... Oops... -> ", err);
  }
};

const updateDetails = async (hashtag, rateLimit) => {
  try {
    // check rate limit, if 1st call or stored timer is older than 15 mins then update timer with current time and reset active hashtag counter
    // 2nd part probably can't happen as rate limit resets after 15 mins... but keep it in as a fail safe option/potential edge cases
    const storedRateLimitTimer = await redis.getRateLimitTimer();
    const rateLimitTimer = storedRateLimitTimer ? parseInt(storedRateLimitTimer) : null;
    let timerResponse = true;
    let hashtagResetResponse = true;
    if ((rateLimit.limit - rateLimit.remaining) === 1 || (rateLimitTimer && (Date.now() - rateLimitTimer) > 900000)) {
      timerResponse = await redis.setRateLimitTimer(Date.now());
      if (timerResponse) {
        console.log("Rate limit timer updated.");
      }else {
        console.log("Failed to update rate limit timer.");
      }
      hashtagResetResponse = await redis.resetActiveHashtags();
      if (hashtagResetResponse) {
        console.log("Hashtag counter reset.");
      }else {
        console.log("Failed to reset hashtag counter.");
      }
    }

    // update active hashtag counter
    const activeHashtagResponse = await redis.addActiveHashtag(hashtag);
    if (activeHashtagResponse) {
      console.log("Active hashtag counter updated.");
    } else {
      console.log("Failed to update active hashtag counter.");
    }

    // update rate limit
    const rateLimitResponse = await redis.setRateLimit(rateLimit);
    if (rateLimitResponse) {
      console.log("Rate limit updated.");
    }else {
      console.log("Failed to update rate limit.");
    }
    
    // give some indication on success/fail
    if (timerResponse && hashtagResetResponse && rateLimitResponse && activeHashtagResponse) {
      return true;
    }
    return false;
  }catch(err) {
    console.log("Could not update details in redis! -> ", err);
    return false;
  }
};
