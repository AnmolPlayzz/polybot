const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { mongo_client } = require("../../mongodb-helper")
const Canvas = require("canvas");
const fs = require("fs");
const { calculateXp } = require("../../helpers")
//register fonts
Canvas.registerFont("./fonts/roboto/Roboto-Bold.ttf", { family: 'Roboto-Bold' });
Canvas.registerFont("./fonts/roboto/Roboto-Thin.ttf", { family: 'Roboto-Thin' });
Canvas.registerFont("./fonts/roboto/Roboto-Light.ttf", { family: 'Roboto-Light' });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Returns a user\'s rank.')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user to view rank of')
                .setRequired(false)),
    async execute(interaction, client) {
        await interaction.deferReply()
        const target = interaction.options.getUser('target') || interaction.user;
        const userId = target.id;
        const guildId = interaction.guild.id;
        const db = mongo_client.db("polybot");
        const collectionServer = db.collection('rank_server');
        const findServer = await collectionServer.findOne({ guildId: `${guildId}` });
        if (!findServer) {
            await interaction.editReply("The rank module is disabled on this server.")
            return
        }

        const collection = db.collection('rank_user');
        const [data] = await collection.aggregate([
            {
                $match: {
                    userId: `${userId}`,
                    levels: { $elemMatch: { serverId: `${guildId}` } }
                }
            },
            {
                $unwind: "$levels" // Deconstruct the levels array into separate documents
            },
            {
                $match: { "levels.serverId": `${guildId}` } // Filter again for exact serverId match
            },
            {
                $project: {
                    _id: 0, // Exclude unnecessary _id field
                    levelData: "$levels" // Project only the desired level object
                }
            }
        ]).toArray()
        if (data) {
            const dataLeaderboard = (await collection.aggregate([
                {
                    $match: {
                        levels: { $elemMatch: { serverId: `${guildId}` } }
                    }
                },
                {
                    $unwind: "$levels" // Deconstruct the levels array into separate documents
                },
                {
                    $match: { "levels.serverId": `${guildId}` } // Filter again for exact serverId match
                },
                {
                    $sort: { "levels.level": -1,"levels.totalXp": -1 }
                },
                {
                    $project: {
                        _id: 0, // Exclude unnecessary _id field
                        levelData: "$levels", // Project only the desired level object
                        userId: 1
                    }
                }
            ]).toArray()).sort((a,b) => {
                if (Number(a.levelData.totalXp) > Number(b.levelData.totalXp)) {
                    return -1
                } else if (Number(a.levelData.totalXp) < Number(b.levelData.totalXp)) {
                    return 1
                } else {
                    return 0
                }
            })

            const canvas = Canvas.createCanvas(1366, 927);
            const context = canvas.getContext('2d');
            const imageData = await fs.promises.readFile('images/commands/rank/rank/rank-base-image.png');
            const background = await Canvas.loadImage(imageData);

            const rank = dataLeaderboard.findIndex(data => data.userId === userId)+1;
            const level = Number(data.levelData.level)
            const xp = Number(data.levelData.totalXp)

            function calculateProgressData(xp, level) {
                const currentLevelXp = calculateXp(level)
                const nextLevelXp = calculateXp(level+1)
                const levelXp = nextLevelXp-currentLevelXp
                const levelXpProgress = xp-currentLevelXp
                return {
                    currentLevelXp: currentLevelXp,
                    nextLevelXp: nextLevelXp,
                    levelXp: levelXp,
                    levelXpProgress: levelXpProgress,
                }
            }
            const { currentLevelXp, nextLevelXp, levelXp,levelXpProgress } = calculateProgressData(xp,level)
            //place bg
            context.drawImage(background, 0, 0, canvas.width, canvas.height);

            //rank
            context.font = "43.76px Roboto-Light";
            context.fillStyle = '#ffffff';
            context.fillText(`#${rank}`, 812,318, 246);
            //level
            context.font = "43.76px Roboto-Light";
            context.fillStyle = '#ffffff';
            context.fillText(`${data.levelData.level}`, 812,440, 246);
            //xp
            context.font = "43.76px Roboto-Light";
            context.fillStyle = '#ffffff';
            context.fillText(`${data.levelData.totalXp}`, 812,561, 246);

            //Name
            context.font = "63.22px Roboto-Bold";
            context.fillStyle = '#ffffff';
            context.textAlign = "center";
            context.fillText(`${target.globalName}`, 447,623, 390);

            //UserName
            context.font = "27.92px Roboto-Light";
            context.fillStyle = '#ffffff';
            context.textAlign = "center";
            context.fillText(`${target.username}`, 447,664, 390);


            //progressbar
            const progress = levelXpProgress/levelXp
            const width = Math.floor(progress*395)===0 ? 1 : Math.floor(progress * 395)
            const gradient = context.createLinearGradient(689, 677, 689+width, 677+46);
            gradient.addColorStop(0, "#29fffb");
            gradient.addColorStop(0.5, "#b53dff");
            gradient.addColorStop(1, "#ff3d9e");

            context.fillStyle = gradient;
            context.beginPath(); // Start a new path
            context.roundRect(689, 677, width, 46, 10);
            context.fill();

            //progress
            context.font = "29.22px Roboto-Bold";
            context.fillStyle = '#ffffff';
            context.textAlign = "right";
            context.fillText(`${levelXpProgress}/${Math.floor(nextLevelXp-currentLevelXp)}`, 1069,711, 395);


            //avatar
            const avatar = await Canvas.loadImage(target.displayAvatarURL({ extension: 'png' }));
            context.beginPath();
            context.arc(449, 376, (272.5/2), 0, Math.PI * 2, true);
            context.closePath();
            context.clip();
            context.drawImage(avatar, 312, 242   , 272.5 , 272.5 );



            //render image
            const attachment = new AttachmentBuilder(await canvas.toBuffer("image/png"), { name: 'welcome-image.png' });

            await interaction.editReply({files: [attachment]});
        } else {
            await interaction.editReply("No data found for this user. They have probably never talked in this server.")
        }

    },
};
