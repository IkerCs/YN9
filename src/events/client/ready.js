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
        console.log(`Shard (#${client.shard.ids}): ${client.user.tag} en conexión con Discord!`);
        this.connectWebSocket(client);

        for (const guild of await client.guilds.fetch()) {
            let response = await this.get(guild[0], '/');
            if (response.status != 200) {
                await this.put(guild[0]);
                response = await this.get(guild[0], '/');
            }
            client.guilds.cache.get(guild[0]).customData = response.data;            
        }

        setInterval(async () => {
            for (const guild of client.guilds.cache) {
                let warnings = await this.get(guild[0], '/activeWarnings');
                warnings.data.forEach(async (warning) => {
                    if (warning.expires > 0 && (warning.date + warning.expires) < Date.now()) {
                        await this.post(guild[0], '/warnings', {
                            user_id: warning.user_id,
                            type: warning.type,
                            reason: warning.reason,
                            moderator: warning.moderator,
                            date: warning.date,
                            id: warning.id,
                            expires: warning.expires,
                            active: false,                  
                        });

                        if (warning.type == 'ban') {
                            guild[1].bans.remove(warning.user_id, 'Baneo finalizado').catch((e) => (e))
                        } else if (warning.type == 'mute' && guild[1].customData.muteRole) {
                            guild[1].members.fetch(warning.user_id)
                                .then((member) => {
                                    if (guild[1].customData.muteRole) {
                                        member.roles.remove(guild[1].customData.muteRole, 'Muteo finalizado')
                                            .catch((e) => (e));
                                    } else {
                                        member.disableCommunicationUntil(null, 'Muteo finalizado')
                                            .catch((e) => (e));
                                    }
                                })
                                .catch((e) => e);
                        }
                    } 
                })
            }
        }, 30000);

        client.ready = true;
        console.log(`Shard (#${client.shard.ids}): ${client.user.tag} listo para recibir eventos!`);
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
                console.log(`Shard (#${client.shard.ids}): No se pudo conectar al websocket de YN9, reconectando websocket dentro de (1 minuto)...`);
                setTimeout(() => this.connectWebSocket(client), 60_000);
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