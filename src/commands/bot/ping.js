import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class Ping extends BaseCommand {
    constructor() {
        super();
        this.name = 'ping';
        this.aliases = [],
        this.category = 'bot';
        this.permissions = {
            user: [],
            client: [],
        };
        this.description = 'Comprueba el tiempo de respuesta del bot para cada solicitud';
        this.usage = `$(prefix)ping`;
        this.args = [];
    }

    /**
     * 
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').Message} message
     * @param {Map<string, string>} specificArgs
     */
    async init (client, message, args) {
        const discordBefore = Date.now();
        const msg = await message.reply({ embeds: [client.embed('Espera..., estamos calculando...', message.author)] }).catch((c) => c);
        const discordAfter = Date.now();
        
        const apiBefore = Date.now();
        await this.get(message.guildId, '/param?v=prefixes');
        const apiAfter = Date.now();

        const wsBefore = Date.now();
        client.YN9_WEBSOCKET.send(JSON.stringify({ type: 'ping' }));
        client.YN9_WEBSOCKET.onmessage = () => {
            const wsAfter = Date.now();
            msg.edit({embeds: [client.embed(
`**Discord**: ${discordAfter - discordBefore}ms
**YN9 API**: ${apiAfter - apiBefore}ms
**YN9 WS**: ${wsAfter - wsBefore}ms`, message.author)]}).catch((c) => c);
        }
    }
}