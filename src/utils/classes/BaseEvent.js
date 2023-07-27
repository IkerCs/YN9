import humanizeDuration from 'humanize-duration';
import { get, post, put, del } from '../../server/request.js';

export default class BaseEvent {
    constructor (name) {
        this.name = name;
    }

    isJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (error) {
            return false;
        }
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