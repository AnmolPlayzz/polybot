const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchLocations } = require("../../helpers.js")
const { fetchWeatherApi } = require('openmeteo');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('aqi')
        .setDescription('Get the current AQI data for a location.')
        .addStringOption(option =>
            option.setName('location')
                .setDescription('The location to get the AQI for')
                .setRequired(true)
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        let filtered = await fetchLocations(focusedValue);

        await interaction.respond(
            filtered.map((places) => {
                const val = `${places.latitude}|${places.longitude}|${places.name}`
                return {
                    name: places.name.length >= 100 ? places.name.slice(0, 95) + "..." : places.name,
                    value: val.length >= 100 ? val.slice(0, 95) + "..." : val
                }
            }),
        );
    },
    async execute(interaction, client) {
        await interaction.deferReply({ephemeral: true})
        const location = interaction.options.getString('location').split("|");
        if (location[1]===undefined) {
            await interaction.reply({content: "Invalid Location! Please select an option from the auto complete menu.",ephemeral: true})
            return;
        }
        const params = {
            "latitude": location[0],
            "longitude": location[1],
            "current": ["european_aqi", "us_aqi", "pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone", "dust", "uv_index", "uv_index_clear_sky"],
            "timezone": "auto"
        };
        const url = "https://air-quality-api.open-meteo.com/v1/air-quality";
        const responses = await fetchWeatherApi(url, params);
        const response = responses[0];
        const current = response.current()
        const utcOffsetSeconds = response.utcOffsetSeconds();
        const AQIData = {
            time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
            europeanAqi: current.variables(0).value(),
            usAqi: current.variables(1).value(),
            pm10: current.variables(2).value(),
            pm25: current.variables(3).value(),
            carbonMonoxide: current.variables(4).value(),
            nitrogenDioxide: current.variables(5).value(),
            sulphurDioxide: current.variables(6).value(),
            ozone: current.variables(7).value(),
            dust: current.variables(8).value(),
            uvIndex: current.variables(9).value(),
            uvIndexClearSky: current.variables(10).value(),
        };
        function computeSeverity(aqi) {
            if (aqi>=0 && aqi<=50) {
                return "🟢 Good"
            } else if (aqi>=51 && aqi<=100) {
                return "🟡 Moderate"
            } else if (aqi>=101 && aqi<=150){
                return "🟠 Unhealthy for Sensitive Individuals"
            } else if (aqi>=151 && aqi<=200) {
                return "🔴 Unhealthy"
            } else if (aqi>=201 && aqi<=300) {
                return "🟣 Very Unhealthy"
            } else if (aqi>300) {
                return "⚫ Extremely Unhealthy"
            }
        }
        const currentAQIEmbed = new EmbedBuilder()
            .setTitle(`Current AQI Data`)
            .setColor(0x2b2d31)
            .setDescription(`**Location:** ${location[2]}\n`+
                `**Latitude:** ${location[0]}\n` +
                `**Longitude:** ${location[1]}\n`)
            .addFields({name: "💨 - AQI", value: `${AQIData.usAqi.toFixed(1)} (${computeSeverity(AQIData.usAqi)})`, inline: false},
                {name: "PM₁₀ - Particulate Matter 10 micrometers", value: `${AQIData.pm10.toFixed(1) } μg/m³`, inline: true},
                {name: "PM⒉₅ - Particulate Matter 2.5 micrometers", value: `${AQIData.pm25.toFixed(1)} μg/m³`, inline: true},
                {name: "CO - Carbon Monoxide", value: `${AQIData.carbonMonoxide.toFixed(1)} μg/m³`, inline: true},
                {name: "NO₂ - Nitrogen Dioxide", value: `${AQIData.nitrogenDioxide.toFixed(1)} μg/m³`, inline: true},
                {name: "SO₂ - Sulphur Dioxide", value: `${AQIData.sulphurDioxide.toFixed(1)} μg/m³`, inline: true},
                {name: "O₃ - Ozone", value: `${AQIData.ozone.toFixed(1)} μg/m³`, inline: true},
                {name: "🫧 - Dust", value: `${AQIData.dust.toFixed(1)} μg/m³`, inline: true},
                {name: "☀ - UV Index", value: `\`Overall:\` ${AQIData.uvIndex.toFixed(1)}\n\`Clear Sky:\` ${AQIData.uvIndexClearSky.toFixed(1)}`, inline: true},
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag} | Location data provided by nominatim.org`, iconURL: interaction.user.avatarURL() });
        await interaction.editReply({embeds: [currentAQIEmbed]})
    },
};
