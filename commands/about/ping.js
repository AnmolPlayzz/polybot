const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Returns the Bots ping.'),
	async execute(interaction) {
		await interaction.reply(`🏓 ${interaction.client.ws.ping}ms`);
	},
};
