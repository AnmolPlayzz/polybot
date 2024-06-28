// Helper functions
const currency = require("./currency.json")
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Events, ComponentType,ButtonBuilder, ButtonStyle } = require('discord.js');
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
const fetch = require("node-fetch");
const fs = require('fs');
const path = require("path");
const latestDataQuery = currency.lastUpdate
const APIKey = process.env.FC_API_KEY;

let lastRequestTime = 0;

/***
 * Convert array to paged embeds
 * @constructor
 * @param {} interaction - Interaction to which the embeds are responding
 * @param {string[]} arr - Array
 * @param {number} brp - Break Point (each page should have [bpr] items)
 * @param {string} joiner - what string should be used to join each element
 * @param {string} author_text - text to be shown in author field of each embed
 * @param {string} title - title of each embed
 * @param {number} color - color of embed
 * @param {number} interval - time after which menu is disabled
 * @returns {Promise<void>}
 * */
const pager = async (interaction, arr, brp, joiner, author_text, title, color=0x2b2d31,interval = 60_000) => {
    let page_list = []
    for (let i=0;i<arr.length;i+=brp) {
        page_list.push(arr.slice(i,i+brp))
    }

    let page_list_embed = page_list.map(e => {
        let embed_template = new EmbedBuilder()
            .setColor(color)
            .setDescription(e.join(joiner))
            .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
        author_text ? embed_template.setAuthor({name: author_text}) : ""
        title ? embed_template.setTitle(title) : ""
        return embed_template
    })
    let itr = 0 //page number - iterator

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

    /***
     * Updates the display on the pagenated message
     * @param {number} itr - the page iterator
     * @returns {void}
     * */
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
            await i.reply({content: `These buttons aren't for you!`, ephemeral: true});
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

/**
 * Calculate XP from level
 * @param l {number} - Level to convert to XP
 * @returns {number}
 * */
function calculateXp(l){
    return ((4/3)*l**3 + 32*l**2 + (842/3)*l ) //https://www.desmos.com/calculator/unnkwg9llt
}

/**
 * Calculate Level from XP
 * @param x {number} - XP to convert
 * @returns {number}
 * **/
function calculateLevel(x) {
    const sqrt = Math.sqrt;
    const level = -(((sqrt(3)*sqrt(243*x**2 + 427680*x + 188584424) - 27*x - 23760)**(1/3))/(2*3**(2/3))) + ((37)/(3**(1/3)*(sqrt(3)*sqrt(243*x**2 + 427680*x + 188584424) - 27*x - 23760)**(1/3))) - 8
    let floored = Math.floor(level) === -1 ? 0 : Math.floor(level)
    const checkXp = calculateXp(floored+1)
    if (checkXp < x){
        floored+=1
    }
    return floored;
}

/**
 * Select random item from array
 * @param arr {any[]} - Array to select item from
 * @returns {any}
 * **/
function selectRandom(arr) {
    return arr[Math.floor(Math.random()*arr.length)]
}

/**
 * Fetch list of location co-ordinates from the nominatim geocoding API using a query text
 * @constructor
 * @param {string} location - The string to query
 * @returns {Promise<{
 *     name: string,
 *     latitude: string,
 *     longitude: string
 * }[]>}
 * **/
const fetchLocations = async (location) => {
    const cachedData = cache.get(location);
    const now = Date.now();

    if (now - lastRequestTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - (now - lastRequestTime)));
    }

    if (cachedData) {
        return cachedData;
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&addressdetails=1&limit=10`;

    try {
        lastRequestTime = Date.now();
        const response = await fetch(url,{
            method: 'GET',
            headers: {
                'User-Agent': 'PolyBot/1.0 (https://polybot-website.vercel.app)',
                'Referer': 'https://polybot-website.vercel.app'
            }
        });
        const data = await response.json();

        if (data) {
            return data.map(result => ({
                name: result.display_name,
                latitude: result.lat,
                longitude: result.lon
            }));
        } else {
            return []
            throw new Error('No results found');
        }
    } catch (error) {
        console.error('Error fetching location data:', error);
    }
};

async function fetchData() {
    if (new Date() - new Date(latestDataQuery) >= 86400000 ) {
        const currenciesReq = await fetch(`https://api.freecurrencyapi.com/v1/currencies?apikey=${APIKey}`)
        const currencies = await currenciesReq.json()
        const exchangeRatesReq = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${APIKey}`)
        const exchangeRates = []
        for (const [key, value] of Object.entries((await exchangeRatesReq.json()).data)) {
            exchangeRates.push({
                code: key,
                conv: value
            })
        }
        const actualData = []
        for (const [key, value] of Object.entries(currencies.data)) {
            actualData.push({
                code: value.code,
                name: value.name,
                symbol: value.symbol,
                inBase: exchangeRates.filter((val) => {
                    if (val.code === value.code) {
                        return Number(val.conv)
                    }
                }).pop().conv
            })
        }
        const fetchedData = {
            lastUpdate: new Date().getTime(),
            currencyData: actualData,
        }
        const filePath = path.resolve(__dirname, './currency.json');
        console.log('Writing to file:', filePath);
        fs.writeFileSync(filePath, JSON.stringify(fetchedData))
        console.log("JSON saved")
    }
}

module.exports.pager = pager;
module.exports.calculateXp = calculateXp;
module.exports.calculateLevel = calculateLevel;
module.exports.selectRandom = selectRandom;
module.exports.fetchLocations = fetchLocations;
module.exports.fetchData = fetchData;