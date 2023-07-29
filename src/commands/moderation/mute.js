import ms from 'ms';
import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class Mute extends BaseCommand {
    constructor() {
        super();
        this.name = 'mute';
        this.aliases = ['m', 'silenciar'],
        this.category = 'moderation';
        this.permissions = {
            user: ['ModerateMembers'],
            client: ['ManageRoles', 'ModerateMembers'],
        };
        this.description = 'Silencia a un usuario';
        this.usage = `$(prefix)mute {miembro} [Duración] [razón]`;
        this.args = [
            {
                name: 'member',
                required: true,
                start: 0,
                end: 1,
            },
            {
                name: 'time',
                required: false,
                start: 1,
                end: 2,
            },
            {
                name: 'reason',
                required: false,
                start: 1,
                end: undefined,
            }
        ]
    }

    /**
     * 
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').Message} message 
     */
    async init (client, message, args) {
        const target_member = await message.guild.members.fetch(this.resolveId(args.get('member'))).catch(() => null);;
        if (!target_member) return message.reply({ embeds: [client.embed(`${client.emj.no} | No se ha encontrado al usuario`, message.author)] });

        let tempMute = args.get('time') ? ms(args.get('time')) : false; // Time resolveable
        let reason = args.get('reason');
        reason = tempMute ? reason.replace(args.get('time') + '', '') : reason; // If time is valid, remove it from reason
        reason = reason || 'N/A';
        reason = reason.trim();

        const commandResult = await client.commands.get('integrated-warn').init(client, message, new Map([
            ['user', target_member.id],
            ['reason', reason],
            ['moderator', message.author.id],
            ['type', 'mute'],
            ['duration', tempMute || 0],
            ['saveToApi', true]
        ]));
        
        if (commandResult) message.channel.send(`${client.emj.yes} | ¡**${target_member.user.username}** ha sido silenciado correctamente!`)
    }
}