process.env.NODE_NO_WARNINGS = 1;

import Discord from 'discord.js';
import Path from 'path';
import Commons from './src/utils/commons.js';
import Keys from './keys.js';

const { __dirname } = Commons(import.meta.url);

(async () => {
    const manager = new Discord.ShardingManager(Path.join(__dirname, 'bot.js'), {
        token: Keys.CLIENT_TOKEN,
    });
    manager.on('shardCreate', (shard) => {
        console.log(`SHARD SPAWNED with ID ${shard.id}`);
    });
    await manager.spawn({
        amount: 'auto',
    });
})();