const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder} = require('discord.js');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const {networkInterfaces} = require("node:os");
const apiKey = process.env.WEBSS_API_KEY;
const apiAddress = process.env.WEBSS_API_ADDRESS;
function wait(time){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            resolve()} , time
        );
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('webss')
        .setDescription('Take a screenshot of a webpage.')
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('The URL to screenshot (include https:// section).')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('wait')
                .setDescription('Amount of time to wait before taking a screenshot in seconds. ')
                .setMinValue(0)
                .setMaxValue(10)),
    async execute(interaction, client) {
        await interaction.reply({content: "fetching...",ephemeral: true})
        const waitTime = interaction.options.getInteger("wait") || 1
        const url = interaction.options.getString("url")
        try {
            const req  = {
                url,
                key: apiKey,
                delay: waitTime
            }
            const response = await fetch(`https://secure.screeenly.com/api/v1/fullsize`, {
                method: 'POST',
                body: JSON.stringify(req),
                headers: {
                    "Content-type": "application/json",
                }
            })
            if (!response.ok) {
                throw new Error("error")
            }
            const data = await response.json()
            const attachment = new AttachmentBuilder(data.path, { name: 'screenshot.png' });
            await interaction.editReply({
                content: "Here's your screenshot!",
                files: [attachment],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error taking screenshot:', error);
            await interaction.editReply('Failed to take screenshot.');
        }
    }
};