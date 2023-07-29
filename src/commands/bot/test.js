import BaseCommand from "../../utils/classes/BaseCommand.js";
import Util from 'util';

export default class Test extends BaseCommand {
    constructor() {
        super();
        this.name = 'test';
        this.aliases = ['eval'],
        this.category = 'debug';
        this.permissions = {
            user: [],
            client: [],
        };
        this.description = 'Comando personalizado de uso exclusivamente para debugeo';
        this.usage = `$(prefix)test`;
        this.args = [
            {
                name: 'code',
                required: true,
                start: 0,
                end: undefined,
            }
        ];
    }

    /**
     * 
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').Message} message
     * @param {Map<string, string>} specificArgs
     */
    async init (client, message, args) {
        message.reply('Ejecutando...');
        try {
            let evaluate = args.get('code');
            while (evaluate.includes('\u201C')) evaluate = evaluate.replace('\u201C', '"');
            while (evaluate.includes('\u201D')) evaluate = evaluate.replace('\u201D', '"');
            while (evaluate.includes('\u2018')) evaluate = evaluate.replace('\u2018', '\'');
            while (evaluate.includes('\u2019')) evaluate = evaluate.replace('\u2019', '\'');
            while (evaluate.includes('\u201A')) evaluate = evaluate.replace('\u201A', '\'');
            while (evaluate.includes('\u201B')) evaluate = evaluate.replace('\u201B', '\'');

            let evaled = await eval (evaluate);
            if (typeof evaled !== 'string') evaled = Util.inspect(evaled);
            while (evaled.includes(client.token)) evaled.replace(client.token, 'TOKEN');
            message.channel.send(`\`\`\`js\n${this.reduce(evaled, 1950)}\`\`\``);
        } catch (err) {
            message.channel.send(`\`\`\`js\n${this.reduce(err, 1950)}\`\`\``);
        }
    }
}