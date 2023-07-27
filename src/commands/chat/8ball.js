import Discord from "discord.js";
import BaseCommand from "../../utils/classes/BaseCommand.js";

export default class Ball extends BaseCommand {
    constructor() {
        super();
        this.name = '8ball';
        this.aliases = [],
        this.category = 'fun';
        this.permissions = {
            user: [],
            client: [],
        };
        this.description = 'Responderé a tu pregunta';
        this.usage = `$(prefix)8ball {Pregunta}`;
        this.args = [
            {
                name: 'pregunta',
                required: true,
                start: 0,
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
        message.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                    .setColor(client.color)
                    .addFields([
                        {
                            name: 'Tu pregunta:',
                            value: this.reduce(args.get('pregunta')),
                            inline: true,
                        },
                        {
                            name: 'Mi respuesta:',
                            value: this.answers[Math.floor(Math.random() * this.answers.length)],
                            inline: true,
                        },
                    ]),
            ]
        });
    }

    answers = [
        'Sí',
        'No',
        'Tal vez',
        'No lo sé',
        'No lo creo',
        'Probablemente',
        'Seguramente no',
        'Eso es imposible',
        'Definitivamente sí',
        'Estoy seguro que no',
        'Pregúntame más tarde',
        'Ahora mismo no lo sé',
    ]
}