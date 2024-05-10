require("dotenv").config();
const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { leaveMsg } = require("../messages.json")
const { mongo_client } = require("../mongodb-helper.js");
module.exports = {
    name: Events.GuildMemberRemove,
    once: false,
    async execute(member) {
        const guildId = member.guild.id
        const db = mongo_client.db("polybot");
        const collection = db.collection('welcome');
        const data = (await collection.find({ guildID: guildId }).toArray()).at(0)
        if (data!==undefined) {
            const randomMsg = leaveMsg[Math.floor(Math.random()*leaveMsg.length)]
            const guildI = member.guild
            const userI = member.user
            const msg = randomMsg.replace("{user}",`<@!${userI.id}>`)
            const leave = data.leaveID
            try {
                const leaveChannel = await guildI.channels.fetch(leave)
                await leaveChannel.send(msg)
            } catch (e) {
                console.log(e)
            }

        }
    },
};
