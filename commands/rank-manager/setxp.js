const { ModalBuilder, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle } = require('discord.js');
const { mongo_client } = require("../../mongodb-helper")
const { calculateLevel, calculateXp } = require("../../helpers");
module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-xp')
        .setDescription('Set the xp for a user on this server.')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to set the xp of.')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('xp')
                .setDescription('The xp to set.')
                .setRequired(true))
        .setDefaultMemberPermissions(32), //manage server
    async execute(interaction, client) {
        await interaction.deferReply()
        const target = interaction.options.getUser('target')
        try {
            await interaction.guild.members.fetch(target)
        } catch(e) {
            if (e.message==="Unknown Member") {
                await interaction.editReply("This user is not in this server.")
                return;
            }
            console.log(e)
        }
        const xp = interaction.options.getInteger('xp')
        const level = calculateLevel(xp);
        if (level===Infinity || isNaN(level)) {
            await interaction.editReply("The xp you're entering is likely way too big. If you wish to play with high levels, use `/set-level`.")
            return;
        }
        let guildId = `${interaction.guild.id}`
        const db = mongo_client.db("polybot");
        const collection = db.collection('rank_server');
        const data = (await collection.find({ guildId: guildId }).toArray()).at(0)
        if (target.bot) {
            await interaction.editReply("This user is a bot.")
            return;
        }

        async function updateData(guildId,userId) {
            const collectionUser =db.collection("rank_user")
            const [dataUser] = await collectionUser.aggregate([
                {
                    $match: {
                        userId: `${userId}`,
                        levels: { $elemMatch: { serverId: `${guildId}` } }
                    }
                },
                {
                    $unwind: "$levels" // Deconstruct the levels array into separate documents
                },
                {
                    $match: { "levels.serverId": `${guildId}` } // Filter again for exact serverId match
                },
                {
                    $project: {
                        _id: 0, // Exclude unnecessary _id field
                        levelData: "$levels" // Project only the desired level object
                    }
                }
            ]).toArray()
            const dataUserOverall = await collectionUser.find({userId: userId}).toArray()
            if(dataUser || dataUserOverall.length>0) {
                let filter = dataUser ? {
                    userId: `${userId}`,
                    levels: { $elemMatch: { serverId: `${guildId}` } }
                } : {
                    userId: `${userId}`,
                };
                let updater = dataUser ? {
                    $set: { "levels.$": { // Update the matched element within the levels array
                            serverId: `${guildId}`, // Update serverId if needed (optional)
                            totalXp: `${xp}`,
                            level: `${level}`
                        } }
                } : {
                    $push: {
                        levels: {
                            serverId: `${guildId}`,
                            totalXp: `${xp}`,
                            level: `${level}`
                        }
                    }
                };
                const update= await collectionUser.updateOne(
                    filter,
                    updater
                );
            } else {
                await collectionUser.insertOne({
                    "userId": `${userId}`,
                    "levels": [
                        {
                            "serverId": `${guildId}`,
                            "totalXp": `${xp}`,
                            "level": `${level}`
                        }
                    ]
                });
            }
        }
        if (data !== undefined) {
            const constructor = new EmbedBuilder()
                .setAuthor({name: `Set xp for ${target.username}`})
                .setDescription(`You're about to change the level and xp for ${target} to the following:\n- Level: ${level}\n- XP: ${xp}\nAre you sure that you want to continue?`)
                .setColor(0x2b2d31)
                .setTimestamp()
                .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
            let cancel = new ButtonBuilder()
                .setCustomId('rank_setxp_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger);
            let confirm = new ButtonBuilder()
                .setCustomId('rank_setxp_confirm')
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success);
            let row = new ActionRowBuilder()
                .addComponents(cancel,confirm)
            const response = await interaction.editReply({embeds: [constructor], components: [row]})
            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
            collector.on("collect", async i => {
                if (i.user.id === interaction.user.id) {
                    switch (i.customId) {
                        case "rank_setxp_confirm":
                            await updateData(guildId,target.id)
                            const confirmed = new EmbedBuilder()
                                .setAuthor({name: `Set xp for ${target.username}`})
                                .setDescription(`Updated xp for ${target}!`)
                                .setColor(0x51f561)
                                .setTimestamp()
                                .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                            collector.stop("Commandhandled")
                            i.update({embeds: [confirmed], components: []})
                            break
                        case "rank_setxp_cancel":
                            const cancelled = new EmbedBuilder()
                                .setAuthor({name: `Set xp for ${target.username}`})
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
            await interaction.editReply("The rank module is disabled on this server.")
        }
    },
};
