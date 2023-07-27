process.env.NODE_NO_WARNINGS = 1;

import Discord, { Collection } from 'discord.js';
import Keys from './keys.js';
import Register from './src/utils/registry.js';
import CreateEmbed from './src/utils/createEmbed.js';

const client = new Discord.Client({
    allowedMentions: { parse: [] },
    partials: [ 'CHANNEL' ],
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildModeration,
        Discord.GatewayIntentBits.MessageContent,
    ],
    waitGuildTimeout: 45_000
});

process.env.TZ = 'Africa/Abidjan';

(async () => {
    client.media = new Map();
    client.antiflood = new Map();
    client.antiinvites = new Map();
    client.antilinks = new Map();
    client.antimayus = new Map();
    client.prefixes = new Map();
    client.ignchannels = new Map();
    client.logs = new Map();
    client.reactlogs = new Map();
    client.stocks = new Map();
    client.emojis.no = '<:YN9_NO:830226991025487913>';
    client.emojis.yes = '<:YN9_SI:830226925377028126>';
    client.keys = Keys;
    client.color = Keys.COLOR;
    client.commandsUsed = 0;
    client.dbPrefix = new Map();
    client.generalCooldown = new Map();
    client.commands = new Collection();
    client.events = new Collection();
    client.embed = CreateEmbed;
    await Register.registerCommands(client, '../commands');
    await Register.registerEvents(client, '../events');
    await client.login(Keys.CLIENT_TOKEN);
})();