const {  SlashCommandBuilder, EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, ComponentType } = require("discord.js")
const math = require("mathjs");
const mathInstance = math.create(math.all);
const buttons = [
    [
        {
            text: "AC",
            action: "clear",
            style: ButtonStyle.Danger,
        },
        {
            text: "(",
            action: "(",
            style: ButtonStyle.Primary,
        },
        {
            text: ")",
            action: ")",
            style: ButtonStyle.Primary,
        },
        {
            text: "^",
            action: "^",
            style: ButtonStyle.Primary,
        },
        {
            text: "⌫",
            action: "back",
            style: ButtonStyle.Danger,
        }
    ],
    [
        {
            text: "π",
            action: "pi",
            style: ButtonStyle.Primary,
        },
        {
            text: "7",
            action: "7",
        },
        {
            text: "8",
            action: "8",
        },
        {
            text: "9",
            action: "9",
        },
        {
            text: "/",
            action: "/",
            style: ButtonStyle.Primary,
        }
    ],
    [
        {
            text: "sqrt",
            action: "sqrt",
            style: ButtonStyle.Primary,
        },
        {
            text: "4",
            action: "4",
        },
        {
            text: "5",
            action: "5",
        },
        {
            text: "6",
            action: "6",
        },
        {
            text: "x",
            action: "*",
            style: ButtonStyle.Primary,
        }
    ],
    [
        {
            text: "ln",
            action: "ln",
            style: ButtonStyle.Primary,
        },
        {
            text: "1",
            action: "1",
        },
        {
            text: "2",
            action: "2",
        },
        {
            text: "3",
            action: "3",
        },
        {
            text: "-",
            action: "-",
            style: ButtonStyle.Primary,
        }
    ],
    [
        {
            text: "log",
            action: "log",
            style: ButtonStyle.Primary,
        },
        {
            text: "0",
            action: "0",
        },
        {
            text: ".",
            action: ".",
        },
        {
            text: "=",
            action: "result",
            style: ButtonStyle.Success
        },
        {
            text: "+",
            action: "+",
            style: ButtonStyle.Primary,
        }
    ]
]

const actionRows = buttons.map((row) => {
    const populatedRow = row.map(button => {
        return new ButtonBuilder()
            .setCustomId(`calculator__${button.action}`)
            .setLabel(button.text)
            .setStyle(button.style ? button.style : ButtonStyle.Secondary)
    })
    return new ActionRowBuilder()
        .addComponents(...populatedRow)
})

const disabledActionRows = buttons.map((row) => {
    const populatedRow = row.map(button => {
        return new ButtonBuilder()
            .setCustomId(`calculator__${button.action}`)
            .setLabel(button.text)
            .setStyle(button.style ? button.style : ButtonStyle.Secondary)
            .setDisabled(true)
    })
    return new ActionRowBuilder()
        .addComponents(...populatedRow)
})

function toText(list){
    return list.reduce((acc, cur) => acc + cur, "")
}
mathInstance.import({
    log: function (x) {
        return Math.log10(x);
    },
    ln: function (x) {
        return Math.log(x);
    }
}, { override: true });
module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculator')
        .setDescription('Returns a button calculator.'),
    async execute(interaction, client) {
        let actualText = [];
        const res = await interaction.reply({content: `\`\`\`0\`\`\``, components: [...actionRows]});
        let result;
        const collector = res.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300_000 });
        collector.on("collect", async i => {
            if (i.user.id === interaction.user.id) {
                const actionParsed = i.customId.slice(12);
                const displayParsed = i.component.label;
                if(actionParsed === "clear") {
                    actualText = []
                    await i.update(`\`\`\`0\`\`\``)
                } else if (actionParsed === "back") {
                    actualText.pop()
                    await i.update(`\`\`\`${actualText.length !== 0 ? toText(actualText) : "0"}\`\`\``)
                } else if(actionParsed === "result") {
                    try{
                        result = `= ${mathInstance.evaluate(toText(actualText))}`
                    } catch (e) {
                        result = "Invalid Input. Did you close all the brackets?"
                    }
                    actualText=[]
                    await i.update({content: `\`\`\`${result}\`\`\``, components: [...actionRows]});
                } else {
                    const actionCheck = actionParsed==="log" || actionParsed==="ln" || actionParsed==="sqrt"
                    actualText.push(actionParsed + (actionCheck ? "(" : ""))
                    await i.update(`\`\`\`${actualText!==[] ? toText(actualText) : "0"}\`\`\``)
                }
                collector.resetTimer()
            } else {
                i.reply({content: "This command was not run by you!", ephemeral: true})
            }
        })
        collector.on("end", i => {
            interaction.editReply({content: `\`\`\`You did not interact with this calculator for 5 minutes, run the command again!\`\`\``, components: [...disabledActionRows]});
        })
    },
};