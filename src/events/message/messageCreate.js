import BaseEvent from '../../utils/classes/BaseEvent.js';
import auto from '../../auto/index.js';
export default class Message extends BaseEvent {
    constructor() {
        super();
        this.name = 'messageCreate';
    }

    /**
     * 
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').Message} message 
     */
    async run (client, message) {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (!message.author) return;
        if (!message.member) return;

        message.guild.prefix = client.keys.PREFIX;
        for (let prefix of message.guild.customData.prefixes) {
            prefix = prefix.replace('{client.mention}', `<@${client.user.id}>`);
            if (message.content.startsWith(prefix)) {
                message.guild.prefix = prefix;
            }
        }

        const args = message.content.slice(message.guild.prefix.length).trim().split(/\s+/g);
        const command = args.shift().toLowerCase();

        if (message.content.toLowerCase().startsWith(message.guild.prefix.toLowerCase())) {
            const cmd = client.commands.get(command) || client.commands.find((c) => c.aliases && c.aliases.includes(command));
            if (cmd) {
                const permissionsForChannel = message.channel.permissionsFor(client.user);
                if (!permissionsForChannel.has('SEND_MESSAGES')
                 || !permissionsForChannel.has('EMBED_LINKS')
                 || !permissionsForChannel.has('READ_MESSAGE_HISTORY')
                 || !permissionsForChannel.has('ATTACH_FILES')) {
                    message.author.send({
                        content: `Para una funcionalidad básica de YN9 es importante que tenga permisos básicos, avisa a un administrador para que compruebe que tenga estos permisos:\n\`Enviar mensajes\`, \`Insertar enlaces\`, \`Adjuntar archivos\`, \`Leer el historial de mensajes\``,
                    }).catch((c) => c);
                }
                let userPermissions = true;
                let clientPermissions = true;
                let cooldown = false;
                let remaining = 0;
                // Command default permissions
                for (const perm of cmd.permissions.user) { if (!message.member.permissionsIn(message.channel).has(perm)) userPermissions = false; }
                for (const perm of cmd.permissions.client) { if (!message.guild.members.resolve(client.user).permissionsIn(message.channel).has(perm)) clientPermissions = false }
                
                if (message.guild.customData.commands.find((c) => c.command == cmd.name)) {
                    const customCommand = message.guild.customData.commands.find((c) => c.command == cmd.name);
                    const permissions = customCommand.permissions.user;
                    for (const perm of permissions) { if (!message.member.permissionsIn(message.channel).has(perm)) userPermissions = false; }
                
                    const roles = customCommand.permissions.roles;
                    for (const role of roles) { if (message.member.roles.cache.has(role)) userPermissions = true; }
                
                    if (customCommand.cooldown.users.some((user) => user.id == message.author.id)) {
                        const user = customCommand.cooldown.users.find((user) => user.id == message.author.id);
                        remaining = (user.start + customCommand.cooldown.duration) - Date.now();
                        if (remaining > 0) cooldown = true;
                    }
                } else {
                    const customCommand = {
                        command: cmd.name,
                        enabled: true,
                        permissions: {
                            bot: [],
                            user: [],
                            roles: [],
                        },
                        ignore: {
                            channels: [],
                            roles: [],
                            users: [],
                        },
                        cooldown: {
                            duration: 0,
                            users: [{id: message.author.id, start: Date.now()}],
                        }
                    };
                    await this.post(message.guild.id, '/commands', customCommand);
                }

                if (!userPermissions) return message.reply({ embeds: [client.embed('No tienes los permisos necesarios para ejecutar esta acción.', message.author)] }).catch((c) => c);
                if (!clientPermissions) return message.reply({ embeds: [client.embed('No tengo los permisos necesarios para ejecutar esa acción.', message.author)] }).catch((c) => c);
                if (cooldown && !message.member.permissionsIn(message.channel).has('ManageMessages')) return message.reply({ embeds: [client.embed(`¡Espera! Podrás volver a utilizar el comando dentro de \`${this.humanize(remaining)}\``, message.author)] }).catch((c) => c);
                const specificArgs = new Map();
                for (const argument of cmd.args) {
                    let arg_error = false;
                    const argument_value = args.slice(argument.start, argument.end || args.length);
                    if (argument.end && argument_value.length != (argument.end - argument.start)) arg_error = true;
                    if (argument.required && argument_value.length == 0) arg_error = true;
                    if (arg_error) return message.reply({ embeds: [client.embed(`Asegúrate de utilizar este comando correctamente, utiliza \`${message.guild.prefix}help ${cmd.name}\` para obtener más información.`, message.author)]});
                    specificArgs.set(argument.name, argument_value.join(' '));
                }

                let newCommandValue = message.guild.customData.commands.find((c) => c.command == cmd.name);
                newCommandValue.cooldown.users = newCommandValue.cooldown.users.filter((user) => user.id != message.author.id);
                newCommandValue.cooldown.users.push({ id: message.author.id, start: Date.now() });
                await this.post(message.guild.id, '/commands', newCommandValue);
                cmd.init(client, message, specificArgs);
            }
        }
    }
}