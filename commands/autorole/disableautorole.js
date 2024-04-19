const { ModalBuilder, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle,
    TextChannel
} = require('discord.js');
const { mongo_client } = require("../../mongodb-helper")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('disable-autorole')
        .setDescription('Disable autorole on this server.')
        .setDefaultMemberPermissions(32), //manage server
    async execute(interaction, client) {
        await interaction.deferReply()
        let guildId = `${interaction.guild.id}`
        const db = mongo_client.db("polybot");
        const collection = db.collection('autorole');
        const data = (await collection.find({ guildID: guildId }).toArray()).at(0)

        if (data!==undefined) {
            let disableEmbed = new EmbedBuilder()
                .setAuthor({name: `Disable autorole for ${interaction.guild.name}.`})
                .setColor(0x2b2d31)
                .setDescription(`You're about to **disable** AutoRole on this server.\nAre you sure you want to continue?`)
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });

            let cancel = new ButtonBuilder()
                .setCustomId('autorole_disable_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger);
            let confirm = new ButtonBuilder()
                .setCustomId('autorole_disable_confirm')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success);
            let row = new ActionRowBuilder()
                .addComponents(cancel, confirm)
            const response = await interaction.editReply({embeds: [disableEmbed], components: [row]})

            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
            collector.on("collect", async i => {
                if (i.user.id === interaction.user.id) {
                    switch (i.customId) {
                        case "autorole_disable_cancel":
                            const cancelled = new EmbedBuilder()
                                .setAuthor({name: `Disable autorole for ${interaction.guild.name}`})
                                .setDescription(`Action cancelled!`)
                                .setColor(0xff2643)
                                .setTimestamp()
                                .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                            i.update({embeds: [cancelled], components: []})
                            collector.stop("Commenthandled")
                            break
                        case "autorole_disable_confirm":
                            const deleteResult = await collection.deleteMany({ guildID: guildId });
                            const confirmed = new EmbedBuilder()
                                .setAuthor({name: `Disable autorole for ${interaction.guild.name}`})
                                .setDescription(`AutoRole for this server has been disabled!`)
                                .setColor(0x51f561)
                                .setTimestamp()
                                .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                            i.update({embeds: [confirmed], components: []})
                            collector.stop("Commenthandled")
                            break
                    }
                    collector.resetTimer()
                } else {
                    i.reply({ content: `These buttons aren't for you!`, ephemeral: true });
                }
            })

            collector.on("end", async i => {
                if (collector.endReason==="time") {
                    cancel.setDisabled(true)
                    confirm.setDisabled(true)
                    row = new ActionRowBuilder()
                        .addComponents(cancel, confirm);
                    await interaction.editReply({
                        content: "You did not respond in time! run the command again.",
                        embeds: [disableEmbed],
                        components: [row]
                    })
                }
            })
        } else {
            await interaction.editReply({content: `AutoRole is not set up on this server! Run \`/setup-autorole\` if you wish to do so.`})
        }
    },
};
