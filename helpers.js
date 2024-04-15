// Helper functions
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle } = require('discord.js');
//Pager - comvert array to paged embeds
/*
interaction - Interaction to which the embeds are responding
arr - Array
brp - Break Point (each page should have [bpr] items)
joiner - what string should be used to join each element
author_text - text to be shown in author field of each embed
title - title of each embed
color - color of embed
interval - time after which menu is disabled
*/
const pager = async (interaction, arr, brp, joiner, author_text, title, color=0x2b2d31,interval = 60_000) => {
    page_list = []
    for (let i=0;i<arr.length;i+=brp) {
        page_list.push(arr.slice(i,i+brp))
    }

    page_list_embed = page_list.map(e => {
        let embed_template = new EmbedBuilder()
            .setColor(color)
            .setDescription(e.join(joiner))
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        author_text ? embed_template.setAuthor({name: author_text}) : ""
        title ? embed_template.setTitle(title) : ""
        return embed_template
    })
    itr=0 //page number - iterator

    const prev = new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('<')
        .setStyle(ButtonStyle.Primary);

    let display = new ButtonBuilder()
        .setCustomId("display_bar")
        .setLabel(`${itr+1}/${page_list_embed.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)

    const next = new ButtonBuilder()
        .setCustomId('next')
        .setLabel('>')
        .setStyle(ButtonStyle.Primary);

    let row = new ActionRowBuilder()
        .addComponents(prev, display, next);

    const response = await interaction.reply({embeds: [page_list_embed[itr]],components: [row]})
    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: interval });
    function updateDisplay(itr) {
        display = new ButtonBuilder()
            .setCustomId("display_bar")
            .setLabel(`${itr+1}/${page_list_embed.length}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
    }
    collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
            switch (i.customId) {
                case "next":
                    if (itr+1===page_list_embed.length) {
                        itr=0
                    } else {
                        itr++
                    }
                    updateDisplay(itr)
                    row = new ActionRowBuilder()
                        .addComponents(prev, display, next);
                    await i.update({embeds: [page_list_embed[itr]],components: [row]})
                    break
                case "prev":
                    if (itr===0) {
                        itr=page_list_embed.length-1
                    } else {
                        itr--
                    }
                    updateDisplay(itr)
                    row = new ActionRowBuilder()
                        .addComponents(prev, display, next);
                    await i.update({embeds: [page_list_embed[itr]],components: [row]})
                    break
            }
            collector.resetTimer()
        } else {
            i.reply({ content: `These buttons aren't for you!`, ephemeral: true });
        }
    });
    collector.on("end", async i => {
        prev.setDisabled(true)
        next.setDisabled(true)
        row = new ActionRowBuilder()
            .addComponents(prev, display, next);
        await interaction.editReply({components: [row]})
    })
}

module.exports.pager = pager