import humanizeDuration from 'humanize-duration';
import { get, post, put, del } from '../../server/request.js';

export default class BaseCommand {
    constructor (name, category, aliases, description, usage, permissions, args, cooldown, api) {
        this.name = name;
        this.category = category;
        this.aliases = aliases;
        this.description = description;
        this.usage = usage;
        this.permissions = permissions;
        this.args = args;
        this.cooldown = cooldown;
        this.api = api;
    };

    reduce (content = '', length = 1020) {
        if (content.length >= length) {
            content = content.split('', length);
            content = content.join('');
            content += '...';
        }
        return content;
    }

    randomString (length = 5) {
        const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
        let string = '';
        for (let i = 0; i < length; i++) {
            string += letters[Math.floor(Math.random() * letters.length)];
        }
        return string;
    }

    humanize (ms = 0) {
        return humanizeDuration(ms, {
            language: 'es',
            round: true,
            conjunction: ' y ',
            serialComma: false,
            units: ['y', 'mo', 'w', 'd', 'h', 'm', 's'],
        });
    }

    get = get;
    post = post;
    put = put;
    del = del;
}