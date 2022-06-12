const TwitterApi = require("twitter-api-v2").default;
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
const roClient = twitterClient.v2.readOnly;

// config values
const tweetsToFetch = 100;

exports.getTweets = async (hashtag) => {
  const params = {
    expansions: "author_id",
    "user.fields": "profile_image_url,username,name",
    "tweet.fields": "author_id,created_at,id,public_metrics,text",
    sort_order: "recency",
    max_results: tweetsToFetch
  };
  try {
    const response = await roClient.search(`#${hashtag}`, params);
    console.log("Rate limit from Twitter -> ", response.rateLimit);
    console.log("Errors in Twitter response -> ", response.errors);
    if (response && response.tweets && response.includes.users) {
      return {
        tweets: combine(response.tweets, response.includes.users),
        rateLimit: response.rateLimit
      };
    }
    return false;
  }catch(err) {
    console.log("Error while calling Twitter API -> ", err);
    if (err.data.errors) {
      console.log("Error ->", err.data.errors);
    }
    return false;
  }
};

const combine = (tweets, users) => {
  const result = [];
  for (const tweet of tweets) {
    const match = users.find(user => {
      return user.id === tweet.author_id;
    });
    if (match) {
      const tweetWithUser = {
        ...tweet,
        ...match
      };
      result.push(tweetWithUser);
    }
  }
  return result;
};
