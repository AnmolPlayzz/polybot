const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pager } = require("../../helpers.js")
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolelist')
        .setDescription('Returns a list of roles in the server.'),
    async execute(interaction, client) {
        const roles = await interaction.guild.roles.fetch()
        let l=[]
        roles.forEach(e => {
            l.push(e)
        })
        let sorted_l = l.sort((a,b) => {
            return a.position-b.position
        })
        mapped = sorted_l.map(e => `<@&${e.id}>`).reverse().map((el,i) => {
            return `${i+1}. ${el}`
        })

        pager(interaction,mapped,10,"\n",null,"Role list")
        //await interaction.reply({embeds: [rolelist]});
    },
};
