import { config } from "dotenv";
import { TwitterApi } from "twitter-api-v2";
import NewsAPI from "newsapi";

config();

// Twitter/X client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// ----------------- createPost Tool -----------------
async function createPost(status) {
  const newPost = await twitterClient.v2.tweet(status);
  console.log("newPost", newPost);

  return `Tweeted: ${status}`;
}

// ----------------- fetchNews Tool -----------------
 async function fetchNews({ query = "technology" }) {
  const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

  const response = await newsapi.v2.everything({
    q: query,
    language: "en",
    sortBy: "relevancy",
    pageSize: 5, // top 5 articles
  });

  if (response.status === "ok" && response.articles.length > 0) {
    const topArticles = response.articles
      .map((a, i) => `${i + 1}. ${a.title} (${a.source.name})`)
      .join("\n");
    return `Top news articles:\n${topArticles}`;
  } else {
    return "No news found for the given query.";
  }
}

export default { createPost, fetchNews };