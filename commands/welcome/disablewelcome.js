const { ModalBuilder, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle,
    TextChannel
} = require('discord.js');
const { mongo_client } = require("../../mongodb-helper")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('disable-welcome')
        .setDescription('Disable welcome and leave message on this server.')
        .setDefaultMemberPermissions(32), //manage server
    async execute(interaction, client) {
        await interaction.deferReply()
        let guildId = `${interaction.guild.id}`
        const db = mongo_client.db("polybot");
        const collection = db.collection('welcome');
        const data = (await collection.find({ guildID: guildId }).toArray()).at(0)

        if (data!==undefined) {
            let disableEmbed = new EmbedBuilder()
                .setAuthor({name: `Disable welcome and leave messages for ${interaction.guild.name}.`})
                .setColor(0x2b2d31)
                .setDescription(`You're about to **disable** welcome and leave messages on this server.\nAre you sure you want to continue?`)
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });

            let cancel = new ButtonBuilder()
                .setCustomId('wlcm_disable_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger);
            let confirm = new ButtonBuilder()
                .setCustomId('wlcm_disable_confirm')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success);
            let row = new ActionRowBuilder()
                .addComponents(cancel, confirm)
            const response = await interaction.editReply({embeds: [disableEmbed], components: [row]})

            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
            collector.on("collect", async i => {
                if (i.user.id === interaction.user.id) {
                    switch (i.customId) {
                        case "wlcm_disable_cancel":
                            const cancelled = new EmbedBuilder()
                                .setAuthor({name: `Disable welcome and leave messages for ${interaction.guild.name}`})
                                .setDescription(`Action cancelled!`)
                                .setColor(0xff2643)
                                .setTimestamp()
                                .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                            i.update({embeds: [cancelled], components: []})
                            collector.stop("Commenthandled")
                            break
                        case "wlcm_disable_confirm":
                            const deleteResult = await collection.deleteMany({ guildID: guildId });
                            const confirmed = new EmbedBuilder()
                                .setAuthor({name: `Disable welcome and leave messages for ${interaction.guild.name}`})
                                .setDescription(`Welcome and leave messages have been disabled!`)
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
            await interaction.editReply({content: `Welcome messages are not set up on this server! Run \`/setup-welcome\` if you wish to do so.`})
        }
    },
};
