const redis = require("redis");
const client = process.env.REDIS_URL ? redis.createClient({ url: process.env.REDIS_URL }) : redis.createClient();

client.on("error", (err) => {
  console.log(`Error ${err}`);
});

client.connect();

exports.closeClient = async () => {
  await client.quit();
};

exports.setTweets = async (hashtag, tweets) => {
  try {
    const response = await client.hSet(hashtag, Date.now(), JSON.stringify(tweets), redis.print);
    if (response) {
      return true;
    }
    return false;
  }catch(err) {
    console.log("Error while writing to redis -> ", err);
    return false;
  }
};

exports.getTweets = async (hashtag) => {
  try {
    const latesKey = await getLatestKey(hashtag);
    if (latesKey) {
      const response = await client.hGet(hashtag, latesKey.toString());
      if (response) {
        return {
          createdAt: latesKey,
          tweets: response
        };
      }
    }
    return false;
  }catch(err) {
    console.log("Error while getting key from redis -> ", err);
    return false;
  }
};

exports.setRateLimit = async (rateLimit) => {
  try {
    const toSave = {
      rateLimit: rateLimit,
      lastCall: Date.now()
    };
    const response = await client.set("rateLimit", JSON.stringify(toSave));
    if (response) {
      return true;
    }
    return false;
  }catch(err) {
    console.log("Error while writing params to redis -> ", err);
    return false;
  }
};

exports.getRateLimit = async () => {
  try {
    const response = await client.get("rateLimit");
    if (response) {
      return JSON.parse(response);
    }
    return false;
  }catch(err) {
    console.log("Error while getting params from redis -> ", err);
    return false;
  }
};

exports.addActiveHashtag = async (hashtag) => {
  try {
    const response = await client.sAdd("activeHashtags", hashtag);
    if (response) {
      // console.log("Active tweet counter increased...");
      return true;
    }
    if (response === 0) {
      console.log("This hashtag is already in the active list!");
      return true;
    }
    console.log("Something went wrong... Could not increase active tweet counter...");
    return false;
  }catch(err) {
    console.log("Could not add active tweet to redis... -> ", err);
    return false;
  }
};

exports.resetActiveHashtags = async () => {
  try {
    const response = await client.del("activeHashtags");
    if (response) {
      // console.log("Reset active tweet counter...");
      return true;
    }
    console.log("Something went wrong... Could not reset active tweet counter...");
    return false;
  }catch(err) {
    console.log("Could not reset active tweet counter... -> ", err);
    return false;
  }
};

exports.getActiveHashtagsCounter = async () => {
  try {
    const response = await client.sCard("activeHashtags");
    if (response) {
      // console.log("Active tweets counter -> ", response);
      return response;
    }
    console.log("Something went wrong... Could not get active tweet counter...");
    return false;
  }catch(err) {
    console.log("Could not get active tweet counter... -> ", err);
    return false;
  }
};

exports.setRateLimitTimer = async (time) => {
  try {
    const response = await client.set("rateLimitTimer", time);
    if (response) {
      // console.log("Rate limit timer updated -> ", response);
      return true;
    }
    console.log("Something went wrong... Could not set rate limit timer...");
    return false;
  }catch(err) {
    console.log("Could not set rate limit timer... -> ", err);
    return false;
  }
};

exports.getRateLimitTimer = async () => {
  try {
    const response = await client.get("rateLimitTimer");
    if (response) {
      // console.log("Got rate limit timer -> ", response);
      return response;
    }
    console.log("Something went wrong... Could not get rate limit timer...");
    return false;
  }catch(err) {
    console.log("Could not get rate limit timer... -> ", err);
    return false;
  }
};

const getKeys = async (hash) => {
  try {
    const response = await client.hKeys(hash);
    if (response) {
      return response;
    }
    return false;
  }catch(err) {
    console.log(`Could not get keys for hash ${hash} -> `, err);
    return false;
  }
};

const getLatestKey = async (hash) => {
  try{
    const keys = await getKeys(hash);
    if (keys) {
      const keysAsnumbers = keys.map(Number);
      const latestKey = Math.max(...keysAsnumbers);
      return latestKey;
    }
    return false;
  }catch(err) {
    console.log(`Could not get latest key for hash ${hash} -> `, err);
    return false;
  }
};

