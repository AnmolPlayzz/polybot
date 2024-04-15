const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Returns the Help menu for the bot.'),
	async execute(interaction, client) {
        //---------[  EMBEDS  ]------------
        const home = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ name: 'Welcome to the Help menu!', iconURL: 'https://i.postimg.cc/BZxMMd9Y/help-author.png'})
            .setDescription('## Navigation\nUse the select menu to navigate through the menu.\n## Notations\n`[input]`: indicated the input field for a command.\n`[input]*`: indicates a field which is required.\n## Contributing\nIf you\'d like to report an issue or help make the bot better, head over to the [GitHub repo](https://github.com/AnmolPlayzz/art-of-dragons-2.0).\n## Website and Docs\nWill be made soon™')
            .setTimestamp()
			.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        const bot = new EmbedBuilder()
            .setColor(0x4287f5)
            .setAuthor({ name: 'Bot Commands', iconURL: 'https://i.postimg.cc/4xM6J5RH/help-info-author.png'})
            .setDescription("`/help`: Returns the Help menu for the bot.\n`/ping`: Returns the Bots ping.\n`/stats`: Returns the stats of the bot.")
            .setTimestamp()
			.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        const info = new EmbedBuilder()
            .setColor(0xf78b43)
            .setAuthor({ name: 'Info Commands', iconURL: 'https://i.postimg.cc/wBxrkt2T/help-info-author.png'})
            .setDescription("`/serverinfo`: Returns information about this server.\n`/userinfo [user]`: Returns information about a user.\n`/roleinfo [role]*`: Returns information about a role.\n`/rolelist`: Returns a list of all the roles in this server.")
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });


        //---------[  SELECT MENUS  ]------------
        const mainnav = new StringSelectMenuBuilder()
			.setCustomId('nav')
			.setPlaceholder('Take me to...')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('Home')
					.setDescription('Home page of the menu.')
					.setValue('home'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Bot Commands')
					.setDescription('Commands relating to the bot.')
					.setValue('bot'),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Info Commands")
                    .setDescription("Commands which return info about things in this server.")
                    .setValue("info")
            )


        //---------[  ACTION ROWS  ]------------
        let mainrow = new ActionRowBuilder()
            .addComponents(mainnav);

        //---------[  REPLY AND COLLECTION LOGIC  ]------------    
        const rep = await interaction.reply({embeds: [home], components: [mainrow], ephemeral: true})
        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            const collector = await rep.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 300_000 });
            collector.on('collect', async i => {
                if (i.customId === 'nav') {
                    if (i.values[0]==="home"){
                        await i.update({embeds: [home] , components: [mainrow], ephemeral: true});
                        await collector.resetTimer()
                    } else if(i.values[0]==="bot") {
                        await i.update({embeds: [bot] , components: [mainrow], ephemeral: true});
                        await collector.resetTimer()
                    } else if (i.values[0]==="info") {
                        await i.update({embeds: [info], components: [mainrow], ephemeral: true});
                        await collector.resetTimer()
                    }
                }
            })
            collector.on("end", i => {
                mainnav.setDisabled(true)
                mainrow = new ActionRowBuilder()
                    .addComponents(mainnav);
                interaction.editReply({components: [mainrow]})
            })
        } catch (e) {
            console.error(e)
        }
	},
};
