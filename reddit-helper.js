require('dotenv').config();
const snoowrap = require('snoowrap');

const r = new snoowrap({
    userAgent: process.env.REDDIT_UA,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN
});

module.exports.r=r