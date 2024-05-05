//script to delete commands
require("dotenv").config()
const { REST, Routes } = require('discord.js');
const clientId = process.env.CLIENTID;
const guildIdL = process.env.GUILDID;
const guildIds = guildIdL.split(",")
const token = process.env.TOKEN;
const commandId = ``
const rest = new REST().setToken(token);
/*
guildIds.forEach(guildId => {
    rest.delete(Routes.applicationGuildCommand(clientId, guildId, commandId))
        .then(() => console.log('Successfully deleted guild command'))
        .catch(console.error);
})
*/
/*
rest.delete(Routes.applicationCommand(clientId, commandId))
    .then(() => console.log('Successfully deleted application command'))
    .catch(console.error);
 */