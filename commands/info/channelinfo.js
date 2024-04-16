const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelinfo')
        .setDescription('Returns a channel\'s info.')
        .addChannelOption(option =>
            option
                .setName('target')
                .setDescription('The channel to view info of')
                .setRequired(true)),
    async execute(interaction, client) {
        const target = interaction.options.getChannel('target')

        /*
        Nomenclature
        - category: 4
        - announcement: 5
        - text: 0
        - forum: 15
        - stage: 13
        - voice: 2
        - thread (public): 12
        - thread (private): 11
         */
        let channelinfo = new EmbedBuilder()
            .setAuthor({name: `Channel info for '${target.name}'`})
            .setColor(0x2b2d31)
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.avatarURL() });
        switch (target.type) {
            case 0:
                channelinfo.addFields(
                    {name: "💳 Name", value: target.name, inline: true},
                    {name: "🆔 ID", value: target.id, inline: true},
                    {name: "📚 Type", value: "Text", inline: true},
                    {name: "🔍 Topic", value: `\`\`\`${target.topic || "No topic set"}\`\`\``, inline: false},
                    {name: "📅 Created on", value: "<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                    {name: "🔗 URL", value: `[Click Here](${target.url})`, inline: true},
                    {name: "🤖 WebHooks", value: `${(await target.fetchWebhooks()).size}`, inline: true},
                    {name: "🧵 Threads", value: `${(await target.threads.fetch()).threads.size}`, inline: true},
                    {name: "📁 Parent Category", value: `${target.parent.name}`, inline: true},
                    {name: "🔞 NSFW status", value: `${target.nsfw ? "Yes, channel is NSFW" : "No, channel is not NSFW"}`, inline: true},
                    {name: "🛑 Slowmode", value: `${target.rateLimitPerUser}s`, inline: true}
                )
                break
            case 2:
                channelinfo.addFields(
                    {name: "💳 Name", value: target.name, inline: true},
                    {name: "🆔 ID", value: target.id, inline: true},
                    {name: "📚 Type", value: "Voice", inline: true},
                    {name: "📅 Created on", value: "<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                    {name: "🔗 URL", value: `[Click Here](${target.url})`, inline: true},
                    {name: "🤖 WebHooks", value: `${(await target.fetchWebhooks()).size}`, inline: true},
                    {name: "📁 Parent Category", value: `${target.parent.name}`, inline: true},
                    {name: "🔞 NSFW status (for text channel)", value: `${target.nsfw ? "Yes, channel is NSFW" : "No, channel is not NSFW"}`, inline: true},
                    {name: "🛑 Slowmode (for text channel)", value: `${target.rateLimitPerUser}s`, inline: true},
                    {name: "📡 Bitrate", value: `${target.bitrate/1000} kbps`, inline: true},
                    {name: "🎥 Video Quality Setting", value: `${ target.videoQualityMode === null ? "Auto" : (target.videoQualityMode === 1 ? "Auto" : "720p")}`, inline: true},
                    {name: "💎 Max Capacity", value: `${target.userLimit === 0 ? "No limit" : target.userLimit}`, inline: true},
                    {name: "🌎 Region", value: `${target.rtcRegion || "Auto"}`, inline: true},
                )
                break
            case 4:
                channelinfo.addFields(
                    {name: "💳 Name", value: target.name, inline: true},
                    {name: "🆔 ID", value: target.id, inline: true},
                    {name: "📚 Type", value: "Category", inline: true},
                    {name: "📅 Created on", value: "<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                    {name: "🔗 URL", value: `[Click Here](${target.url})`, inline: true},
                    {name: "⏬ Child channels", value: `${target.children.cache.map(e => "\`"+"#"+e.name+"\`").join("\n")}`, inline: false},
                )
                break
            case 5:
                channelinfo.addFields(
                    {name: "💳 Name", value: target.name, inline: true},
                    {name: "🆔 ID", value: target.id, inline: true},
                    {name: "📚 Type", value: "Announcement", inline: true},
                    {name: "🔍 Topic", value: `\`\`\`${target.topic || "No topic set"}\`\`\``, inline: false},
                    {name: "📅 Created on", value: "<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                    {name: "🔗 URL", value: `[Click Here](${target.url})`, inline: true},
                    {name: "🤖 WebHooks", value: `${(await target.fetchWebhooks()).size}`, inline: true},
                    {name: "🧵 Threads", value: `${(await target.threads.fetch()).threads.size}`, inline: true},
                    {name: "📁 Parent Category", value: `${target.parent.name}`, inline: true},
                    {name: "🔞 NSFW status", value: `${target.nsfw ? "Yes, channel is NSFW" : "No, channel is not NSFW"}`, inline: true},
                )
                break
            case 11:
                channelinfo.addFields(
                    {name: "💳 Name", value: target.name, inline: true},
                    {name: "🆔 ID", value: target.id, inline: true},
                    {name: "📚 Type", value: "Thread [Private]", inline: true},
                    {name: "📅 Created on", value: "<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                    {name: "🔗 URL", value: `[Click Here](${target.url})`, inline: true},
                    {name: "📁 Parent Channel", value: `${target.parent.name}`, inline: true},
                    {name: "🛑 Slowmode", value: `${target.rateLimitPerUser}s`, inline: true},
                    {name: "📦 Archived", value: `${target.archived ? "Yes" : "No"}, last changed on ${"<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>"}`, inline: true},
                    {name: "👥 Member Count", value: `${target.memberCount}`, inline: true},
                    {name: "👑 Owner", value: `<@!${target.ownerId}>`, inline: true}
                )
                break
            case 12:
                channelinfo.addFields(
                    {name: "💳 Name", value: target.name, inline: true},
                    {name: "🆔 ID", value: target.id, inline: true},
                    {name: "📚 Type", value: "Thread [Public]", inline: true},
                    {name: "📅 Created on", value: "<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                    {name: "🔗 URL", value: `[Click Here](${target.url})`, inline: true},
                    {name: "📁 Parent Channel", value: `${target.parent.name}`, inline: true},
                    {name: "🛑 Slowmode", value: `${target.rateLimitPerUser}s`, inline: true},
                    {name: "📦 Archived", value: `${target.archived ? "Yes" : "No"}, last changed on ${"<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>"}`, inline: true},
                    {name: "👥 Member Count", value: `${target.memberCount}`, inline: true},
                    {name: "👑 Owner", value: `<@!${target.ownerId}>`, inline: true}
                )
                break
            case 13:
                channelinfo.addFields(
                    {name: "💳 Name", value: target.name, inline: true},
                    {name: "🆔 ID", value: target.id, inline: true},
                    {name: "📚 Type", value: "Stage", inline: true},
                    {name: "📅 Created on", value: "<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                    {name: "🔗 URL", value: `[Click Here](${target.url})`, inline: true},
                    {name: "🤖 WebHooks", value: `${(await target.fetchWebhooks()).size}`, inline: true},
                    {name: "📁 Parent Category", value: `${target.parent.name}`, inline: true},
                    {name: "🔞 NSFW status (for text channel)", value: `${target.nsfw ? "Yes, channel is NSFW" : "No, channel is not NSFW"}`, inline: true},
                    {name: "🛑 Slowmode (for text channel)", value: `${target.rateLimitPerUser}s`, inline: true},
                    {name: "📡 Bitrate", value: `${target.bitrate/1000} kbps`, inline: true},
                    {name: "🎥 Video Quality Setting", value: `${ target.videoQualityMode === null ? "Auto" : (target.videoQualityMode === 1 ? "Auto" : "720p")}`, inline: true},
                    {name: "💎 Max Capacity", value: `${target.userLimit === 0 ? "No limit" : target.userLimit}`, inline: true},
                    {name: "🌎 Region", value: `${target.rtcRegion || "Auto"}`, inline: true},
                )
                break
            case 15:
                channelinfo.addFields(
                    {name: "💳 Name", value: target.name, inline: true},
                    {name: "🆔 ID", value: target.id, inline: true},
                    {name: "📚 Type", value: "Forum", inline: true},
                    {name: "🔍 Post Guidelines", value: `\`\`\`${target.topic || "No guidelines set"}\`\`\``, inline: false},
                    {name: "📅 Created on", value: "<t:"+`${target.createdTimestamp}`.slice(0,10)+":D>", inline: true},
                    {name: "🔗 URL", value: `[Click Here](${target.url})`, inline: true},
                    {name: "🤖 WebHooks", value: `${(await target.fetchWebhooks()).size}`, inline: true},
                    {name: "🧵 Active Posts", value: `${(await target.threads.fetch()).threads.size}`, inline: true},
                    {name: "📁 Parent Category", value: `${target.parent.name}`, inline: true},
                    {name: "🔞 NSFW status", value: `${target.nsfw ? "Yes, channel is NSFW" : "No, channel is not NSFW"}`, inline: true},
                    {name: "🛑 Slowmode (per post)", value: `${target.rateLimitPerUser}s`, inline: true}
                )
                break
        }
        await interaction.reply({embeds: [channelinfo]})
    },
};
