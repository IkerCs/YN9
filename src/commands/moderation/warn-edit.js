import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'discord.js';
import ms from 'ms';
import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class WarnEdit extends BaseCommand {
    constructor() {
        super();
        this.name = 'warn-edit';
        this.aliases = ['warnedit', 'edit-warn', 'editwarn', 'modinf'],
        this.category = 'moderation';
        this.permissions = {
            user: ['ModerateMembers'],
            client: ['ManageRoles', 'ModerateMembers'],
        };
        this.description = 'Modifica la advertencia de un usuario';
        this.usage = `$(prefix)warn-edit {id} [duración] [razón]`;
        this.args = [
            {
                name: 'id',
                required: true,
                start: 0,
                end: 1,
            },
            {
                name: 'duration',
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
        const id = args.get('id');
        
        const warnings = await this.get(message.guild.id, '/param?v=warnings');
        const warn = warnings.data.value.find(w => w.id === id);

        if (!warn) return message.reply({ embeds: [client.embed(`${client.emj.no} | No se ha encontrado la advertencia`, message.author)] });

        let duration = args.get('duration') ? ms(args.get('duration')) : false; // Time resolveable
        if (!['ban', 'mute'].includes(warn.type)) duration = false;
        let reason = args.get('reason');
        reason = duration ? reason.replace(args.get('duration') + '', '') : reason; // If time is valid, remove it from reason
        reason = reason || 'N/A';
        reason = reason.trim();

        const newWarning = {
            user_id: warn.user_id,
            type: warn.type,
            reason: reason,
            moderator: warn.moderator,
            date: warn.date,
            id: warn.id,
            expires: duration > 0 ? duration : 0,
            active: this.active(duration, warn.date, warn.type),
        }

        const embed = new EmbedBuilder()
            .addFields(
                { name: 'Anterior', value: `${this.warningToString(warn)}`, inline: true},
                { name: 'Nuevo', value: `${this.warningToString(newWarning)}`, inline: true}
            )
            .setColor(client.color)
            .setAuthor({ name: message.author.username, iconURL: message.author?.displayAvatarURL({ extension: 'png' })});
        const yes = new ButtonBuilder()
            .setCustomId('yes')
            .setStyle('Success')
            .setEmoji('✅');
        const no = new ButtonBuilder()
            .setCustomId('no')
            .setStyle('Danger')
            .setEmoji('❎');
        const actionRow = new ActionRowBuilder().addComponents([yes, no]);
        const confirmation = await message.channel.send({ embeds: [embed], components: [actionRow] });
        const collector = confirmation.createMessageComponentCollector({ filter: (i) => i.user.id === message.author.id, time: 30000 });
        collector.on('collect', async (i) => {
            collector.stop(i.customId);
        });
        collector.on('end', async (c, r) => {
            if (r == 'yes') {
                confirmation.edit({ components: [], embeds: [], content: `Advertencia (\`${args.get('id')}\`) ha sido editada`});
                await this.post(message.guild.id, '/warnings', newWarning);
                if (newWarning.active) {
                    const commandResult = await client.commands.get('integrated-warn').init(client, message, new Map([
                        ['user', newWarning.user_id],
                        ['reason', newWarning.reason],
                        ['moderator', newWarning.moderator],
                        ['type', newWarning.type],
                        ['duration', (newWarning.date + newWarning.expires) - Date.now()],
                        ['saveToApi', false],
                    ]));
                    
                    const user = client.users.cache.get(newWarning.user_id)?.username || newWarning.user_id;
                    if (commandResult) message.channel.send(`${client.emj.yes} | ¡**${user}** ha sido ${newWarning.type == 'ban' ? 'baneado' : 'silenciado'} correctamente!`)            
                }
            } else {
                confirmation.edit({ components: [], embeds: [], content: `No se ha realizado ningún cambio`})
            }
        })
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