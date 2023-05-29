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
            .setAuthor({ name: 'Welcome to the Help menu!', iconURL: 'https://cdn.discordapp.com/attachments/1112672152433475604/1112681019565416518/help-author.png'})
            .setDescription('## Navigation\nUse the select menu to navigate through the menu.\n## Contributing\nIf you\'d like to report an issue or help make the bot better, head over to the [GitHub repo](https://github.com/AnmolPlayzz/art-of-dragons-2.0).\n## Website and Docs\nWill be made soon™')
            .setTimestamp()
			.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        const info = new EmbedBuilder()
            .setColor(0x4287f5)
            .setAuthor({ name: 'Info Commands', iconURL: 'https://cdn.discordapp.com/attachments/1112672152433475604/1112756225935937536/help_info_author.png'})
            .setDescription("`/help`: Returns the Help menu for the bot.\n`/ping`: Returns the Bots ping.\n`/stats`: Returns the stats of the bot.")
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
					.setLabel('Info Commands')
					.setDescription('Commands relating to the bot.')
					.setValue('info'),
            )


        //---------[  ACTION ROWS  ]------------
        const mainrow = new ActionRowBuilder()
            .addComponents(mainnav);

        //---------[  REPLY AND COLLECTION LOGIC  ]------------    
        const rep = await interaction.reply({embeds: [home], components: [mainrow], ephemeral: true})
        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            const collector = await rep.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_000 });
            collector.on('collect', async i => {
                if (i.customId === 'nav') {
                    if (i.values[0]=="home"){
                        await i.update({embeds: [home] , components: [mainrow], ephemeral: true});
                        await collector.resetTimer()
                    } else if(i.values[0]=="info") {
                        await i.update({embeds: [info] , components: [mainrow], ephemeral: true});
                        await collector.resetTimer()
                    }
                }
            })
        } catch (e) {
            console.error(e)
        }
	},
};
