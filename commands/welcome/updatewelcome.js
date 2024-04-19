const { ModalBuilder, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle,
    TextChannel
} = require('discord.js');
const { mongo_client } = require("../../mongodb-helper")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('update-welcome')
        .setDescription('Update welcome and leave message on this server.')
        .setDefaultMemberPermissions(32), //manage server
    async execute(interaction, client) {
        await interaction.deferReply()
        let guildId = `${interaction.guild.id}`
        const db = mongo_client.db("polybot");
        const collection = db.collection('welcome');
        const data = (await collection.find({ guildID: guildId }).toArray()).at(0)

        if (data!==undefined) {
            let updateEmbed = new EmbedBuilder()
                .setAuthor({name: `Update welcome and leave messages for ${interaction.guild.name}.`})
                .setColor(0x2b2d31)
                .setDescription(`The current settings are shown below.\n\n\`Welcome channel:\` <#${data.welcomeID}>\n\`Leave channel:\` <#${data.leaveID}>\n\nSelect which channel you want to update from below.\nIf you'd like to disable this feature entirely, run \`/disable-welcome\``)
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });

            let welcomeUpd = new ButtonBuilder()
                .setCustomId('wlcm_upd')
                .setLabel('Welcome channel')
                .setStyle(ButtonStyle.Secondary);
            let leaveUpd = new ButtonBuilder()
                .setCustomId('leave_upd')
                .setLabel('Leave channel')
                .setStyle(ButtonStyle.Secondary);
            let row = new ActionRowBuilder()
                .addComponents(welcomeUpd,leaveUpd)
            const response = await interaction.editReply({embeds: [updateEmbed], components: [row]})

            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
            collector.on("collect", async i => {
                if (i.user.id === interaction.user.id) {
                    await i.deferReply({ephemeral: true})
                    function selectMenuCreate(labelText,customId) {
                        const menu = new ChannelSelectMenuBuilder()
                            .setCustomId(customId)
                            .setChannelTypes(0)
                            .setPlaceholder(labelText)
                            .setMaxValues(1)
                        return new ActionRowBuilder()
                            .addComponents(menu)
                    }
                    let second_rs;
                    switch (i.customId) {
                        case "wlcm_upd":
                            const row_secondry_1 = selectMenuCreate("Select welcome channel", "welcome_channel_select")
                            second_rs = await i.editReply({content: "Select the channel from below!", components: [row_secondry_1]})
                            break
                        case "leave_upd":
                            const row_secondry_2 = selectMenuCreate("Select leave channel", "leave_channel_select")
                            second_rs = await i.editReply({content: "Select the channel from below!", components: [row_secondry_2]})
                            break
                    }
                    const collectorFilter = i => i.user.id === interaction.user.id;
                    try {
                        const channelSelect = await second_rs.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
                        const channelID = channelSelect.channels.at(0).id
                        if (channelSelect.customId === "welcome_channel_select") {
                            const data_updated = (await collection.find({ guildID: guildId }).toArray()).at(0)
                            updateEmbed
                                .setDescription(`The current settings are shown below.\n\n\`Welcome channel:\` <#${channelID}>\n\`Leave channel:\` <#${data_updated.leaveID}>\n\nSelect which channel you want to update from below.\nIf you'd like to disable this feature entirely, run \`/disable-welcome\``)
                            welcomeUpd.setDisabled(true)
                            row = new ActionRowBuilder()
                                .addComponents(welcomeUpd,leaveUpd);
                            interaction.editReply({embeds: [updateEmbed], components: [row]})
                            const updateResult = await collection.updateOne({ guildID: guildId }, { $set: { welcomeID: channelID } });
                            channelSelect.update({content: `Selected the \`welcome channel\` as <#${channelID}>!`,components: []})
                        } else if (channelSelect.customId === "leave_channel_select") {
                            const data_updated = (await collection.find({ guildID: guildId }).toArray()).at(0)
                            updateEmbed
                                .setDescription(`The current settings are shown below.\n\n\`Welcome channel:\` <#${data_updated.welcomeID}>\n\`Leave channel:\` <#${channelID}>\n\nSelect which channel you want to update from below.\nIf you'd like to disable this feature entirely, run \`/disable-welcome\``)
                            leaveUpd.setDisabled(true)
                            row = new ActionRowBuilder()
                                .addComponents(welcomeUpd,leaveUpd);
                            interaction.editReply({embeds: [updateEmbed], components: [row]})
                            const updateResult = await collection.updateOne({ guildID: guildId }, { $set: { leaveID: channelID } });
                            channelSelect.update({content: `Selected the \`leave channel\` as <#${channelID}>!`,components: []})
                        }
                    } catch (e) {
                        await i.editReply({ content: 'Response not received within 1 minute, cancelling!', components: [] });
                    }
                    collector.resetTimer()
                } else {
                    i.reply({ content: `These buttons aren't for you!`, ephemeral: true });
                }
            })

            collector.on("end", async i => {
                welcomeUpd.setDisabled(true)
                leaveUpd.setDisabled(true)
                row = new ActionRowBuilder()
                    .addComponents(welcomeUpd,leaveUpd);
                await interaction.editReply({embeds: [updateEmbed], components: [row]})
            })
        } else {
            await interaction.editReply({content: `Welcome messages are not set up on this server! Run \`/setup-welcome\` if you wish to do so.`})
        }

    },
};
