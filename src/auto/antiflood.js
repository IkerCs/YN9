export default async function (client, message) {
    if (!message.guild.customData?.antiFlood.active) return;
    if (isFlood(client, message)) {
        client.commands.get('integrated-warn')
            .init(client, message, new Map([
                ['user', message.author.id],
                ['reason', 'Flood'],
                ['moderator', client.user.id],
                ['type', message.guild.customData?.antiFlood.punishment.type],
                ['duration', message.guild.customData?.antiFlood.punishment.duration],
                ['saveToApi', true],
            ]));
    }    
}

/**
 * 
 * @param {import('discord.js').Client} client 
 * @param {import('discord.js').Message} message 
 */
function isFlood(client, message) {
    message.channel.antiFloodMap = message.channel.antiFloodMap || new Map();
    const { mps, seg, active, users, roles, channels } = message.guild.customData.antiFlood;
    if (!active) return false;
    if (users.some((user) => user.id == message.author.id)) return false;
    if (roles.some((role) => message.member.roles.cache.has(role))) return false;
    if (channels.some((channel) => channel == message.channelId)) return false;

    if (message.channel.antiFloodMap.has(message.author.id)) {
        const object = message.channel.antiFloodMap.get(message.author.id);
        map.set(message.author.id, object + 1);
        if (object + 1 >= mps) return true;
    } else {
        map.set(unicode, 1)
        setTimeout(() => {
            map.delete(unicode);
        }, seg * 1000)
    }
    return false;
}