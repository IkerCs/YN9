import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class Unban extends BaseCommand {
    constructor() {
        super();
        this.name = 'unban';
        this.aliases = ['ub', 'desbanear'],
            this.category = 'moderation';
        this.permissions = {
            user: ['BanMembers'],
            client: ['ManageRoles', 'ModerateMembers'],
        };
        this.description = 'Desbanea a un usuario';
        this.usage = `$(prefix)unban {miembro}`;
        this.args = [{
            name: 'member',
            required: true,
            start: 0,
            end: 1,
        }, ]
    }

    /**
     * 
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').Message} message 
     */
    async init(client, message, args) {
        const target_user = await client.users.fetch(this.resolveId(args.get('member')));
        if (!target_user) return message.reply({
            embeds: [client.embed(`${client.emj.no} | No se ha encontrado al usuario`, message.author)]
        });

        let unbanned = false;
        if ((await message.guild.bans.fetch()).find((x) => x.user.id == target_user.id)) {
            message.guild.members.unban(target_user)
                .then(() => unbanned = true)
                .catch(() => unbanned = false);
        }

        const warnings = await this.get(message.guild.id, `/param?v=warnings`);
        const userWarnings = warnings.data.value.filter((w) => w.user_id == target_user.id);
        const activeBans = userWarnings.filter((w) => w.active && w.type == 'ban');
        for (const w of activeBans) {
            unbanned = true;
            await this.post(message.guild.id, '/warnings', {
                user_id: w.user_id,
                type: w.type,
                reason: w.reason,
                moderator: w.moderator,
                date: w.date,
                id: w.id,
                expires: w.expires,
                active: false,                  
            });
        }

        if (!unbanned) message.reply('El usuario no estaba baneado')
        else message.reply(`Se desbaneó correctamente a \`${target_user.username}\``);
    }
}