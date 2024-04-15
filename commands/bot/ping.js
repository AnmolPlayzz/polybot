const { SlashCommandBuilder } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Returns the Bots ping.'),
	async execute(interaction, client) {
		await interaction.reply(`🏓 ${client.ws.ping}ms`);
	},
};
