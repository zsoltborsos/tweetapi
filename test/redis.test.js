const redis = require("../services/redis");

afterAll( async () => {
  await redis.closeClient();
});

const tweets = [
	{
    id: '1535654092399333376',
    text: 'RT @AdoptCCAnimals: #Dog #Elvis_CCSTCA_20 I’m great at SIT …. https://t.co/5CxAW346M0 https://t.co/NDIwtdzaxC'
  },
  {
    id: '1535654028989718530',
    text: 'RT @AdoptCCAnimals: #Dog #Cadillac_CCSTCA_01 https://t.co/FTYqqeo68J https://t.co/3vslX6X4fC'
  },
  {
    id: '1535654025563086849',
    text: 'RT @elliestreasures: Happy #SaturdayMorning folks!\n' +
      'Adorable puppy #dog themed clip #accessory in cheerful sunny colours. \n' +
      'A delightfully un…'
  }
];

test('set a hashtag as hash', async () => {
	try {
		const response = await redis.setTweets("myHashTag1", tweets);
		expect(response).toBe(true);
	}catch(err) {
		console.log("Could not run test... -> ", err);
	}
});

test('get tweets for a hashtag', async () => {
	try {
		const response = await redis.getTweets("myHashTag1");
		console.log("response -> ", response);
		expect(response.length).not.toBe(0);
	}catch(err) {
		console.log("Could not run test... -> ", err);
	}
});

test('add tweet to active tweets counter', async () => {
	try {
		const response = await redis.addActiveHashtag("testTag");
		console.log("response -> ", response);
		expect(response).not.toBe(false);
	}catch(err) {
		console.log("Could not run test... -> ", err);
	}
});

test('get active tweets counter', async () => {
	try {
		const response = await redis.getActiveHashtagsCounter();
		console.log("response -> ", response);
		expect(response).not.toBe(false);
	}catch(err) {
		console.log("Could not run test... -> ", err);
	}
});

test('reset active tweets counter', async () => {
	try {
		const response = await redis.resetActiveHashtags();
		console.log("response -> ", response);
		expect(response).toBe(true);
	}catch(err) {
		console.log("Could not run test... -> ", err);
	}
});

test('set rate limit timer', async () => {
	try {
		const response = await redis.setRateLimitTimer(1234314);
		console.log("response -> ", response);
		expect(response).toBe(true);
	}catch(err) {
		console.log("Could not run test... -> ", err);
	}
});

test('get rate limit timer', async () => {
	try {
		const response = await redis.getRateLimitTimer();
		console.log("response -> ", response);
		expect(response).toBe("1234314");
	}catch(err) {
		console.log("Could not run test... -> ", err);
	}
});