const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {pager} = require("../../helpers")
const {mongo_client} = require("../../mongodb-helper");
module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Returns the leaderboard data of this server.'),
    async execute(interaction, client) {
        const db = mongo_client.db("polybot");
        const guildId = interaction.guild.id;
        const collectionServer = db.collection('rank_server');
        const rankStatus = await collectionServer.findOne({guildId: `${guildId}`});
        if (!rankStatus) {
            await interaction.reply("The rank module is disabled on this server.")
            return;
        }
        const collection = db.collection('rank_user');
        const dataLeaderboardFetch = await collection.aggregate([
            {
                $match: {
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
                    levelData: "$levels", // Project only the desired level object
                    userId: 1
                },
            }
        ]).toArray()
        const dataLeaderboard = dataLeaderboardFetch.sort((a,b) => {
            if (Number(a.levelData.totalXp) > Number(b.levelData.totalXp)) {
                return -1
            } else if (Number(a.levelData.totalXp) < Number(b.levelData.totalXp)) {
                return 1
            } else {
                return 0
            }
        })
        if (dataLeaderboard.length===0) {
            await interaction.reply("No leaderboard data found. No one has talked in this server ever since the ranking plugin was enabled.")
            return
        }

        const mapped = dataLeaderboard.map((data,index) => {
            return `${index+1}. <@!${data.userId}>  -  **Total XP:** ${data.levelData.totalXp} | **Level:** ${data.levelData.level}`;
        })
        await pager(interaction, mapped, 10,"\n",`Server: ${interaction.guild.name}`, "Leaderboard")
    },
};
