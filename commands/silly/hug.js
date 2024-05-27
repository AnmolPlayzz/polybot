const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hugMsg } = require("../../messages.json");
const { hug } = require("../../gifs.json")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Hug a user (with cute cat gifs :3).')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to hug.')
                .setRequired(true)),
    async execute(interaction, client) {
        const target = interaction.options.getUser('target');
        const randomMsg = hugMsg[Math.floor(Math.random()*hugMsg.length)]
        const msg = randomMsg.replace("{user1}",`<@!${interaction.user.id}>`).replace("{user2}",`<@!${target.id}>`)
        const randomGif = hug[Math.floor(Math.random()*hug.length)]
        const embed = new EmbedBuilder()
            .setDescription(msg)
            .setColor(0x2b2d31)
            .setImage(randomGif)
            .setTimestamp()
        await interaction.reply({embeds: [embed]})
    },
};
