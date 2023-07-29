import BaseEvent from '../../utils/classes/BaseEvent.js';
import WebSocket from 'ws';

export default class GuildMemberAdd extends BaseEvent {
    constructor() {
        super();
        this.name = 'guildMemberAdd';
    }

    /**
     * 
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').GuildMember} member
     */
    async run (client, member) {
        console.log('NEW MEMBER: ', member.user.username);
        const warnings = await this.get(member.guild.id, '/activeWarnings');
        warnings.data.forEach(async (warning) => {
            if (warning.type == 'ban') {
                await member.send(`${client.emj.no} | Tu baneo no ha terminado, podrás reingresar a ${member.guild.name} cuando finalice.\nRestante: \`${warning.expires > 0 ? this.humanize((warning.date + warning.expires) - Date.now()) : 'Permanente'}\``)
                member.guild.members.ban(warning.user_id, { reason: `${warning.reason} | Baneo sin finalizar` })
                    .catch((e) => (e));
            } else if (warning.type == 'mute') {
                if (member.guild.customData.muteRole) {
                    member.roles.add(member.guild.customData.muteRole, `${warning.reason} | Muteo sin finalizar`)
                        .catch((e) => (e));
                }
            }
        })
    }
}