const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Returns a user\'s info.')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to view info of')
                .setRequired(false)),
    async execute(interaction, client) {
        const target = interaction.options.getUser('target')===null ? interaction.user : interaction.options.getUser('target')
        const svmember = await interaction.guild.members.fetch(`${target.id}`)
        console.log(target)
        const svname = svmember.nickname || target.globalName
        const userinfo = new EmbedBuilder()
            .setTitle(`User Info for ${target.username}${svmember.user.discriminator!=="0" ? "#"+svmember.user.discriminator : ""}`)
            .setThumbnail(target.avatarURL())
            .setColor(0x2b2d31)
            .addFields({name: "👤 Name", value: `${target.globalName || target.username}`, inline: true },
                {name: "🆔 ID", value: `${target.id}`, inline: true},
                {name: "👥 Server Name", value: svname || target.username, inline: true},
                {name: "📅 Created on", value: "<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                {name: "➕ Joined server on", value: "<t:"+`${svmember.joinedTimestamp}`.slice(0,10)+":D>", inline: true},
                {name: "🤖 Use is bot", value: `${target.bot ? "Yes" : "No"}`, inline: true},
                {name: "🔱 Permissions [first 10]", value: `\`\`\`${svmember.permissions.toArray().slice(0,10).join(", ")}\`\`\``, inline: true}
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        await interaction.reply({embeds: [userinfo]})
    },
};
