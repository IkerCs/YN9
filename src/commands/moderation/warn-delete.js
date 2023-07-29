import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class WarnDelete extends BaseCommand {
    constructor() {
        super();
        this.name = 'warn-delete';
        this.aliases = ['warndelete', 'delete-warn', 'deletewarn', 'delinf'],
        this.category = 'moderation';
        this.permissions = {
            user: ['ModerateMembers'],
            client: ['ManageRoles', 'ModerateMembers'],
        };
        this.description = 'Elimina una advertencia de un usuario';
        this.usage = `$(prefix)warn-delete {id}`;
        this.args = [
            {
                name: 'id',
                required: true,
                start: 0,
                end: 1,
            },
        ]
    }

    /**
     * 
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').Message} message 
     */
    async init (client, message, args) {
        const target_user = this.resolveId(args.get('id')) ? await client.users.fetch(this.resolveId(args.get('id'))).catch(() => null) : undefined;

        const warnings = await this.get(message.guild.id, '/param?v=warnings');
        if (target_user) {
            const warns = warnings.data.value.filter((warn) => warn.user_id == target_user.id);
            if (!warns) return message.reply(`${client.emj.no} | ¡El usuario (${target_user.username}) no tiene advertencias!`);
            const activeWarns = warns.filter((warn) => warn.active);
            
            for (const warn of warns) {
                await this.del(message.guild.id, '/warnings', { value: warn.id });
            }

            const member = await message.guild.members.fetch(target_user.id).catch(() => null);
            if (activeWarns.some((warn) => warn.type == 'ban')) {
                message.guild.members.unban(target_user.id)
                    .catch((e) => (e));
            } else if (activeWarns.some((warn) => warn.type == 'mute')) {
                const MAX_TIMEOUT_TIMESPAN = 1_209_600_000;
                const warn = activeWarns.find((warn) => warn.type == 'mute');
                if (!member) return;
                if (warn.expires > MAX_TIMEOUT_TIMESPAN || warn.expires == 0) {
                    member.roles.remove(message.guild.customData.muteRole, 'Advertencia eliminada')
                        .catch((e) => (e));
                } else {
                    member.disableCommunicationUntil(null, 'Advertencia eliminada')
                        .catch((e) => (e));
                }
            }

            message.reply(`${client.emj.yes} | Se han eliminado las advertencias del usuario (\`${member.user.username}\`)`)
            return;
        }

        const id = args.get('id');
        const warn = warnings.data.value.find(w => w.id === id);

        if (!warn) return message.reply({ embeds: [client.embed(`${client.emj.no} | No se ha encontrado la advertencia`, message.author)] });

        await this.del(message.guild.id, '/warnings', { value: warn.id });
    
        if (warn.active) {
            if (warn.type == 'ban') {
                message.guild.members.unban(warn.user_id)
                    .catch((e) => (e));
            } else if (warn.type == 'mute') {
                const MAX_TIMEOUT_TIMESPAN = 1_209_600_000;
                const member = await message.guild.members.fetch(warn.user_id);
                if (!member) return;
                if (warn.duration > MAX_TIMEOUT_TIMESPAN) {
                    member.roles.remove(message.guild.customData.muteRole, 'Advertencia eliminada')
                        .catch((e) => (e));
                } else {
                    member.disableCommunicationUntil(null, 'Advertencia eliminada')
                        .catch((e) => (e));
                }
            }
        }
        message.reply(`${client.emj.si} | Se ha eliminado la advertencia (\`${warn.id}\`)`)
    }

    warningToString(warning) {
        let { user_id, type, reason, moderator, date, id, expires, active } = warning;
        expires = this.humanize(expires);
        active = active ? 'ACTIVA' : 'EXPIRADA';
        date = new Date(date).toLocaleDateString();
        return `**Razón**: \`${reason}\`\n**Expira**: \`${expires}\`\n**Activa**: \`${active}\``;
    }
    
    active(duration, started, type) {
        if (['warn', 'kick'].includes(type)) return false;
        if (started + duration < Date.now()) return false;
        return true;
    }

}