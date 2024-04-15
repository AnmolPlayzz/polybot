require("dotenv").config();
const { Events, EmbedBuilder } = require('discord.js');
const chalk = require("chalk");
const botlog = process.env.BOTLOG;
const wait = require('node:timers/promises').setTimeout;
module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		let totalSeconds = client.uptime / 1000;
		const days = Math.floor(totalSeconds / 86400);
		totalSeconds %= 86400;
		const hours = Math.floor(totalSeconds / 3600);
		totalSeconds %= 3600;
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = Math.floor(totalSeconds % 60);

		const uptime = `\`\`\`${days}d ${hours}hrs ${minutes}mins ${seconds}secs \`\`\``;
        const boot = new EmbedBuilder()
            .setColor(0xff9c63)
            .setAuthor({ name: 'Bot Bootup successfull!', iconURL: 'https://i.postimg.cc/jdHmnDSj/Untitled3-1024x1024.png'})
			.addFields(
				{ name: "Servers:", value: `\`\`\`${client.guilds.cache.size}\`\`\``, inline: true },
				{ name: "Users:", value: `\`\`\`${client.users.cache.size}\`\`\``, inline: true },
				{ name: "Channels",value: `\`\`\`${client.channels.cache.size}\`\`\``, inline: true },
				{ name: "Uptime: ", value: uptime , inline: true },
				{ name: "Ping:",value: `\`\`\`${Math.round(client.ws.ping)} ms\`\`\``, inline: true },
				{ name: "RAM: ", value: `\`\`\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`\`\``, inline: true  },
				{ name: "Node.js Version", value: `\`\`\`${(process.version)}\`\`\``, inline: true },
				{ name: "Operating System", value: `\`\`\`${(process.platform)}\`\`\``, inline: true },
				{ name: "Architecture", value: `\`\`\`${(process.arch)}\`\`\``, inline: true }
			)
			.setTimestamp()
		
		console.log(chalk.green.bold("Success!"))
		console.log(chalk.gray("Connected To"), chalk.yellow(`${client.user.tag}`));
		console.log(
		  chalk.white("Watching"),
		  chalk.red(`${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)}`),
		  chalk.white(`${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0) > 1 ? "Users," : "User,"}`),
		  chalk.red(`${client.guilds.cache.size}`),
		  chalk.white(`${client.guilds.cache.size > 1 ? "Servers." : "Server."}`)
		)
		console.log(
		  chalk.white(`Prefix: /`),
		);
		console.log("")
		console.log(chalk.red.bold("——————————[Statistics]——————————"))
		console.log(chalk.gray(`Running on Node ${process.version} on ${process.platform} Operating System and ${process.arch} Architecture`))
		console.log(chalk.gray(`Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB RSS\n${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`))
		wait(5000)
		const log = client.channels.cache.get(`${botlog}`)
		log.send({embeds: [boot]})

	},
};
