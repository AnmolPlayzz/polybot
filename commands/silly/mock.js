const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('mock')
        .setDescription('MoCk a given string.')
        .addStringOption(option =>
            option
                .setName('text')
                .setDescription('The text to mOcK.')
                .setRequired(true)),
    async execute(interaction, client) {
        const text = interaction.options.getString('text');
        let newText="";
        for (const [val, key] of Object.entries(text)) {
            if (val%2!==0) {
                newText += key.toUpperCase()
            } else {
                newText += key.toLowerCase()
            }
        }
        interaction.reply({content: newText, ephemeral: true})
    },
};
