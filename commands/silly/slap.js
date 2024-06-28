const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { slapMsg } = require("../../messages.json");
const { slap } = require("../../gifs.json")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('Slap a user (with DEFINITELY NOT cute cat gifs :3).')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to slap.')
                .setRequired(true)),
    async execute(interaction, client) {
        const target = interaction.options.getUser('target');
        const randomMsg = slapMsg[Math.floor(Math.random()*slapMsg.length)]
        const msg = randomMsg.replace("{user1}",`<@!${interaction.user.id}>`).replace("{user2}",`<@!${target.id}>`)
        const randomGif = slap[Math.floor(Math.random()*slap.length)]
        const embed = new EmbedBuilder()
            .setDescription(msg)
            .setColor(0x2b2d31)
            .setImage(randomGif)
            .setTimestamp()
        await interaction.reply({embeds: [embed]})
    },
};
