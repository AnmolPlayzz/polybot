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
        let subs=["memes","shitposting","dankmemes"]
        async function fetchData(){
            const sub = selectRandom(subs)
            try {
                const list = await r.getSubreddit(sub).getHot({
                    limit: 100
                });
                const listTop = await r.getSubreddit(sub).getTop({
                    limit: 100
                });
                const listNew  = await r.getSubreddit(sub).getNew({
                    limit: 100
                });
                const newList = [...list,...listTop,...listNew]
                subs=subs.filter((val) => val!==sub)
                return newList.filter((req) => req.domain !== 'v.redd.it')
            } catch(e) {
                console.log("Network error:\n", e)
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
                    let requestData = await fetchData()
                    let request = selectRandom(requestData)
                    let currentImage=request.url
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
                    let save = new ButtonBuilder()
                        .setCustomId('meme_save')
                        .setLabel('Save')
                        .setStyle(ButtonStyle.Secondary);
                    let row = new ActionRowBuilder()
                        .addComponents(next,save)
                    const second_rs = await i.editReply({content: "", embeds: [responseEmbed], components: [row] })
                    const nextCollector = second_rs.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
                    nextCollector.on("collect", async res => {
                        if(res.customId==="meme_next") {
                            await res.deferUpdate({content: "Fetching...", embeds: [], components: []})

                            if (requestData.length === 1 && subs.length === 0) {
                                await res.editReply({content: "## Looks like I'm out of memes!\nThere are no more unique memes to see, you could run the command again but you will probably see the same memes over again. Run the command again in 24 hours for new content!", embeds: [], components: [] })
                                return
                            }
                            if (requestData.length<=3 && subs.length>=1) {
                                const requestDataNew = await fetchData()
                                requestData = [...requestDataNew]
                            }

                            let request = selectRandom(requestData)
                            const reqText = request.title;
                            currentImage=request.url
                            const finalText = reqText.length + 1<=2048 ? reqText : reqText.slice(0,2001) + " ... Post is too long to fit in this embed, view full post for the complete text."
                            const responseEmbed = new EmbedBuilder()
                                .setAuthor({name: `View Full Post`, url: request.url})
                                .setDescription(finalText ? finalText : " ")
                                .setColor(0x2b2d31)
                                .setImage(request.url)
                                .setTimestamp()
                                .setFooter({text: `👍 ${request.score}`});
                            await res.editReply({content: "", embeds: [responseEmbed], components: [row] })
                            requestData = requestData.filter((data) => {
                                return data.url !== request.url
                            })
                            nextCollector.resetTimer()
                        } else if (res.customId==="meme_save") {

                            try {
                                const dmEmbed = new EmbedBuilder()
                                    .setTitle(`Sent from ${interaction.guild.name} using the /meme command.`)
                                    .setColor(0x2b2d31)
                                    .setImage(currentImage)
                                    .setTimestamp()
                                await res.user.send({embeds: [dmEmbed]})
                                res.acknowledged ? await res.followUp({content: "Sent to your DMs!",ephemeral: true}) : await res.reply({content: "Sent to your DMs!",ephemeral: true})
                            } catch(e) {
                                res.acknowledged ? await res.followUp({content: "Could not DM you with the meme. It is likely that you have DMs disabled/you blocked the bot.",ephemeral: true}) : await res.reply({content: "Could not DM you with the meme. It is likely that you have DMs disabled/you blocked the bot.",ephemeral: true})
                            }
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
