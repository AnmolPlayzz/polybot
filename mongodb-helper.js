require("dotenv").config()
const username = process.env.MONGO_USER
const pass = process.env.MONGO_PASS
const password = encodeURIComponent(pass)
const url = process.env.MONGO_URL
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${username}:${password}${url}`;
const mongo_client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connectDB() {
    console.log("Connecting to MongoDB...")
    await mongo_client.connect();
}

module.exports = {mongo_client,connectDB }