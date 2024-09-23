const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: {
        options: [
            {
                choices: undefined,
                autocomplete: undefined,
                type: 3,
                name: 'query',
                name_localizations: undefined,
                description: 'The query to search on urbandictionary.',
                description_localizations: undefined,
                required: true,
                max_length: undefined,
                min_length: undefined
            }
        ],
        name: 'urbandictionary',
        name_localizations: undefined,
        description: 'post a link to urbandictionary for a given query.',
        description_localizations: undefined,
        default_permission: undefined,
        default_member_permissions: undefined,
        dm_permission: undefined,
        nsfw: undefined,
        integration_types: [0,1],
        contexts: [0,1,2]
    },
    async execute(interaction, client) {
        const text = interaction.options.getString('query');
        const newText = "https://www.urbandictionary.com/define.php?term=" + encodeURIComponent(text);
        await interaction.reply(newText)
    },
};
