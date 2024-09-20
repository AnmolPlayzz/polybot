const { SlashCommandBuilder } = require('discord.js');
module.exports = {
	data: {
		options: [],
		name: 'ping',
		name_localizations: undefined,
		description: 'Returns the Bots ping.',
		integration_types: [0,1],
		contexts: [0,1,2]
	},
	async execute(interaction, client) {
		await interaction.reply(`🏓 ${client.ws.ping}ms`);
	},
};
