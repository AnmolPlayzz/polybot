require("dotenv").config();
const { Events } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const { mongo_client } = require("../mongodb-helper")
const { calculateXp } = require("../helpers")
const { lvlUpMsg } = require("../messages.json")

function randomInteger(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
const COOLDOWN_TIME=10_000;
module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message) {
		const userId = message.author.id;
		const guildId = message.guildId;

		if (!message.client.cooldowns) {
			message.client.cooldowns = new Map();
		}

        const db = mongo_client.db("polybot");
		const collection = db.collection('rank_server');
		const data = await collection.find({ guildId: message.guildId }).toArray()
		if (data.length>0 && !message.author.bot) {

			const cooldown = message.client.cooldowns.get(`${userId}${guildId}`);

			if (cooldown && (Date.now() < cooldown.expiresAt)) {
				return;
			}

			const collectionUser = db.collection('rank_user');
			const [dataUser] = await collectionUser.aggregate([
				{
					$match: {
						userId: `${userId}`,
						levels: { $elemMatch: { serverId: `${guildId}` } }
					}
				},
				{
					$unwind: "$levels" // Deconstruct the levels array into separate documents
				},
				{
					$match: { "levels.serverId": `${guildId}` } // Filter again for exact serverId match
				},
				{
					$project: {
						_id: 0, // Exclude unnecessary _id field
						levelData: "$levels" // Project only the desired level object
					}
				}
			]).toArray()
			const dataUserOverall = await collectionUser.find({userId: userId}).toArray()
			if(dataUser || dataUserOverall.length>0) {
				const addedXp = dataUser ? Number(dataUser.levelData.totalXp) + randomInteger(14,16) : randomInteger(14,16);
				const currentLevel = dataUser ? Number(dataUser.levelData.level) : 0
				let addedLevel = 0;
				if(addedXp >= calculateXp( currentLevel + 1) && dataUser) {
					addedLevel = Number(dataUser.levelData.level)+1
					const randomMsg = lvlUpMsg[Math.floor(Math.random()*lvlUpMsg.length)]
					const msg = randomMsg.replace("{user}",`<@!${userId}>`).replace("{level}",`${addedLevel}`)
					try {
						await message.channel.send(msg)
					} catch (e) {
						console.log(e)
					}
				} else if(dataUser) {
					addedLevel = Number(dataUser.levelData.level)
				}
				let filter = dataUser ? {
					userId: `${userId}`,
					levels: { $elemMatch: { serverId: `${guildId}` } }
				} : {
					userId: `${userId}`,
				};
				let updater = dataUser ? {
					$set: { "levels.$": { // Update the matched element within the levels array
							serverId: `${guildId}`, // Update serverId if needed (optional)
							totalXp: `${addedXp}`,
							level: `${addedLevel}`
						} }
				} : {
					$push: {
						levels: {
							serverId: `${guildId}`,
							totalXp: `${addedXp}`,
							level: `${addedLevel}`
						}
					}
				};
				const update= await collectionUser.updateOne(
					filter,
					updater
				);
			} else {
				const addedXp = randomInteger(14,16);
				const addedLevel = 0
				await collectionUser.insertOne({
					"userId": `${userId}`,
					"levels": [
						{
							"serverId": `${guildId}`,
							"totalXp": `${addedXp}`,
							"level": `${addedLevel}`
						}
					]
				});
			}
			message.client.cooldowns.set(`${userId}${guildId}`, {
				expiresAt: Date.now() + COOLDOWN_TIME
			});

			await wait(COOLDOWN_TIME);
			message.client.cooldowns.delete(`${userId}${guildId}`);
		}
	},
};
