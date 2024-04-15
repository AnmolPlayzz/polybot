const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Returns information about this server.'),
    async execute(interaction, client) {
        const bots =(await interaction.guild.members.fetch()).filter(m => m.user.bot).size
        const icon = interaction.guild.iconURL()
        const channels = await interaction.guild.roles.fetch()
        c=-1
        channels.forEach(e => {
            c++
        })
        const serverInfo = new EmbedBuilder()
            .setTitle(`Server Info for ${interaction.guild.name}`)
            .setThumbnail(icon)
            .setColor(0x2b2d31)
            .addFields({name: "🎗 Members", value: `**Humans:** ${interaction.guild.memberCount - bots}\n**Bots:** ${bots}\n**Total:** ${interaction.guild.memberCount}`, inline: true },
                {name: "👑 Owner", value: `<@!${interaction.guild.ownerId}>`, inline: true},
                {name: "💳 Server ID", value: interaction.guildId, inline: true},
                {name: "📻 Channels", value: `${interaction.guild.channels.channelCountWithoutThreads}`, inline: true},
                {name: "📅 Created on", value: "<t:"+`${interaction.guild.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                {name: "👥 Roles", value: `${c}`, inline: true})
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        await interaction.reply({embeds: [serverInfo]})
    },
};
