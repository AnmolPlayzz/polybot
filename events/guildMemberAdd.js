require("dotenv").config();
const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const { mongo_client } = require("../mongodb-helper.js");
const Canvas = require("canvas");
const fs = require("fs");
module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member) {
        //----[ Welcome msg ]----
        const guildId = member.guild.id
        const db = mongo_client.db("polybot");
        const collection = db.collection('welcome');
        const data = (await collection.find({ guildID: guildId }).toArray()).at(0)
        if (data!==undefined) {
            const welcome = data.welcomeID
            const userI = member.user
            const guildI = member.guild
            const canvas = Canvas.createCanvas(960, 540);
            const context = canvas.getContext('2d');
            const imageData = await fs.promises.readFile('images/events/welcome/welcome-base-image.png');
            const background = await Canvas.loadImage(imageData);
            //register fonts
            Canvas.registerFont("./fonts/roboto/Roboto-Bold.ttf", { family: 'Roboto-Bold' });
            Canvas.registerFont("./fonts/roboto/Roboto-Thin.ttf", { family: 'Roboto-Thin' });
            Canvas.registerFont("./fonts/roboto/Roboto-Light.ttf", { family: 'Roboto-Light' });

            context.drawImage(background, 0, 0, canvas.width, canvas.height);

            //text - name
            context.font = "41.82px Roboto-Bold";
            context.fillStyle = '#ffffff';
            context.fillText((userI.globalName || userI.username).length > 13 ? (userI.globalName || userI.username).slice(0, 13) + "..." : (userI.globalName || userI.username), 238.5, 269.5);

            //text - username
            context.font = "18.47px Roboto-Light";
            context.fillStyle = '#d0d0d0';
            context.fillText(userI.username.length > 30 ? userI.username.slice(0,27)+"..." : userI.username, 238.5, 297.5 );

            //text - membercount
            context.font = "31.04px Roboto-Thin";
            context.fillStyle = '#ffffff';
            context.fillText(`#${guildI.memberCount}`, 278.5, 386.5);


            //avatar
            const avatar = await Canvas.loadImage(userI.displayAvatarURL({ extension: 'png' }));
            context.beginPath();
            context.arc(635.91, 310.03, (171.5625/2), 0, Math.PI * 2, true);
            context.closePath();
            context.clip();
            context.drawImage(avatar, 549.53 , 223.66  , 171.5625 , 171.5625 );

            const attachment = new AttachmentBuilder(await canvas.toBuffer("image/png"), { name: 'welcome-image.png' });
            const welcomeChannel = await guildI.channels.fetch(welcome)
            welcomeChannel.send({content: `Welcome to the server <@!${userI.id}>!`, files: [attachment]}).catch(e => console.log(e))
        }

        //---[ AutoRole ]---
        const collectionAutorole = db.collection('autorole');
        const dataAutorole = (await collectionAutorole.find({ guildID: guildId }).toArray()).at(0)
        if (dataAutorole!==undefined) {
            const guildI = member.guild
            const roles = dataAutorole.roleList
            try {
                roles.forEach(async e => {
                    await member.roles.add(e)
                })
            } catch (e) {
                console.log(e)
            }
        }
    },
};
