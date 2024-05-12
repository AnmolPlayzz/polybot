const { ModalBuilder, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle } = require('discord.js');
const { mongo_client } = require("../../mongodb-helper")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-rank')
        .setDescription('Set Up rank system on this server.')
        .setDefaultMemberPermissions(32), //manage server
    async execute(interaction, client) {
        await interaction.deferReply()
        let guildId = `${interaction.guild.id}`
        const db = mongo_client.db("polybot");
        const collection = db.collection('rank_server');
        const data = (await collection.find({ guildId: guildId }).toArray()).at(0)
        async function writeData(guildId) {
            const data = {
                guildId: guildId
            };
            await collection.insertOne(data)
        }
        if (data === undefined) {
            const constructor = new EmbedBuilder()
                .setAuthor({name: `Set up rank system for ${interaction.guild.name}`})
                .setDescription(`You're about to enable the Ranking and Leveling module on this server.\nAre you sure that you want to continue?`)
                .setColor(0x2b2d31)
                .setTimestamp()
                .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
            let cancel = new ButtonBuilder()
                .setCustomId('rank_set_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger);
            let confirm = new ButtonBuilder()
                .setCustomId('rank_set_confirm')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success);
            let row = new ActionRowBuilder()
                .addComponents(cancel,confirm)
            const response = await interaction.editReply({embeds: [constructor], components: [row]})
            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
            collector.on("collect", async i => {
                if (i.user.id === interaction.user.id) {
                    switch (i.customId) {
                        case "rank_set_confirm":
                            await writeData(guildId)
                            const confirmed = new EmbedBuilder()
                                .setAuthor({name: `Set Up rank system for ${interaction.guild.name}`})
                                .setDescription(`Ranking and leveling module successfully enabled!`)
                                .setColor(0x51f561)
                                .setTimestamp()
                                .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                            collector.stop("Commandhandled")
                            i.update({embeds: [confirmed], components: []})
                            break
                        case "rank_set_cancel":
                            const cancelled = new EmbedBuilder()
                                .setAuthor({name: `Set Up rank system for ${interaction.guild.name}`})
                                .setDescription(`Action cancelled!`)
                                .setColor(0xff2643)
                                .setTimestamp()
                                .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                            collector.stop("Commandhandled")
                            i.update({embeds: [cancelled], components: []})
                            break
                    }
                    collector.resetTimer()
                } else {
                    i.reply({ content: `These buttons aren't for you!`, ephemeral: true });
                }
            })
            collector.on("end", i => {
                if (collector.endReason==="time") {
                    cancel.setDisabled(true)
                    confirm.setDisabled(true)
                    row = new ActionRowBuilder()
                        .addComponents(cancel, confirm);
                    interaction.editReply({content: "You did not respond in time! run the command again.", embeds: [constructor], components: [row]})
                }
            })
        } else {
            await interaction.editReply("Ranking module is already enabled.")
        }
    },
};
