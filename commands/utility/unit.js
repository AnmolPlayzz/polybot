const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType, } = require('discord.js');

const Units = {
    temperature: {
        degree_celsius: { toBase: val => val, fromBase: val => val },
        degree_fahrenheit: { toBase: val => (val - 32) * 5/9, fromBase: val => val * 9/5 + 32 },
        kelvin: { toBase: val => val - 273.15, fromBase: val => val + 273.15 }
    },
    length: {
        meter: 1,
        kilometer: 0.001,
        centimeter: 100,
        millimeter: 1000,
        micrometer: 1000000,
        nanometer: 1000000000,
        inch: 39.3701,
        foot: 3.28084,
        yard: 1.09361,
        mile: 0.000621371,
        nautical_mile: 0.000539957,
    },
    mass: {
        kilogram: 1,
        gram: 1000,
        milligram: 1000000,
        microgram: 1e9,
        pound: 2.20462,
        ounce: 35.274
    },
    volume: {
        liter: 1,
        milliliter: 1000,
        cubic_meter: 0.001,
        cubic_centimeter: 1000,
        cubic_inch: 61.0237,
        cubic_foot: 0.0353147,
        gallon: 0.264172,
        quart: 1.05669,
        pint: 2.11338,
        cup: 4.22675,
        fluid_ounce: 33.814,
        tablespoon: 67.628,
        teaspoon: 202.884
    },
    area: {
        square_meter: 1,
        square_kilometer: 0.000001,
        square_centimeter: 10000,
        square_millimeter: 1e6,
        square_mile: 3.861e-7,
        square_yard: 1.19599,
        square_foot: 10.7639,
        square_inch: 1550,
        hectare: 0.0001,
        acre: 0.000247105
    },
    speed: {
        meter_per_second: 1,
        kilometer_per_hour: 3.6,
        mile_per_hour: 2.23694,
        foot_per_second: 3.28084,
        knot: 1.94384
    },
    time: {
        second: 1,
        millisecond: 1000,
        microsecond: 1e6,
        nanosecond: 1e9,
        minute: 1/60,
        hour: 1/3600,
        day: 1/86400,
        week: 1/604800,
        month: 1/2.628e6,
        year: 1/3.154e7
    },
    data_transfer_rate: {
        bit_per_second: 1,
        kilobit_per_second: 1e-3,
        megabit_per_second: 1e-6,
        gigabit_per_second: 1e-9,
        terabit_per_second: 1e-12,
        byte_per_second: 1/8,
        kilobyte_per_second: 1/8000,
        megabyte_per_second: 1/8e6,
        gigabyte_per_second: 1/8e9,
        terabyte_per_second: 1/8e12
    },
    digital_storage: {
        bit: 1,
        kilobit: 1e-3,
        megabit: 1e-6,
        gigabit: 1e-9,
        terabit: 1e-12,
        byte: 1/8,
        kilobyte: 1/8000,
        megabyte: 1/8e6,
        gigabyte: 1/8e9,
        terabyte: 1/8e12
    },
    energy: {
        joule: 1,
        kilojoule: 0.001,
        calorie: 0.239006,
        kilocalorie: 0.000239006,
        watt_hour: 0.000277778,
        kilowatt_hour: 2.7778e-7,
        electronvolt: 6.242e18
    },
    frequency: {
        hertz: 1,
        kilohertz: 1e-3,
        megahertz: 1e-6,
        gigahertz: 1e-9
    },
    fuel_economy: {
        kilometer_per_liter: 1,
        liter_per_100_kilometers: 100,
        mile_per_gallon: 2.35215,
        mile_per_gallon_imperial: 2.82481
    },
    plane_angle: {
        degree: 1,
        radian: Math.PI / 180,
        gradian: 1.11111,
        milliradian: 1000 * Math.PI / 180,
        minute_of_arc: 1 / 60,
        second_of_arc: 1 / 3600
    },
    pressure: {
        pascal: 1,
        kilopascal: 0.001,
        bar: 1e-5,
        psi: 0.000145038,
        atmosphere: 9.8692e-6,
        torr: 0.00750062
    }
}

/**
 * Capitalize first letter of a string & replace "_" with " "
 * @param str {string} - string to Capitalize
 * @returns {string}
 * **/
function capitalize(str) {
    return (str[0].toUpperCase() + str.slice(1)).replaceAll("_"," ");
}

const quantityMap = (Object.keys(Units)).map((val) => ({name: capitalize(val), value: `unit_${val}`}))
module.exports = {
    data: new SlashCommandBuilder()
        .setName('unit-convert')
        .setDescription('Convert a value from one unit to another.')
        .addStringOption(option =>
            option.setName('quantity')
                .setDescription('The quantity category')
                .setRequired(true)
                .addChoices(...quantityMap)),
    async execute(interaction, client) {
        const selected = new Map(
            Object.entries(
                {
                    unit1: false,
                    unit2: false,
                    value: false
                }
            )
        )
        /**
         *
         * Convert a quantity from unit to another
         * @constructor
         * @param {number} value - the value in "from" unit
         * @param {string} fromUnit - the unit from which the conversion should take place
         * @param {string} toUnit - the unit to which the conversion should take place
         * @param {string} category - the quantity category
         * @returns {number}
         * **/
        function convert(value, fromUnit, toUnit, category) {
            if (category === 'temperature') {
                const baseValue = Units[category][fromUnit].toBase(value);
                return Units[category][toUnit].fromBase(baseValue);
            } else {
                const baseValue = value / Units[category][fromUnit];
                return baseValue * Units[category][toUnit];
            }
        }
        const quantity = interaction.options.getString('quantity').slice(5);
        const unitsObj = Units[quantity]
        const initialEmbed = new EmbedBuilder()
            .setAuthor({name: `Unit Convertor`})
            .setDescription(`Convert **${capitalize(quantity)}**.\nSelect the units from the below menu and enter the value.`)
            .setColor(0x2B2D31)
            .setTimestamp()
            .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
        let updateEmbed = new EmbedBuilder()
            .setAuthor({name: `Unit Convertor`})
            .setColor(0x2B2D31)
            .setTimestamp()
            .setFooter({text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL()});
        function updateEmbedFn() {
            updateEmbed.setDescription(`Convert **${capitalize(quantity)}**.\n` +
                `**Unit from:** ${selected.get("unit1") ? capitalize(selected.get("unit1")) : "Not selected"}\n` +
                `**Unit to:** ${selected.get("unit2") ? capitalize(selected.get("unit2")) : "Not selected"}\n` +
                `**Value:** ${selected.get("value") ? selected.get("value") : "Not inputted"}\n`)
        }
        const unitOptions = Object.keys(unitsObj).map((key) => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(capitalize(key))
                .setValue("unit_" + key)
        })

        let fromNav = new StringSelectMenuBuilder()
            .setCustomId('unit_from')
            .setPlaceholder('Convert from...')
            .addOptions(...unitOptions)
        let toNav = new StringSelectMenuBuilder()
            .setCustomId('unit_to')
            .setPlaceholder('Convert to...')
            .addOptions(...unitOptions)
        let valButton = new ButtonBuilder()
            .setCustomId("unit_val_btn")
            .setLabel("Enter Value")
            .setStyle(ButtonStyle.Primary)
        let fromRow = new ActionRowBuilder()
            .addComponents(fromNav);
        let toRow = new ActionRowBuilder()
            .addComponents(toNav);
        let valRow = new ActionRowBuilder()
            .addComponents(valButton)
        const valueModel = new ModalBuilder()
            .setCustomId('unit_model')
            .setTitle('Enter value');
        const valueInput = new TextInputBuilder()
            .setCustomId('unit_model_value')
            .setLabel("Enter the value in the \"from\" unit.")
            .setStyle(TextInputStyle.Short);
        const valueInputRow = new ActionRowBuilder().addComponents(valueInput);
        valueModel.addComponents(valueInputRow);
        const initialResponse = await interaction.reply({embeds: [initialEmbed], components: [fromRow, toRow, valRow]});
        const collector = initialResponse.createMessageComponentCollector({ time: 300_000 });
        collector.on("collect", async i => {
            if (i.user.id === interaction.user.id) {
                if (i.customId==="unit_from") {
                    selected.set("unit1",i.values[0].slice(5))
                    updateEmbedFn()
                    await i.update({embeds: [updateEmbed], components: [fromRow, toRow, valRow]})
                } else if (i.customId==="unit_to") {
                    selected.set("unit2",i.values[0].slice(5))
                    updateEmbedFn()
                    await i.update({embeds: [updateEmbed], components: [fromRow, toRow, valRow]})
                } else if (i.customId==="unit_val_btn") {
                    const modelRes = await i.showModal(valueModel)
                    try {
                        const submitted = await i.awaitModalSubmit({
                            time: 300_000,
                            filter: i => i.user.id === interaction.user.id,
                        })
                        if (submitted.customId === "unit_model") {
                            const val = submitted.fields.getTextInputValue('unit_model_value')
                            if (isNaN(val)) {
                                i.followUp({content: "You did not enter a number", ephemeral: true})
                            } else {
                                selected.set("value",Number(val))
                            }
                            updateEmbedFn()
                            await submitted.update({embeds: [updateEmbed], components: [fromRow, toRow, valRow]})
                        }
                    } catch (e) {
                        await i.followUp({ content: "You did not enter a value within 5 minutes!", ephemeral: true })
                        console.log(e)
                    }
                }
                if (selected.get("value") && selected.get("unit1") && selected.get("unit2")) {
                    const newValconv = convert(selected.get("value"),selected.get("unit1"),selected.get("unit2"),quantity)
                    const newVal = newValconv > 1 && newValconv < 10000 ? newValconv.toFixed(3) : newValconv
                    updateEmbed.setDescription("# Input value\n" +
                        `${selected.get("value")} ${capitalize(selected.get("unit1"))}\n` +
                        "# Output value\n" +
                        `${newVal} ${capitalize(selected.get("unit2"))}`)
                    await i.editReply({embeds: [updateEmbed], components:[]})
                    collector.stop("command-handled")
                }
            }
        })
        collector.on("end", async i => {
            if (collector.endReason === "time") {
                fromNav.setDisabled(true)
                toNav.setDisabled(true)
                valButton.setDisabled()
                let fromRow = new ActionRowBuilder()
                    .addComponents(fromNav);
                let toRow = new ActionRowBuilder()
                    .addComponents(toNav);
                let valRow = new ActionRowBuilder()
                    .addComponents(valButton)
                await interaction.editReply({content: "You did not input all the fields within 5 minutes!", components: [fromRow,toRow,valRow]})
            }
        })
    },
};
