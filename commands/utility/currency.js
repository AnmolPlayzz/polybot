const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const currency = require("../../currency.json")
const { fetchData } = require("../../helpers.js")
fetchData()
    .catch((e) => console.error(e));
module.exports = {
    data: new SlashCommandBuilder()
        .setName('currency-convert')
        .setDescription('Convert currencies.')
        .addStringOption(option =>
            option.setName('input_currency')
                .setDescription('The currency to convert from')
                .setAutocomplete(true)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('output_currency')
                .setDescription('The currency to convert to')
                .setAutocomplete(true)
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('value')
                .setDescription('The currency to convert to')
                .setRequired(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices = currency.currencyData
        const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()) || choice.code.toLowerCase().includes(focusedOption.value.toLowerCase()));
        await interaction.respond(
            filtered.filter((_,i)=>i<=24).map(choice => ({ name: choice.name+" - "+choice.code, value: choice.code })),
        );
    },
    async execute(interaction, client) {
        await interaction.deferReply()
        await fetchData()
        const input = interaction.options.getString('input_currency');
        const output = interaction.options.getString('output_currency');
        const value = interaction.options.getInteger('value');
        const inValue = currency.currencyData.filter((val) => val.code === input ? val.inBase : false).pop().inBase;
        const outValue = currency.currencyData.filter((val) => val.code === output ? val.inBase : false).pop().inBase;
        const baseValue = value / inValue
        const convertedValue = (baseValue * outValue).toFixed(2);
        const in_ = currency.currencyData.filter((val) => val.code === input ? val : false).pop();
        const out = currency.currencyData.filter((val) => val.code === output ? val : false).pop();
        const Embed = new EmbedBuilder()
            .setTitle(`Currency converter`)
            .setColor(0x2b2d31)
            .setDescription(`**Data Last Update:** <t:${String(currency.lastUpdate).slice(0,10)}:F>\n`)
            .addFields({name: "Input Currency", value: `${in_.symbol} ${value.toFixed(2)}`, inline: true},
                {name: "Output currency", value: `${out.symbol} ${convertedValue}`, inline: true},
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`});
        await interaction.editReply({embeds: [Embed]})
    }
};