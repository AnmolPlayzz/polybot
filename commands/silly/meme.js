const { ModalBuilder, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle } = require('discord.js');
const { mongo_client } = require("../../mongodb-helper")
const fetch = require('node-fetch');
const { selectRandom } = require("../../helpers")
const {r} = require("../../reddit-helper");
module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Get a random meme from reddit.'),
    async execute(interaction, client) {
        const subs=["memes","shitposting","dankmemes"]
        async function fetchData(){
            const sub = selectRandom(subs)
            try {
                return await r.getSubreddit(sub).getHot({
                    limit: 100
                });
            } catch(e) {
                console.log("Metwork error:\n", e)
                return;
            }
        }

        let nsfwAlert  = new EmbedBuilder()
            .setAuthor({name: `Possible NSFW content warning!`})
            .setColor(0x2b2d31)
            .setDescription(`The results from this command can contain extremely vulgar and NSFW content.\nDo you want to continue?`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });

        let cancel = new ButtonBuilder()
            .setCustomId('meme_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);
        let confirm = new ButtonBuilder()
            .setCustomId('meme_confirm')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success);
        let row = new ActionRowBuilder()
            .addComponents(cancel, confirm)
        const response = await interaction.reply({embeds: [nsfwAlert], components: [row],ephemeral: true})

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
        collector.on("collect", async i => {
            if (i.user.id === interaction.user.id) {
                if (i.customId === "meme_confirm") {
                    collector.stop("user-confirmed")
                    await i.update({content: "Fetching...", embeds: [], components: []})
                    const requestData = await fetchData()
                    let request = selectRandom(requestData)
                    while(request.domain==='v.redd.it') {
                        request=selectRandom(requestData)
                    }

                    const reqText = request.title;
                    const finalText = reqText.length + 1<=2048 ? reqText : reqText.slice(0,2001) + " ... Post is too long to fit in this embed, view full post for the complete text."
                    const responseEmbed = new EmbedBuilder()
                        .setAuthor({name: `View Full Post`, url: request.url})
                        .setDescription(finalText ? finalText : " ")
                        .setColor(0x2b2d31)
                        .setImage(request.url)
                        .setTimestamp()
                        .setFooter({text: `👍 ${request.score}`});
                    let next = new ButtonBuilder()
                        .setCustomId('meme_next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary);
                    let row = new ActionRowBuilder()
                        .addComponents(next)
                    const second_rs = await i.editReply({content: "", embeds: [responseEmbed], components: [row] })
                    const nextCollector = second_rs.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
                    nextCollector.on("collect", async res => {
                        if(res.customId==="meme_next") {
                            await res.deferUpdate({content: "fetching", embeds: [], components: []})
                            const requestData = await fetchData()
                            let request = selectRandom(requestData)
                            while(request.domain==='v.redd.it') {
                                request=selectRandom(requestData)
                            }

                            const reqText = request.title;
                            const finalText = reqText.length + 1<=2048 ? reqText : reqText.slice(0,2001) + " ... Post is too long to fit in this embed, view full post for the complete text."
                            const responseEmbed = new EmbedBuilder()
                                .setAuthor({name: `View Full Post`, url: request.url})
                                .setDescription(finalText ? finalText : " ")
                                .setColor(0x2b2d31)
                                .setImage(request.url)
                                .setTimestamp()
                                .setFooter({text: `👍 ${request.score}`});
                            await res.editReply({content: "", embeds: [responseEmbed], components: [row] })
                            nextCollector.resetTimer()
                        }
                    })
                    nextCollector.on("end", async int => {
                        await i.editReply({content: "Button timed out! Run the command again.", components: []})
                    })
                } else if (i.customId==="meme_cancel") {
                    const cancelled = new EmbedBuilder()
                        .setAuthor({name: `Meme`})
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