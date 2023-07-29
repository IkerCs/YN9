import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class IntegratedWarn extends BaseCommand {
    constructor() {
        super();
        this.name = 'integrated-warn';
        this.aliases = [],
            this.category = 'integrated';
        this.permissions = {
            user: [],
            client: [],
        };
        this.description = 'Comando integrado, no disponible para usuarios';
        this.usage = `$(prefix)test`;
        this.args = [];
    }

    /**
     * 
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').Message} message
     * @param {Map<string, string>} specificArgs
     */
    async init(client, message, args) {
        const member_target = await message.guild.members.fetch(args.get('user'));
        const moderator = args.get('moderator');
        const reason = args.get('reason');
        const type = args.get('type');
        const duration = args.get('duration');
        const saveToApi = args.get('saveToApi');

        if (!member_target) return false;

        if (type == 'text-warning') {
            message.channel.send(`${member_target.toString()}, para evitar sanciones mayores evita realizar \`${reason}\``);
            return true;
        }

        if (saveToApi) {
            await this.post(message.guild.id, '/warnings', {
                user_id: member_target.id,
                type: type,
                reason: reason,
                moderator: moderator,
                date: Date.now(),
                id: await this.getId(message.guild.id),
                expires: duration,
                active: this.active(duration, type),
            });
        }

        switch (type) {
            case 'warn':
                member_target.send(`Has sido advertido en **${message.guild.name}**\nRazón: \`${reason}\``);
                return true;
                break;
            case 'mute':
                let MAX_TIMEOUT_TIMESPAN = 1_209_600_000;
                const originalMuteRole = message.guild.customData.muteRole;
                if (duration == 0) {
                    message.guild.customData.muteRole = await this.fetchMutedRole(message.guild);
                    member_target.roles.add(message.guild.customData.muteRole, reason);
                } else if (duration > MAX_TIMEOUT_TIMESPAN) {
                    message.guild.customData.muteRole = await fetchMutedRole(message.guild);
                    member_target.roles.add(message.guild.customData.muteRole, reason);
                } else {
                    console.log(duration);
                    member_target.timeout(duration, reason);
                }

                if (originalMuteRole != message.guild.customData.muteRole) {
                    await this.post(message.guild.id, '/muteRole', {
                        value: message.guild.customData.muteRole
                    });
                }

                await member_target.send(`Has sido silenciado en **${message.guild.name}**\nRazón: \`${reason}\`\nDuración: \`${duration == 0 ? 'Permanente' : this.humanize(duration)}\``);
                break;
            case 'kick':
                await member_target.send(`Has sido expulsado de **${message.guild.name}**\nRazón: \`${reason}\``).catch((e) => e);
                member_target.kick(reason)
                    .catch(() => {
                        message.channel.send('No se ha podido expulsar al usuario')
                        return false;
                    });
                break;
            case 'ban':
                await member_target.send(`Has sido baneado de **${message.guild.name}**\nRazón: \`${reason}\`\nDuración: \`${duration == 0 ? 'Permanente' : this.humanize(duration)}\``);
                member_target.ban({
                        reason
                    })
                    .catch(() => {
                        message.channel.send('No se ha podido banear al usuario');
                        return false;
                    });
                break;
        }
        return true;
    }

    /**
     * 
     * @param {import('discord.js').Guild} guild 
     */
    async fetchMutedRole(guild) {
        if (guild.roles.cache.get(guild.customData.muteRole)) return guild.customData.muteRole;
        if (guild.roles.cache.find((role) => role.name.toLowerCase() == 'silenciado')) return guild.roles.cache.find((role) => role.name.toLowerCase() == 'silenciado') ?.id;
        if (guild.roles.cache.find((role) => role.name.toLowerCase() == 'muted')) return guild.roles.cache.find((role) => role.name.toLowerCase() == 'muted') ?.id;

        const mutedRole = await guild.roles.create({
            name: 'Silenciado',
            color: '#8b8b8b',
            reason: 'Creación de rol para silenciar usuarios',
        });

        for (const channel of guild.channels.cache) {
            if (channel[1].isTextBased()) {
                await channel[1].permissionOverwrites.create(muteRole, {
                    SendMessages: false,
                });
            } else if (channel[1].isVoiceBased()) {
                await channel[1].permissionOverwrites.create(muteRole, {
                    Speak: false,
                    Connect: false,
                    Stream: false,
                });
            }
        }

        return mutedRole.id;
    }

    async getId(guild_id) {
        const id = this.randomString(6);
        const warnings = await this.get(guild_id, '/param?v=warnings');
        if (warnings.data.value.find((warning) => warning.id == id)) this.getId(guild_id);
        else return id;
    }

    active(duration, type) {
        if (['warn', 'kick'].includes(type)) return false;
        return true;
    }
}