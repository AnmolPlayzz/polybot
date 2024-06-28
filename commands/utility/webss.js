const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder} = require('discord.js');
const puppeteer = require('puppeteer');
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
                .setMaxValue(60)),
    async execute(interaction, client) {
        await interaction.reply({content: "fetching...",ephemeral: true})
        const waitTime = interaction.options.getInteger("wait")*1000 || 3000
        const url = interaction.options.getString("url")
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setViewport({
                width: 1280,
                height: 720,
                deviceScaleFactor: 1,
            });
            await page.goto(url);
            await interaction.editReply({content: `Wait for ${waitTime / 1000} seconds...`, ephemeral: true})
            await wait(waitTime)
            const screenshotBuffer = await page.screenshot()
            await browser.close();
            console.log(url, interaction.user.username)
            const attachment = new AttachmentBuilder(screenshotBuffer, { name: 'screenshot.png' });
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