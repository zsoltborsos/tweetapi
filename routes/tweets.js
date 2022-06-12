const express = require("express");
const router = express.Router();
const tweetService = require("../services/tweetService");

router.get("/", (req, res, next) => {
  res.json("Tweet API. Pass in a hashtag to get tweets.");
});

router.get("/:hashtag", async (req, res, next) => {
  if (req.params.hashtag) {
    try {
      const response = await tweetService.getTweets(req.params.hashtag);
      if (response) {
        res.json(response);
      }else {
        res.json("Could not get tweets for this hashtag...");
      }
    }catch(err) {
      console.log("Something went wrong! -> ", err);
      res.status(500).json("Something went wrong..." + err);
    }
  }else {
    res.json("You did not pass in a parameter yet you ended up here?");
  }
});

module.exports = router;
