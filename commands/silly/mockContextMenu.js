const { ContextMenuCommandBuilder, ApplicationCommandType, Events} = require('discord.js');
module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Mock text')
        .setType(ApplicationCommandType.Message),
    async execute(interaction,client) {
        const text = interaction.targetMessage.content
        let newText="";
        for (const [val, key] of Object.entries(text)) {
            if (val%2!==0) {
                newText += key.toUpperCase()
            } else {
                newText += key.toLowerCase()
            }
        }
        interaction.reply({content: newText.length===0 ? "_no text present in the original message_" : newText, ephemeral: true})
    },
};
