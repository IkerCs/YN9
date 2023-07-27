import BaseEvent from '../../utils/classes/BaseEvent.js';
import WebSocket from 'ws';

export default class Ready extends BaseEvent {
    constructor() {
        super();
        this.name = 'ready';
    }

    /**
     * 
     * @param {import('discord.js').Client} client 
     */
    async run (client) {
        console.log(`Shard (#${client.shard.ids}): ${client.user.tag} listo!`);
        this.connectWebSocket(client);

        for (const guild of await client.guilds.fetch()) {
            let response = await this.get(guild[0], '/');
            if (response.status != 200) {
                await this.put(guild[0]);
                response = await this.get(guild[0], '/');
            }
            client.guilds.cache.get(guild[0]).customData = response.data;            
        }
    }

    /**
     * 
     * @param {import('discord.js').Client} client 
     */
    connectWebSocket(client) {
        const ws = new WebSocket(client.keys.YN9_WEBSOCKET);
        ws.on('open', () => {
            console.log(`Shard (#${client.shard.ids}): Conectado al websocket de YN9`);
            ws.send(JSON.stringify({ type: 'auth', data: { Authorization: client.keys.API_KEY } }));
            client.YN9_WEBSOCKET = ws;
        });
        
        ws.on('message', (message) => {
            if (!isJSON(message.toString())) return;
            const messageObject = JSON.parse(message.toString());
            if (messageObject.type == 'update') {
                const { target, parameter, data } = messageObject.data;
                client.guilds.cache.get(target).customData[parameter] = data;    
            }
        });

        ws.on('close', () => {
            console.log(`Shard (#${client.shard.ids}): Desconectado del websocket de YN9, reconectando shard...`);
            client.shard.broadcastEval((c, ctx) => {
                if (c.shard.ids[0] == ctx[0]) process.exit();
            }, { context: client.shard.ids });
        });
        ws.on('error', (err) => {
            if (err.message.startsWith('connect ECONNREFUSED')) {
                console.log(`Shard (#${client.shard.ids}): No se pudo conectar al websocket de YN9, reconectando websocket...`);
                setTimeout(() => this.connectWebSocket(client), 1000);
            } else {
                console.log(`Shard (#${client.shard.ids}) Error inesperado en WebSocket...`)
            }
        });
    }
}

function isJSON (str) {
    try {
        JSON.parse(str);
        return true;
    } catch (error) {
        return false;
    }
}