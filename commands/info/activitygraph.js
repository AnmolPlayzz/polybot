const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const QuickChart = require("quickchart-js")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('graph')
        .setDescription('Returns a graph respresenting a channel\'s message activity.')
        .addChannelOption(option =>
            option
                .setName('target')
                .setDescription('The channel to view activty graph of')),
    async execute(interaction, client) {
        const target = interaction.options.getChannel('target') || interaction.channel
        if(target.type===0) {
            await interaction.deferReply()
            let fe = []
            let messagesList = []
            let currentLastId;
            let initalRun = (await target.messages.fetch({
                limit: 1,
                cache: false,
                before: currentLastId
            })).forEach(e => messagesList.push(e))
            currentLastId = messagesList[0].id
            let nextMsgTs = Math.floor((await target.messages.fetch({
                limit: 1,
                cache: true,
                before: currentLastId
            })).at(0).createdTimestamp / 1000)
            while (nextMsgTs > Math.floor(messagesList[0].createdTimestamp / 1000) - 691200) {
                let fetched = await target.messages.fetch({limit: 100, cache: false, before: currentLastId})
                fetched.forEach(e => {
                    if (Math.floor(e.createdTimestamp / 1000) > Math.floor(messagesList[0].createdTimestamp / 1000) - 691200) {
                        messagesList.push(e)
                    }
                })
                currentLastId = messagesList[messagesList.length - 1].id
                const newData = await target.messages.fetch({
                    limit: 1,
                    cache: true,
                    before: currentLastId
                })
                if (newData.size !== 0) {
                    nextMsgTs = Math.floor(newData.at(0).createdTimestamp / 1000)
                } else {
                    nextMsgTs=null
                }
            } //fetches all messages upto 1 week, this is not a piece of code I'm gonna try to explain at all
            //1 day = 86400000 ms

            let labels = []
            let dataset = []
            for (let latestMessageTimestamp = messagesList[0].createdTimestamp - 86400000; latestMessageTimestamp >= messagesList[0].createdTimestamp - 604800000; latestMessageTimestamp -= 86400000) {
                const sorter = messagesList.filter(e => {
                    return e.createdTimestamp >= latestMessageTimestamp && latestMessageTimestamp + 86400000 >= e.createdTimestamp
                })
                const date = new Date(latestMessageTimestamp + 86400000)
                labels.push(`${date.getDate()}/${date.getUTCMonth() + 1}/${date.getFullYear()}`)
                dataset.push(sorter.length)
            }
            const finalDataSet = {
                labels: labels.reverse(),
                datasets: [{
                    label: 'Messages',
                    data: dataset.reverse()
                }]
            }

            const myChart = new QuickChart()
            myChart.setConfig({
                type: 'line',
                data: finalDataSet,
            });
            myChart.setBackgroundColor("rgb(33, 33, 33")
            const str_q = myChart.getUrl()
            let chartEmbed = new EmbedBuilder()
                .setAuthor({name: `Activity graph for '${target.name}' over the last week.`})
                .setColor(0x2b2d31)
                .setImage(str_q)
                .setTimestamp()
                .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
            await interaction.editReply({embeds: [chartEmbed]})
        } else {
            interaction.reply({content: "Unsupported channel type", ephemeral: true})
        }
    },
};
