const { ModalBuilder, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle } = require('discord.js');
const { mongo_client } = require("../../mongodb-helper")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Set Up welcome messages on this server.')
        .addChannelOption(option =>
            option
                .setName('welcome_channel')
                .setDescription('The channel to be used for Welcome Messages.')
                .setRequired(true))
        .addChannelOption(option =>
            option
                .setName('leave_channel')
                .setDescription('The channel to be used for Leave Messages.')
                .setRequired(true))
        .setDefaultMemberPermissions(32), //manage server
    async execute(interaction, client) {
        await interaction.deferReply()
        let guildId = `${interaction.guild.id}`
        const db = mongo_client.db("polybot");
        const collection = db.collection('welcome');
        const data = (await collection.find({ guildID: guildId }).toArray()).at(0)
        async function writeData(welcome,leave,guild) {
            const data = {
                welcomeID: `${welcome}`,
                leaveID: `${leave}`,
                guildID: guild
            };
            await collection.insertOne(data)
        }

        let welcomeID;
        let leaveID;
        if (interaction.options.getChannel("welcome_channel").type===0 && interaction.options.getChannel("leave_channel").type === 0) {
            welcomeID = interaction.options.getChannel("welcome_channel").id;
            leaveID = interaction.options.getChannel("leave_channel").id;
            if (data === undefined) {
                const constructor = new EmbedBuilder()
                    .setAuthor({name: `Set Up welcome and leave messages for ${interaction.guild.name}`})
                    .setDescription(`You're about to set up welcome and leave messages for this server.\n\n\`Welcome channel:\` <#${welcomeID}>\n\`Leave channel:\` <#${leaveID}>\n\nAre you sure that you want to use these channels?`)
                    .setColor(0x2b2d31)
                    .setTimestamp()
                    .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                let cancel = new ButtonBuilder()
                    .setCustomId('wlcm_cancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger);
                let confirm = new ButtonBuilder()
                    .setCustomId('wlcm_confirm')
                    .setLabel('Confirm')
                    .setStyle(ButtonStyle.Success);
                let row = new ActionRowBuilder()
                    .addComponents(cancel,confirm)
                const response = await interaction.editReply({embeds: [constructor], components: [row]})
                const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
                collector.on("collect", async i => {
                    if (i.user.id === interaction.user.id) {
                        switch (i.customId) {
                            case "wlcm_confirm":
                                await writeData(welcomeID,leaveID,guildId)
                                const confirmed = new EmbedBuilder()
                                    .setAuthor({name: `Set Up welcome and leave messages for ${interaction.guild.name}`})
                                    .setDescription(`Welcome and leave channels successfully set!`)
                                    .setColor(0x51f561)
                                    .setTimestamp()
                                    .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                                collector.stop("Commandhandled")
                                i.update({embeds: [confirmed], components: []})
                                break
                            case "wlcm_cancel":
                                const cancelled = new EmbedBuilder()
                                    .setAuthor({name: `Set Up welcome and leave messages for ${interaction.guild.name}`})
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
                await interaction.editReply("Welcome messages already enabled, run `/update-welcome` to edit the configuration of the Welcome messages.")
            }
        } else {
            await interaction.editReply("Please select a text channel for both welcome and leave channels!")
        }
    },
};
