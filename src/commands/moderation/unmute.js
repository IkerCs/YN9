import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class Unban extends BaseCommand {
    constructor() {
        super();
        this.name = 'unmute';
        this.aliases = ['um', 'desilenciar'],
            this.category = 'moderation';
        this.permissions = {
            user: ['ModerateMembers'],
            client: ['ManageRoles', 'ModerateMembers'],
        };
        this.description = 'Desilencia a un usuario';
        this.usage = `$(prefix)unmute {miembro}`;
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
        const target_member = await message.guild.members.fetch(this.resolveId(args.get('member'))).catch(() => null);;
        if (!target_member) return message.reply({
            embeds: [client.embed(`${client.emj.no} | No se ha encontrado al usuario`, message.author)]
        });

        let removedSilence = false;
        if (message.guild.customData.muteRole) {
            if (target_member.roles.cache.has(message.guild.customData.muteRole)) {
                target_member.roles.remove(message.guild.customData.muteRole, `Desilenciado por ${message.author.username}`)
                    .then(() => {
                        removedSilence = true;
                    })
                    .catch(() => {
                        message.channel.send('No se ha podido desilenciar al usuario (m)');
                        return;
                    });
            } else {
                target_member.disableCommunicationUntil(null, `Desilenciado por ${message.author.username}`)
                    .then(() => {
                        removedSilence = true;
                    })
                    .catch(() => {
                        message.channel.send('No se ha podido desilenciar al usuario (mt)');
                        return;
                    })
            }
        } else {
            target_member.disableCommunicationUntil(null, `Desilenciado por ${message.author.username}`)
                .then(() => {
                    removedSilence = true;
                })
                .catch(() => {
                    message.channel.send('No se ha podido desilenciar al usuario (t)');
                    return;
                });
        }

        const warnings = await this.get(message.guild.id, `/param?v=warnings`);
        const userWarnings = warnings.data.value.filter((w) => w.user_id == target_member.id);
        const activeMutes = userWarnings.filter((w) => w.active && w.type == 'mute');
        for (const w of activeMutes) {
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
        
        if (removedSilence || activeMutes.length > 0) message.reply(`¡Se ha desilenciado a \`${target_member.user.username}\` correctamente!`);
        else message.reply('No se detecto que el usuario esté silenciado, ¿Está silenciado?');
    }
}