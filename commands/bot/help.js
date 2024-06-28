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
            .setDescription('## Navigation\nUse the select menu to navigate through the menu.\n## Notations\n`[input]`: indicated the input field for a command.\n`[input]*`: indicates a field which is required.\n## Contributing\nIf you\'d like to report an issue or help make the bot better, head over to the [GitHub repo](https://github.com/AnmolPlayzz/polybot).\n## Website and Docs\nWill be made soon™')
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
            .setDescription("`/serverinfo`: Returns information about this server.\n`/userinfo [user]`: Returns information about a user.\n`/roleinfo [role]*`: Returns information about a role.\n`/rolelist`: Returns a list of all the roles in this server.\n`/channelinfo [channel]*`: Returns information about a channel.\n`/graph [channel]`: Returns a line chart representing the activty of a channel over the past 7 days.")
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        const welcome = new EmbedBuilder()
            .setColor(0x36c28f)
            .setAuthor({ name: 'Welcome setup Commands', iconURL: 'https://i.postimg.cc/85ryTwCM/help-welcome-author.png'})
            .setDescription("`/setup-welcome [welcome-channel]* [leave-channel]*`: Set up welcome and leave messages on this server.\n`/update-welcome`: Update the settings for welcome and leave messages.\n`/disable-welcome`: Disable welcome and leave messages.\n\n**Note:** You must have the `Manage Server` permission to run these commands.")
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        const autorole = new EmbedBuilder()
            .setColor(0xebcc34)
            .setAuthor({ name: 'Autorole setup Commands', iconURL: 'https://i.postimg.cc/TYJy0J9C/help-autorole-author.png'})
            .setDescription("`/setup-autorole`: Set up autrole on this server.\n`/update-autorole`: Update the settings for autorole.\n`/disable-autorole`: Disable autorole.\n\n**Note:** You must have the `Manage Server` permission to run these commands.")
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        const rank = new EmbedBuilder()
            .setColor(0xff4747)
            .setAuthor({ name: 'Rank Commands', iconURL: 'https://i.postimg.cc/mDd3JQVW/help-rank-author.png'})
            .setDescription("`/rank [target]`: Returns a user\'s rank.\n`/leaderboard`: Returns the leaderboard data of this server.")
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        const rankManager = new EmbedBuilder()
            .setColor(0xff4747)
            .setAuthor({ name: 'Rank manager Commands', iconURL: 'https://i.postimg.cc/pV5tWx5z/help-rank-manager-author-1.png'})
            .setDescription("`/setup-rank`: Set up the rank module on this server.\n`/disable-rank`: Disable the rank module on this server.\n`/set-level [target]* [level]*`: Set the level for a user on this server.\n`/set-xp [target]* [xp]*`: Set the xp for a user on this server.\n\n**Note:** You must have the `Manage Server` permission to run these commands.")
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        const silly = new EmbedBuilder()
            .setColor(0xff9500)
            .setAuthor({ name: 'Silly Commands', iconURL: 'https://i.postimg.cc/PrWJQdTP/help-silly-author.png'})
            .setDescription("`/hug [target]*`: Hug a user (with cute cat gifs :3).\n`/slap [target]*`: Slap a user (with CERTAINLY NOT cute cat gifs :3).\n`/meme`: Get a random meme from reddit.\n`/copypasta`: Get a random copypasta from reddit.\n`/mock [text]*`: mOcK a given string. (Also available as **context menus**)")
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        const utility = new EmbedBuilder()
            .setColor(0x9e3bd4)
            .setAuthor({ name: 'Utility Commands', iconURL: 'https://i.postimg.cc/fTkz85w1/help-utility-author.png'})
            .setDescription("`/weather [location]*`: Get the current and forecast Weather data for a location.\n`/aqi [location]*`: Get the current AQI data for a location.\n`/unit-convert [quantity]*`: Convert a quantity from one unit to another.\n`/currency-convert [input_currency]* [output_currency]* [value]*`: Convert a money from one currency to another.\n`/calculator`: Use a button calculator inside discord.\n`/webss [url]* [wait]`: Take a screenshot of a given website.")
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
                    .setValue("info"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Welcome setup Commands")
                    .setDescription("Commands which configure the welcome and leave message channels.")
                    .setValue("welcome"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("AutoRole setup Commands")
                    .setDescription("Commands which configure autorole.")
                    .setValue("autorole"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Rank Commands")
                    .setDescription("Commands for the rank module.")
                    .setValue("rank"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Rank Manager Commands")
                    .setDescription("Commands for managing the rank module.")
                    .setValue("rank_manager"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Silly Commands")
                    .setDescription("Commands for getting a lil freaky 👅.")
                    .setValue("silly"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Utility Commands")
                    .setDescription("Commands for getting useful info about stuff.")
                    .setValue("utility"),
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
                    } else if (i.values[0]==="welcome") {
                        await i.update({embeds: [welcome], components: [mainrow], ephemeral: true});
                        await collector.resetTimer()
                    } else if (i.values[0]==="autorole") {
                        await i.update({embeds: [autorole], components: [mainrow], ephemeral: true});
                        await collector.resetTimer()
                    } else if (i.values[0]==="rank") {
                        await i.update({embeds: [rank], components: [mainrow], ephemeral: true});
                        await collector.resetTimer()
                    } else if (i.values[0]==="rank_manager") {
                        await i.update({embeds: [rankManager], components: [mainrow], ephemeral: true});
                        await collector.resetTimer()
                    } else if (i.values[0]==="silly") {
                        await i.update({embeds: [silly], components: [mainrow], ephemeral: true});
                        await collector.resetTimer()
                    } else if (i.values[0]==="utility") {
                        await i.update({embeds: [utility], components: [mainrow], ephemeral: true});
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
