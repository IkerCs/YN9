import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class Warn extends BaseCommand {
    constructor() {
        super();
        this.name = 'warn';
        this.aliases = ['w', 'advertir'],
        this.category = 'moderation';
        this.permissions = {
            user: ['ModerateMembers'],
            client: ['ManageRoles', 'ModerateMembers'],
        };
        this.description = 'Advierte a un usuario';
        this.usage = `$(prefix)warn {miembro} [razón]`;
        this.args = [
            {
                name: 'member',
                required: true,
                start: 0,
                end: 1,
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

        const commandResult = await client.commands.get('integrated-warn').init(client, message, new Map([
            ['user', target_member.id],
            ['reason', args.get('reason') || 'No especificada'],
            ['moderator', message.author.id],
            ['type', 'warn'],
            ['duration', 0],
            ['saveToApi', true]
        ]));
        
        if (commandResult) message.channel.send(`${client.emj.yes} | ¡**${target_member.user.username}** ha sido advertido correctamente!`)
    }
}