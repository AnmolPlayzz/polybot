const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Returns the stats of the bot.'),
	async execute(interaction, client) {
		let totalSeconds = interaction.client.uptime / 1000;
		const days = Math.floor(totalSeconds / 86400);
		totalSeconds %= 86400;
		const hours = Math.floor(totalSeconds / 3600);
		totalSeconds %= 3600;
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = Math.floor(totalSeconds % 60);

		const uptime = `\`\`\`${days}d ${hours}hrs ${minutes}mins ${seconds}secs \`\`\``;
        const stats = new EmbedBuilder()
            .setColor(0xff9c63)
            .setAuthor({ name: 'Stats', iconURL: 'https://i.postimg.cc/jdHmnDSj/Untitled3-1024x1024.png'})
			.addFields(
				{ name: "Servers:", value: `\`\`\`${client.guilds.cache.size}\`\`\``, inline: true },
				{ name: "Users:", value: `\`\`\`${client.users.cache.size}\`\`\``, inline: true },
				{ name: "Channels",value: `\`\`\`${client.channels.cache.size}\`\`\``, inline: true },
				{ name: "Uptime: ", value: uptime , inline: true },
				{ name: "Ping:",value: `\`\`\`${Math.round(interaction.client.ws.ping)} ms\`\`\``, inline: true },
				{ name: "RAM: ", value: `\`\`\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`\`\``, inline: true  },
				{ name: "Node.js Version", value: `\`\`\`${(process.version)}\`\`\``, inline: true },
				{ name: "Operating System", value: `\`\`\`${(process.platform)}\`\`\``, inline: true },
				{ name: "Architecture", value: `\`\`\`${(process.arch)}\`\`\``, inline: true }
			)
			.setTimestamp()
			.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
		await interaction.reply({embeds: [stats]});
	},
};
