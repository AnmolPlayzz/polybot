const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Returns a role\'s info.')
        .addRoleOption(option =>
            option
                .setName('target')
                .setDescription('The role to view info of')
                .setRequired(true)),
    async execute(interaction, client) {
        const target = interaction.options.getRole('target')
        const roleInfo = new EmbedBuilder()
            .setTitle(`Role Info for ${target.name}`)
            .setThumbnail(target.iconURL())
            .setColor(target.color)
            .addFields({name: "🎗 Name", value: target.name, inline: true },
                {name: "💳 ID", value: `${target.id}`, inline: true},
                {name: "🎨 Color Hex", value: `#${target.color.toString(16)}`, inline: true},
                {name: "🎖 Position", value: `${target.position}`, inline: true},
                {name: "📅 Created on", value: "<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                {name: "🚩 Hoisted", value: `${target.hoist ? "Yes" : "No"}`, inline: true},
                {name: "🔱 Permissions [First 10]", value: `${target.permissions.toArray().slice(0,10).join(", ")}`, inline: false})
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        await interaction.reply({embeds: [roleInfo]})
    },
};
