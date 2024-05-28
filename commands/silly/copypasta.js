const { ModalBuilder, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle } = require('discord.js');
const { mongo_client } = require("../../mongodb-helper")
const fetch = require('node-fetch');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('copypasta')
        .setDescription('Get a random copy-pasta from reddit.'),
    async execute(interaction, client) {

        async function fetchData(){
            const res = await fetch('https://www.reddit.com/r/copypasta/random/.json')
            try {
                return await res.json()
            } catch(e) {
                console.log("Metwork error:\n", e)
                console.log(res)
                return;
            }
        }

        let nsfwAlert  = new EmbedBuilder()
            .setAuthor({name: `Possible NSFW content warning!`})
            .setColor(0x2b2d31)
            .setDescription(`The results from this command can contain extremely vulgar and NSFW content, though it's just text - it can still be disturbing.\nDo you want to continue?`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });

        let cancel = new ButtonBuilder()
            .setCustomId('copypasta_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);
        let confirm = new ButtonBuilder()
            .setCustomId('copypasta_confirm')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success);
        let row = new ActionRowBuilder()
            .addComponents(cancel, confirm)
        const response = await interaction.reply({embeds: [nsfwAlert], components: [row],ephemeral: true})

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
        collector.on("collect", async i => {
            if (i.user.id === interaction.user.id) {
                if (i.customId === "copypasta_confirm") {
                    collector.stop("user-confirmed")
                    await i.update({content: "Fetching...", embeds: [], components: []})
                    const request = await fetchData()
                    const reqText = request.at(0).data.children.at(0).data.selftext;
                    const finalText = reqText.length<=2048 ? reqText : reqText.slice(0,2001) + " ... Post is too long to fit in this embed, view full post for the complete text."

                    const responseEmbed = new EmbedBuilder()
                        .setAuthor({name: `View Full Post`, url: request.at(0).data.children.at(0).data.url})
                        .setDescription(finalText.length===0 ? "__no text__" : finalText)
                        .setColor(0x2b2d31)
                        .setTimestamp()
                        .setFooter({text: `👍 ${request.at(0).data.children.at(0).data.score}`});


                    let next = new ButtonBuilder()
                        .setCustomId('copypasta_next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary);
                    let row = new ActionRowBuilder()
                        .addComponents(next)
                    const second_rs = await i.editReply({content: "", embeds: [responseEmbed], components: [row] })
                    const nextCollector = second_rs.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
                    nextCollector.on("collect", async res => {
                        if(res.customId==="copypasta_next") {
                            await res.deferUpdate()
                            const request = await fetchData()
                            const reqText = request.at(0).data.children.at(0).data.selftext;
                            const finalText = reqText.length<=2048 ? reqText : reqText.slice(0,2001) + " ... Post is too long to fit in this embed, view full post for the complete text."
                            const responseEmbed = new EmbedBuilder()
                                .setAuthor({name: `View Full Post`, url: request.at(0).data.children.at(0).data.url})
                                .setDescription(finalText.length===0 ? "__no text__" : finalText)
                                .setColor(0x2b2d31)
                                .setTimestamp()
                                .setFooter({text: `👍 ${request.at(0).data.children.at(0).data.score}`});
                            await res.editReply({content: "", embeds: [responseEmbed], components: [row] })
                            nextCollector.resetTimer()
                        }
                    })
                    nextCollector.on("end", async int => {
                        await i.editReply({content: "Button timed out! Run the command again.", components: []})
                    })
                } else if (i.customId==="copypasta_cancel") {
                    const cancelled = new EmbedBuilder()
                        .setAuthor({name: `Copypasta`})
                        .setDescription(`Action cancelled!`)
                        .setColor(0xff2643)
                        .setTimestamp()
                        .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
                    i.update({embeds: [cancelled], components: []})
                    collector.stop("Commenthandled")
                }
            }
        })
        collector.on("end", async i => {
            if (collector.endReason==="time") {
                cancel.setDisabled(true)
                confirm.setDisabled(true)
                row = new ActionRowBuilder()
                    .addComponents(cancel, confirm)
                await interaction.editReply({content: "You did not respond in time! run the command again.", embeds: [nsfwAlert], components: [row]})
            }
        })
    },
};
