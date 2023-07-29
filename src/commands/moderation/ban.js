import ms from 'ms';
import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class Ban extends BaseCommand {
    constructor() {
        super();
        this.name = 'ban';
        this.aliases = ['b'],
        this.category = 'moderation';
        this.permissions = {
            user: ['BanMembers'],
            client: ['ManageRoles', 'ModerateMembers'],
        };
        this.description = 'Banea a un usuario';
        this.usage = `$(prefix)ban {miembro} [Duración] [razón]`;
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

        let tempBan = args.get('time') ? ms(args.get('time')) : false; // Time resolveable
        let reason = args.get('reason');
        reason = tempBan ? reason.replace(args.get('time') + '', '') : reason; // If time is valid, remove it from reason
        reason = reason || 'N/A';
        reason = reason.trim();

        const commandResult = await client.commands.get('integrated-warn').init(client, message, new Map([
            ['user', target_member.id],
            ['reason', reason],
            ['moderator', message.author.id],
            ['type', 'ban'],
            ['duration', tempBan || 0],
            ['saveToApi', true],
        ]));
        
        if (commandResult) message.channel.send(`${client.emj.yes} | ¡**${target_member.user.username}** ha sido baneado correctamente!`)
    }
}