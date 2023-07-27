import Path from 'path';
import Fs from 'fs/promises';
import commons from './commons.js';

const { __dirname } = commons(import.meta.url);

async function registerCommands(client, dir) {
    const files = await Fs.readdir(Path.join(__dirname, dir));
    for (const file of files) {
        const stat = await Fs.lstat(Path.join(__dirname, dir, file));
        if (stat.isDirectory()) await registerCommands(client, Path.join(dir, file));
        if (file.endsWith('.js')) {
            try {
                const Command = await import(`file:///${Path.join(__dirname, dir, file)}`);
                const cmd = new Command.default();
                client.commands.set(cmd.name, cmd);
            } catch (err) {
                console.log(err);
            }
        }
    }
}

async function registerEvents(client, dir) {
    const files = await Fs.readdir(Path.join(__dirname, dir));
    for (const file of files) {
        const stat = await Fs.lstat(Path.join(__dirname, dir, file));
        if (stat.isDirectory()) {
            await registerEvents(client, Path.join(dir, file));
        } else if (file.endsWith('.js')) {
            try {
                const Event = await import(`file:///${Path.join(__dirname, dir, file)}`);
                const event = new Event.default();
                client.on(event.name, event.run.bind(event, client));
                client.events.set(event.name, event);
            } catch (err) {
                console.log(err);
            }
        }
    }
}

const obj = {
    registerCommands,
    registerEvents,
};

export default obj;
