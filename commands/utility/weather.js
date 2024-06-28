const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType, } = require('discord.js');
const { fetchLocations } = require("../../helpers.js")
const { fetchWeatherApi } = require('openmeteo');
const moment = require('moment-timezone');
const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]
const day = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get weather data for a location.')
        .addStringOption(option =>
            option.setName('location')
                .setDescription('The location to get the weather for')
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
        const location = interaction.options.getString('location').split("|");
        if (location[1]===undefined) {
            await interaction.reply({content: "Invalid Location! Please select an option from the auto complete menu.",ephemeral: true})
            return;
        }
        const initialEmbed = new EmbedBuilder()
            .setTitle(`Weather Info`)
            .setColor(0x2b2d31)
            .setDescription(`**Location:** ${location[2]}\n**Latitude:** ${location[0]}\n**Longitude:** ${location[1]}\n\nSelect one of the fetching options from the below menu.`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag} | Location data provided by nominatim.org`, iconURL: interaction.user.avatarURL() });
        const modeSelector = new StringSelectMenuBuilder()
            .setCustomId('weather_mode')
            .setPlaceholder('')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Current Weather')
                    .setDescription('Fetch the current weather conditions')
                    .setValue('current'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Daily Forecast')
                    .setDescription('Get daily forecast data for the next 7 days')
                    .setValue('daily'),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Hourly Forecast")
                    .setDescription("Get hourly forecast data for the next 7 days.")
                    .setValue("hourly"),
            )
        const modeSelectorRow = new ActionRowBuilder()
            .addComponents(modeSelector)
        const response = await interaction.reply({embeds: [initialEmbed], components: [modeSelectorRow],ephemeral: true});
        const backButton = new ButtonBuilder()
            .setCustomId(`weather_back`)
            .setLabel("← Back")
            .setStyle(ButtonStyle.Secondary)
        const backButtonRow = new ActionRowBuilder()
            .addComponents(backButton)
        const collector = response.createMessageComponentCollector({time: 600_000})
        //Daily data
        const params = {
            "latitude": location[0],
            "longitude": location[1],
            "daily": ["weather_code", "temperature_2m_max", "temperature_2m_min", "apparent_temperature_max", "apparent_temperature_min", "sunrise", "sunset", "daylight_duration", "sunshine_duration", "uv_index_max", "uv_index_clear_sky_max", "precipitation_sum", "rain_sum", "showers_sum", "snowfall_sum", "precipitation_hours", "precipitation_probability_max", "wind_speed_10m_max", "wind_gusts_10m_max", "wind_direction_10m_dominant"],
            "hourly": ["temperature_2m", "relative_humidity_2m", "dew_point_2m", "apparent_temperature", "precipitation_probability", "precipitation", "rain", "showers", "snowfall", "snow_depth", "weather_code", "pressure_msl", "surface_pressure", "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high", "visibility", "wind_speed_10m", "wind_speed_80m", "wind_speed_120m", "wind_speed_180m", "wind_direction_10m", "wind_direction_80m", "wind_direction_120m", "wind_direction_180m", "wind_gusts_10m", "temperature_80m", "temperature_120m", "temperature_180m", "uv_index"],
            "timezone": "auto"
        };
        const url = "https://api.open-meteo.com/v1/forecast";
        const responses = await fetchWeatherApi(url, params);
        const range = (start, stop, step) =>
            Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);
        const responseDaily = responses[0];
        const utcOffsetSeconds = responseDaily.utcOffsetSeconds();
        const timezone = responseDaily.timezone();
        const timezoneAbbreviation = responseDaily.timezoneAbbreviation();
        const daily = responseDaily.daily();
        const hourly = responseDaily.hourly();
        const dailyData = {
            time: range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
                (t) => {
                    const date = new Date((t + utcOffsetSeconds) * 1000)
                    return `${day[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
                }
            ),
            weatherCode: daily.variables(0).valuesArray(),
            temperature2mMax: daily.variables(1).valuesArray(),
            temperature2mMin: daily.variables(2).valuesArray(),
            apparentTemperatureMax: daily.variables(3).valuesArray(),
            apparentTemperatureMin: daily.variables(4).valuesArray(),
            sunrise: daily.variables(5).valuesArray(),
            sunset: daily.variables(6).valuesArray(),
            daylightDuration: daily.variables(7).valuesArray(),
            sunshineDuration: daily.variables(8).valuesArray(),
            uvIndexMax: daily.variables(9).valuesArray(),
            uvIndexClearSkyMax: daily.variables(10).valuesArray(),
            precipitationSum: daily.variables(11).valuesArray(),
            rainSum: daily.variables(12).valuesArray(),
            showersSum: daily.variables(13).valuesArray(),
            snowfallSum: daily.variables(14).valuesArray(),
            precipitationHours: daily.variables(15).valuesArray(),
            precipitationProbabilityMax: daily.variables(16).valuesArray(),
            windSpeed10mMax: daily.variables(17).valuesArray(),
            windGusts10mMax: daily.variables(18).valuesArray(),
            windDirection10mDominant: daily.variables(19).valuesArray(),
        };
        const hourlyData = {
            time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
                (t) => {
                    const APIDate = moment.tz(t*1000, Intl.DateTimeFormat().resolvedOptions().timeZone).tz(timezone);
                    return APIDate
                }
            ),
            temperature2m: hourly.variables(0).valuesArray(),
            relativeHumidity2m: hourly.variables(1).valuesArray(),
            dewPoint2m: hourly.variables(2).valuesArray(),
            apparentTemperature: hourly.variables(3).valuesArray(),
            precipitationProbability: hourly.variables(4).valuesArray(),
            precipitation: hourly.variables(5).valuesArray(),
            rain: hourly.variables(6).valuesArray(),
            showers: hourly.variables(7).valuesArray(),
            snowfall: hourly.variables(8).valuesArray(),
            snowDepth: hourly.variables(9).valuesArray(),
            weatherCode: hourly.variables(10).valuesArray(),
            pressureMsl: hourly.variables(11).valuesArray(),
            surfacePressure: hourly.variables(12).valuesArray(),
            cloudCover: hourly.variables(13).valuesArray(),
            cloudCoverLow: hourly.variables(14).valuesArray(),
            cloudCoverMid: hourly.variables(15).valuesArray(),
            cloudCoverHigh: hourly.variables(16).valuesArray(),
            visibility: hourly.variables(17).valuesArray(),
            windSpeed10m: hourly.variables(18).valuesArray(),
            windSpeed80m: hourly.variables(19).valuesArray(),
            windSpeed120m: hourly.variables(20).valuesArray(),
            windSpeed180m: hourly.variables(21).valuesArray(),
            windDirection10m: hourly.variables(22).valuesArray(),
            windDirection80m: hourly.variables(23).valuesArray(),
            windDirection120m: hourly.variables(24).valuesArray(),
            windDirection180m: hourly.variables(25).valuesArray(),
            windGusts10m: hourly.variables(26).valuesArray(),
            temperature80m: hourly.variables(27).valuesArray(),
            temperature120m: hourly.variables(28).valuesArray(),
            temperature180m: hourly.variables(29).valuesArray(),
            uvIndex: hourly.variables(30).valuesArray(),
        }
        console.log(hourlyData)
        const parsedOptions = dailyData.time.map((time,index) => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(time)
                .setValue(`weather__daily_${index}`)
        })
        const timeArrayHourlyA = []
        for (let index = 0; index < hourlyData.time.length; index+=24) {
            timeArrayHourlyA.push(hourlyData.time[index].format("DD MMMM YYYY"))
        }
        const timeArrayHourly  = timeArrayHourlyA.map((el,inx) => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(el)
                .setValue(`${inx}`)
        })
        const hourArrayHourlyA = []
        for (let index = 0; index < 24; index++) {
            hourArrayHourlyA.push(hourlyData.time[index].format("LT"))
        }
        const hourArrayHourly = hourArrayHourlyA.map((el,inx) => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(el)
                .setValue(`${inx}`)
        })
        const dailyDateSelector = new StringSelectMenuBuilder()
            .setCustomId('weather__daily')
            .setPlaceholder('Select date.')
            .addOptions(...parsedOptions)
        const dailyDateSelectorRow = new ActionRowBuilder()
            .addComponents(dailyDateSelector)
        function generateEmbed(index) {
            return new EmbedBuilder()
                .setTitle(`Daily Weather Forecasts`)
                .setColor(0x2b2d31)
                .setDescription(`**Location:** ${location[2]}\n`+
                    `**Latitude:** ${location[0]}\n` +
                    `**Longitude:** ${location[1]}\n` +
                    `**Date:** ${dailyData.time[index]}`)
                .addFields({name: "🌡 Temperature", value: `\`Max:\` ${dailyData.temperature2mMax[index].toFixed(1)} °C\n\`Min:\` ${dailyData.temperature2mMin[index].toFixed(1)} °C`, inline: true},
                    {name: "🌤 Apparent Temperature", value: `\`Max:\` ${dailyData.apparentTemperatureMax[index].toFixed(1)} °C\n\`Min:\` ${dailyData.apparentTemperatureMin[index].toFixed(1)} °C`, inline: true},
                    {name: "☀ Daylight", value: `\`Daylight Duration:\` ${(dailyData.daylightDuration[index]/3600).toFixed(1)} Hrs\n\`Sunshine Duration:\` ${(dailyData.sunshineDuration[index]/3600).toFixed(1)} Hrs`, inline: true},
                    {name: "💨 Max Wind Speed", value: `${dailyData.windSpeed10mMax[index].toFixed(1)} km/h`, inline: true},
                    {name: "🎐 Max Wind Gusts", value: `${dailyData.windGusts10mMax[index].toFixed(1)} km/h`, inline: true},
                    {name: "🧭 Dominant Wind Direction", value: `${dailyData.windDirection10mDominant[index].toFixed(1)} °`, inline: true},
                    {name: "⚠ UV Index", value: `\`Max:\` ${dailyData.uvIndexMax[index].toFixed(1)}\n\`Clear sky:\` ${dailyData.uvIndexClearSkyMax[index].toFixed(1)}`, inline: true},
                    {name: "💧 Precipitation", value: `\`Probability:\` ${dailyData.precipitationProbabilityMax[index].toFixed(1)} %\n\`Hours:\` ${dailyData.precipitationHours[index]} Hrs\n\`Amount:\` ${dailyData.precipitationSum[index].toFixed(1)} mm`, inline: true},
                    {name: "🌧 Rain", value: `${dailyData.rainSum[index].toFixed(1)} mm`, inline: true},
                    {name: "☔ Showers", value: `${dailyData.showersSum[index].toFixed(1)} mm`, inline: true},
                    {name: "🌨 Snow", value: `${dailyData.snowfallSum[index].toFixed(1)} cm`, inline: true},
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() })
        }
        function generateHourlyEmbed(day,hour) {
            const index = day*24+hour;
            console.log(index)
            return new EmbedBuilder()
                .setTitle(`Hourly Weather Forecasts`)
                .setColor(0x2b2d31)
                .setDescription(`**Location:** ${location[2]}\n`+
                    `**Latitude:** ${location[0]}\n` +
                    `**Longitude:** ${location[1]}\n` +
                    `**Date:** ${timeArrayHourlyA[day]}\n` +
                    `**Hour:** ${hourArrayHourlyA[hour]}`)
                .addFields({name: "🌡 Temperature (by height from ground)", value: `\`2m:\` ${hourlyData.temperature2m[index].toFixed(1)} °C\n\`80m:\` ${hourlyData.temperature80m[index].toFixed(1)} °C\n\`120m:\` ${hourlyData.temperature120m[index].toFixed(1)} °C\n\`180m:\` ${hourlyData.temperature180m[index].toFixed(1)} °C`, inline: true},
                    {name: "🌤 Apparent Temperature", value: `${hourlyData.apparentTemperature[index].toFixed(1)} °C`, inline: true},
                    {name: "💦 Relative Humidity", value: `${hourlyData.relativeHumidity2m[index] } %`, inline: true},
                    {name: "💠 Dew Point", value: `${hourlyData.dewPoint2m[index].toFixed(1)} °C`, inline: true},
                    {name: "💨 Wind Speed (by height from ground)", value: `\`10m:\` ${hourlyData.windSpeed10m[index].toFixed(1)} Km/h\n\`80m:\` ${hourlyData.windSpeed80m[index].toFixed(1)} Km/h\n\`120m:\` ${hourlyData.windSpeed120m[index].toFixed(1)} Km/h\n\`180m:\` ${hourlyData.windSpeed120m[index].toFixed(1)} Km/h`, inline: true},
                    {name: "🧭 Wind Direction (be height from ground)", value: `\`10m:\` ${hourlyData.windDirection10m[index].toFixed(1)} °\n\`80m:\` ${hourlyData.windDirection80m[index].toFixed(1)} °\n\`120m:\` ${hourlyData.windDirection120m[index].toFixed(1)} °\n\`180m:\` ${hourlyData.windSpeed180m[index].toFixed(1)} °`, inline: true},
                    {name: "🎐 Wind Gusts", value: `${hourlyData.windGusts10m[index].toFixed(1)} km/h`, inline: true},
                    {name: "👓 Visibility", value: `${hourlyData.visibility[index]} m`, inline: true},
                    {name: "⚠ UV Index", value: `${hourlyData.uvIndex[index].toFixed(1)}`, inline: true},
                    {name: "💧 Precipitation", value: `\`Probability:\` ${hourlyData.precipitationProbability[index].toFixed(1)} %\n\`Amount:\` ${hourlyData.precipitation[index].toFixed(1)} mm`, inline: true},
                    {name: "🌧 Rain", value: `${hourlyData.rain[index].toFixed(1)} mm`, inline: true},
                    {name: "☔ Showers", value: `${hourlyData.showers[index].toFixed(1)} mm`, inline: true},
                    {name: "🌨 Snow", value: `${hourlyData.snowfall[index].toFixed(1)} cm`, inline: true},
                    {name: "🫧 Pressure", value: `${hourlyData.pressureMsl[index].toFixed(1)} hPa`, inline: true},
                    {name: "📍 Surface Pressure", value: `${hourlyData.surfacePressure[index].toFixed(1)} hPa`, inline: true},
                    {name: "☁ Cloud Cover", value: `\`Overall:\` ${hourlyData.cloudCover[index].toFixed(1)} %\n\`Low:\` ${hourlyData.cloudCoverLow[index].toFixed(1)} %\n\`Mid:\` ${hourlyData.cloudCoverMid[index].toFixed(1)} %\n\`High:\` ${hourlyData.cloudCoverHigh[index].toFixed(1)} %\n`}
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() })
        }

        const hourlyDateSelector = new StringSelectMenuBuilder()
            .setCustomId('weather__hourly__date')
            .setPlaceholder('Select date.')
            .addOptions(...timeArrayHourly)
        const hourlyDateSelectorRow = new ActionRowBuilder()
            .addComponents(hourlyDateSelector)

        const hourlyHourSelector = new StringSelectMenuBuilder()
            .setCustomId('weather__hourly__hour')
            .setPlaceholder('Select hour of day.')
            .addOptions(...hourArrayHourly)
        const hourlyHourSelectorRow = new ActionRowBuilder()
            .addComponents(hourlyHourSelector)
        let daySelected=0
        let hourSelected=0

        collector.on("collect", async i => {
            if (i.user.id === interaction.user.id && i.customId === "weather_mode") {
                collector.resetTimer()
                await i.deferUpdate()
                if (i.values[0]==="current") {
                    const params = {
                        "latitude": location[0],
                        "longitude": location[1],
                        "current": ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day", "precipitation", "rain", "showers", "snowfall", "weather_code", "cloud_cover", "pressure_msl", "surface_pressure", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"],
                        "timeformat": "unixtime"
                    };
                    const url = "https://api.open-meteo.com/v1/forecast";
                    const responses = await fetchWeatherApi(url, params);
                    const response = responses[0];
                    const utcOffsetSeconds = response.utcOffsetSeconds();
                    const current = response.current();
                    const currentData = {
                            time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
                            temperature2m: current.variables(0).value(),
                            relativeHumidity2m: current.variables(1).value(),
                            apparentTemperature: current.variables(2).value(),
                            isDay: current.variables(3).value(),
                            precipitation: current.variables(4).value(),
                            rain: current.variables(5).value(),
                            showers: current.variables(6).value(),
                            snowfall: current.variables(7).value(),
                            weatherCode: current.variables(8).value(),
                            cloudCover: current.variables(9).value(),
                            pressureMsl: current.variables(10).value(),
                            surfacePressure: current.variables(11).value(),
                            windSpeed10m: current.variables(12).value(),
                            windDirection10m: current.variables(13).value(),
                            windGusts10m: current.variables(14).value(),

                    };
                    const currentWeatherEmbed = new EmbedBuilder()
                        .setTitle(`Current Weather Conditions`)
                        .setColor(0x2b2d31)
                        .setDescription(`**Location:** ${location[2]}\n`+
                        `**Latitude:** ${location[0]}\n` +
                        `**Longitude:** ${location[1]}\n` +
                        `**Last Update Time:** ${currentData.time} (${currentData.isDay === 1 ? "Day" : "Night"})\n` +
                        `**WMO Weather code:** ${currentData.weatherCode}`)
                        .addFields({name: "🌡 Temperature", value: `${currentData.temperature2m.toFixed(1)} °C`, inline: true},
                            {name: "🌤 Apparent Temperature", value: `${currentData.apparentTemperature.toFixed(1)} °C`, inline: true},
                            {name: "💦 Relative Humidity", value: `${currentData.relativeHumidity2m } %`, inline: true},
                            {name: "💨 Wind Speed", value: `${currentData.windSpeed10m.toFixed(1)} km/h`, inline: true},
                            {name: "🎐 Wind Gusts", value: `${currentData.windGusts10m.toFixed(1)} km/h`, inline: true},
                            {name: "🧭 Wind Direction", value: `${currentData.windDirection10m.toFixed(1)} °`, inline: true},
                            {name: "🫧 Pressure", value: `${currentData.pressureMsl.toFixed(1)} hPa`, inline: true},
                            {name: "📍 Surface Pressure", value: `${currentData.surfacePressure.toFixed(1)} hPa`, inline: true},
                            {name: "☁ Cloud Cover", value: `${currentData.cloudCover} %`, inline: true},
                            {name: "💧 Precipitation", value: `${currentData.precipitation.toFixed(1)} mm`, inline: true},
                            {name: "🌧 Rain", value: `${currentData.rain.toFixed(1)} mm`, inline: true},
                            {name: "☔ Showers", value: `${currentData.showers.toFixed(1)} mm`, inline: true},
                            {name: "🌨 Snow", value: `${currentData.snowfall.toFixed(1)} cm`, inline: true},
                        )
                        .setTimestamp()
                        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
                    await i.editReply({embeds: [currentWeatherEmbed], components: [backButtonRow]})
                } else if (i.values[0]==="daily") {
                    const embed = generateEmbed(0)
                    const second_rs = await i.editReply({embeds: [embed], components: [dailyDateSelectorRow,backButtonRow]})
                } else if (i.values[0] === "hourly") {
                    const embed = generateHourlyEmbed(0,0)
                    const second_rs = await i.editReply({embeds: [embed], components: [hourlyDateSelectorRow, hourlyHourSelectorRow,backButtonRow]})
                }
            } else if (i.user.id===interaction.user.id && i.customId === "weather_back") {
                await i.update({embeds: [initialEmbed], components: [modeSelectorRow]})
            } else if (i.user.id===interaction.user.id && i.customId==="weather__daily") {
                await i.deferUpdate()
                const selected = Number(i.values[0].slice(15))
                const embed=generateEmbed(selected)
                await i.editReply({embeds: [embed], components: [dailyDateSelectorRow,backButtonRow]})
            } else if (i.user.id===interaction.user.id && i.customId==="weather__hourly__date") {
                await i.deferUpdate()
                const selected = Number(i.values[0])
                daySelected = selected
                const embed = generateHourlyEmbed(daySelected,hourSelected)
                await i.editReply({embeds: [embed], components: [hourlyDateSelectorRow, hourlyHourSelectorRow,backButtonRow]})
            } else if (i.user.id===interaction.user.id && i.customId==="weather__hourly__hour") {
                await i.deferUpdate()
                const selected = Number(i.values[0])
                hourSelected = selected
                const embed = generateHourlyEmbed(daySelected,hourSelected)
                await i.editReply({embeds: [embed], components: [hourlyDateSelectorRow, hourlyHourSelectorRow,backButtonRow]})
            }
        })
        collector.on("end", async i => {
            if (collector.endReason === "time") {
                await interaction.editReply({content: "You did not interact with this message for 10 minutes! Run the command again.", embeds: [], components: []})
            }
        })
    },
};
