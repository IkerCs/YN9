import Discord from "discord.js";
import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class Warnings extends BaseCommand {
    constructor() {
        super();
        this.name = 'warnings';
        this.aliases = ['advertencias', 'i', 'infrs'],
        this.category = 'moderation';
        this.permissions = {
            user: ['ModerateMembers'],
            client: [],
        };
        this.description = 'Revisa las advertencias de un usuario';
        this.usage = `$(prefix)warnings {usuario/id}`;
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
        const target_member = this.resolveId(args.get('id')) ? await client.users.fetch(this.resolveId(args.get('id'))).catch(() => null) : undefined;
        let currentFilter = false;
        let warnings = await this.get(message.guild.id, `/param?v=warnings`);
        if (!target_member) {
            const warn = warnings.data.value.find((warn) => warn.id == args.get('id'));
            if (!warn) return message.reply(`${client.emj.no} | No se encontró el usuario/advertencia`);
            message.reply(`\`\`\`
Usuario: ${warn.user_id} (${message.guild.client.users.cache.get(warn.user_id)?.username ?? 'Desconocido'})
Tipo: ${warn.type}
Moderador: ${warn.moderator} (${message.guild.client.users.cache.get(warn.moderator)?.username ?? 'Desconocido'})
Duración: ${this.humanize(warn.duration)}
Fecha: ${new Date(warn.date).toLocaleString()}
Activa: ${warn.active ? 'Activa' : 'Expirada'}
Razón: ${this.reduce(warn.reason, 1500)}
\`\`\``);
            return;
        }

        warnings = warnings.data.value.filter((warning) => warning.user_id == target_member.id);
        warnings = warnings.sort((a, b) => b.date - a.date);
        let warningsCopy = warnings.slice();
        const pages = Math.ceil(warnings.length / 5);
        let currentPage = 0;
        message.channel.send({
            content: this.warningMessages(warnings, message.guild),
            components: [this.actionRow()],
        }).then((m) => {
            const filter = (interaction) => interaction.user.id == message.author.id;
            const collector = m.createMessageComponentCollector({ filter, time: 1000 * 60 * 5 });
            collector.on('collect', (interaction) => {
                interaction.deferUpdate();
                switch (interaction.customId) {
                    case 'maxLeft':
                        currentPage = 0;
                        break;
                    case 'left':
                        if (currentPage > 0) currentPage--;
                        break;
                    case 'filter':
                        if (currentFilter) currentFilter = false;
                        else currentFilter = true;
                        currentPage = 0;

                        warningsCopy = currentFilter ? warnings.filter((warning) => warning.active) : warnings;
                        break;
                    case 'right':
                        if (currentPage < pages - 1) currentPage++;
                        break;
                    case 'maxRight':
                        currentPage = pages - 1;
                        break;
                }
                m.edit({ content: this.warningMessages(warningsCopy, message.guild, currentPage, currentFilter), components: [this.actionRow()] });
            })
        })
    }

    warningMessages(warnings, guild, page = 0, currentFilter = false, number = 5) {
        const pages = Math.ceil(warnings.length / number);
        const pageWarnings = warnings.slice(page * number, page * number + number);

        let result = '```\n';
        result += '  ID   |  TIPO  | MODERADOR | DURACIÓN | FECHA | ACTIVA | RAZÓN\n\n';
        for (const warn of pageWarnings) {
            result += `${warn.id} | ${warn.type} | ${guild.client.users.cache.get(warn.moderator)?.username ?? warn.moderator} | ${warn.expires == 0 ? 'N/A' : this.humanize(warn.expires, 'small')} | ${new Date(warn.date).toLocaleDateString()} | ${warn.active ? 'ACTIVA' : 'EXPIRADA' } | ${this.reduce(warn.reason, 20)}\n`;
        }
        result += `\nMostrando: ${currentFilter ? 'Activas' : 'Todas'} | Total: ${warnings.length}\n`
        result += `Página ${page + 1}/${pages} | Información específica ${guild.prefix}warnings {id}\`\`\``;
        return result;
    }

    actionRow () {
        const maxLeft = new Discord.ButtonBuilder()
            .setCustomId('maxLeft')
            .setStyle('Success')
            .setEmoji('⏮️')
        const left = new Discord.ButtonBuilder()
            .setCustomId('left')
            .setStyle('Primary')
            .setEmoji('◀️')
        const filter = new Discord.ButtonBuilder()
            .setCustomId('filter')
            .setStyle('Danger')
            .setEmoji('🔎');
        const right = new Discord.ButtonBuilder()
            .setCustomId('right')
            .setStyle('Primary')
            .setEmoji('▶️')
        const maxRight = new Discord.ButtonBuilder()
            .setCustomId('maxRight')
            .setStyle('Success')
            .setEmoji('⏭️')
        const ActionRow = new Discord.ActionRowBuilder()
            .addComponents(maxLeft, left, filter, right, maxRight);
        return ActionRow;
    }
}