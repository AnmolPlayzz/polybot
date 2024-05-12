const { ModalBuilder, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder } = require('discord.js');
const { mongo_client } = require("../../mongodb-helper");
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-autorole')
        .setDescription('Set Up autorole on this server.')
        .setDefaultMemberPermissions(32), //manage server
    async execute(interaction, client) {
        await interaction.deferReply()
        let guildId = `${interaction.guild.id}`
        const db = mongo_client.db("polybot");
        const collection = db.collection('autorole');
        const data = (await collection.find({ guildID: guildId }).toArray()).at(0)
        async function writeData(rolelist,guild) {
            const data = {
                roleList: rolelist,
                guildID: guild
            };
            await collection.insertOne(data)
        }
        if (data === undefined) {
            const constructor = new EmbedBuilder()
                .setAuthor({name: `Set Up autorole for ${interaction.guild.name}`})
                .setDescription(`Auto Role gives new members roles automatically after joining.\nUse the below menu to select all these roles. (max 5)\n\n**Note:** make sure to check for the following before selecting roles:\n1. This bot's role should be adove all the roles you select.\n2. Do not select any roles which are managed by apps (bot roles).\n3. Do not select any roles with elevated (admin,  manage server, manage messages, etc) permissions. `)
                .setColor(0x2b2d31)
                .setTimestamp()
                .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
            let roleRow = new RoleSelectMenuBuilder()
                .setCustomId("role_list")
                .setPlaceholder("Select roles!")
                .setMaxValues(5)
            let row = new ActionRowBuilder()
                .addComponents(roleRow)
            const response = await interaction.editReply({embeds: [constructor], components: [row]})
            const collector = response.createMessageComponentCollector({ componentType: ComponentType.RoleSelectMenu, time: 300_000 });
            collector.on("collect", async i => {
                if (i.user.id === interaction.user.id) {
                    if (i.customId === "role_list") {
                        await i.deferReply({ephemeral: true})
                        const roleList = i.roles.filter(e => {
                            if (e.managed===false) {
                                return e.id
                            }
                        }).map(e => e.id).reverse()
                        const roleListString = roleList.map(e => "- <@&"+e+">").join("\n")
                        if (roleList.length === 0) {
                            const second_rs = await i.editReply("No roles were selected. PolyBot filters the roles you select so it does not include any bot roles. If you're getting this it's likely that you only selected bot roles.")
                            return;
                        }
                        const roleConfEmbed = new EmbedBuilder()
                            .setAuthor({name: `Set Up autorole for ${interaction.guild.name}`})
                            .setDescription(`You're about to set up AutoRoles on this server with the following roles.\n\n${roleListString}\n\nAre you sure you want to continue?`)
                            .setColor(0x2b2d31)
                            .setTimestamp()
                            .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                        let cancel = new ButtonBuilder()
                            .setCustomId('autorole_cancel')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Danger);
                        let confirm = new ButtonBuilder()
                            .setCustomId('autorole_confirm')
                            .setLabel('Confirm')
                            .setStyle(ButtonStyle.Success);
                        let row = new ActionRowBuilder()
                            .addComponents(cancel,confirm)
                        const second_rs = await i.editReply({ embeds: [roleConfEmbed], components: [row] })
                        const collectorFilter = i => i.user.id === interaction.user.id;
                        try {
                            const confirmation = await second_rs.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
                            if (confirmation.customId === "autorole_cancel") {
                                const cancelEmbed = new EmbedBuilder()
                                    .setAuthor({name: `Set Up autorole for ${interaction.guild.name}`})
                                    .setDescription(`Action cancelled!`)
                                    .setColor(0xff2643)
                                    .setTimestamp()
                                    .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                                collector.stop("command-handled")
                                confirmation.update({embeds: [cancelEmbed], components: []})
                            } else if (confirmation.customId === "autorole_confirm") {
                                await writeData(roleList, guildId)
                                const confirmEmbed = new EmbedBuilder()
                                    .setAuthor({name: `Set Up autorole for ${interaction.guild.name}`})
                                    .setDescription(`AutoRole enabled!`)
                                    .setColor(0x51f561)
                                    .setTimestamp()
                                    .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                                collector.stop("command-handled")
                                confirmation.update({embeds: [confirmEmbed], components: []})
                            }
                        } catch(e) {
                            await i.editReply({ content: "You did not respond within 1 minute!", embeds: [], components: [] })
                        }
                    }
                } else {
                    await interaction
                }
            })
            collector.on("end", async i => {
                if (collector.endReason==="time") {
                    roleRow.setDisabled(true)
                    row = new ActionRowBuilder()
                        .addComponents(roleRow);
                    await interaction.editReply({content: "You did not respond in time! run the command again.", embeds: [constructor], components: [row]})
                } else if (collector.endReason === "command-handled") {
                    roleRow.setDisabled(true)
                    row = new ActionRowBuilder()
                        .addComponents(roleRow);
                    await interaction.editReply({embeds: [constructor], components: [row]})

                }
            })
        } else {
            await interaction.editReply("AutoRole is already enabled, run `/update-autorole` to edit the configuration.")
        }
    },
};
