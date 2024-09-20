const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: {
        options: [
            {
                choices: undefined,
                autocomplete: undefined,
                type: 3,
                name: 'text',
                name_localizations: undefined,
                description: 'The text to 𝓯𝓻𝓮𝓪𝓴.',
                description_localizations: undefined,
                required: true,
                max_length: undefined,
                min_length: undefined
            }
        ],
        name: 'freaky',
        name_localizations: undefined,
        description: 'make a string go a lil 𝓯𝓻𝓮𝓪𝓴𝔂.',
        description_localizations: undefined,
        default_permission: undefined,
        default_member_permissions: undefined,
        dm_permission: undefined,
        nsfw: undefined,
        integration_types: [0,1],
        contexts: [0,1,2]
    },
    async execute(interaction, client) {
        const text = interaction.options.getString('text');
        const englishToReplacementMap = {
            'a': '𝓪', 'b': '𝓫', 'c': '𝓬', 'd': '𝓭', 'e': '𝓮',
            'f': '𝓯', 'g': '𝓰', 'h': '𝓱', 'i': '𝓲', 'j': '𝓳',
            'k': '𝓴', 'l': '𝓵', 'm': '𝓶', 'n': '𝓷', 'o': '𝓸',
            'p': '𝓹', 'q': '𝓺', 'r': '𝓻', 's': '𝓼', 't': '𝓽',
            'u': '𝓾', 'v': '𝓿', 'w': '𝔀', 'x': '𝔁', 'y': '𝔂',
            'z': '𝔃',
            'A': '𝓐', 'B': '𝓑', 'C': '𝓒', 'D': '𝓓', 'E': '𝓔',
            'F': '𝓕', 'G': '𝓖', 'H': '𝓗', 'I': '𝓘', 'J': '𝓙',
            'K': '𝓚', 'L': '𝓛', 'M': '𝓜', 'N': '𝓝', 'O': '𝓞',
            'P': '𝓟', 'Q': '𝓠', 'R': '𝓡', 'S': '𝓢', 'T': '𝓣',
            'U': '𝓤', 'V': '𝓥', 'W': '𝓦', 'X': '𝓧', 'Y': '𝓨',
            'Z': '𝓩'
        };
        const newText = text.replace(/[a-zA-Z]/g, char => englishToReplacementMap[char] || char);
        await interaction.reply(newText)
    },
};
