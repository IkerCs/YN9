import fetch from 'node-fetch'
import keys from '../../keys.js'

export async function get (guild, route) {
    const res = await fetch(`${keys.YN9_API}${route}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': keys.API_KEY,
            'guild': guild,
        },
    });
    const data = await res.json();
    return { data, status: res.status };
}

export async function post (guild, route, body) {
    const res = await fetch(`${keys.YN9_API}${route}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': keys.API_KEY,
            'guild': guild,
        },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    return { data, status: res.status };
}

export async function put (guild) {
    const res = await fetch(`${keys.YN9_API}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': keys.API_KEY,
            'guild': guild,
        },
    });
    const data = await res.json();
    return { data, status: res.status };
}

export async function del (guild, param, value) {
    const res = await fetch(`${keys.YN9_API}${param}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': keys.API_KEY,
            'guild': guild,
        },
        body: JSON.stringify(value),
    });
    const data = await res.json();
    return { data, status: res.status };
}