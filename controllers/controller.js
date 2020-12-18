const fs = require('fs').promises;
const ejs = require('ejs');
const db = require('../routes/db');
const strawpoll = require('../routes/strawpoll');

const router = {
    get: async (file, data = null, res) => {
        const html = await ejs.renderFile(file, data, { async: true });
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    },
    post: async (data, res) => {
        res.writeHead(200, { 'Content-type': 'application/json' });
        res.end(JSON.stringify(data));
    },
    redirect: async (path, res) => {
        res.writeHead(302, { 'Location': path });
        res.end();
    },
    processBody: (req) => {
        return new Promise((resolve, reject) => {
            let json = ''
            req.on('data', function (data) {
                json += data;
            });
            req.on('end', function () {
                resolve(JSON.parse(json));
            });
            req.on('error', (error) => {
                reject(error);
            })
        })
    }
}

const controller = async (req, res) => {
    try {
        // HOME
        if (req.url === '/' && req.method === 'GET') {
            router.redirect('/matches/list', res);
        }

        // MATCHES
        // matches/
        else if (req.url.match(/^\/matches\/?$/i) && req.method === 'GET') {
            router.redirect('/matches/list', res);
        }
        // matches/edit/
        else if (req.url.match(/^\/matches\/edit\/?$/i) && req.method === 'GET') {
            await router.get('views/matches.edit.ejs', null, res);
        }
        // matches/list/
        else if (req.url.match(/^\/matches\/list\/?$/i) && req.method === 'GET') {
            await router.get('views/matches.list.ejs', null, res);
        }
        // ajax/matches/getAll
        else if (req.url.match(/^\/ajax\/matches\/all\/?$/i) && req.method === 'POST') {
            const data = await db.matches.getAll();
            await router.post(data, res);
        }
        // ajax/matches/insert
        else if (req.url.match(/^\/ajax\/matches\/insert\/?$/i) && req.method === 'PUT') {
            const body = await router.processBody(req);
            const data = await db.matches.insert(body);
            await router.post(data, res);
        }
        // ajax/matches/update
        else if (req.url.match(/^\/ajax\/matches\/update\/?$/i) && req.method === 'PATCH') {
            const body = await router.processBody(req);
            const data = await db.matches.update(body);
            await router.post(data, res);
        }
        // ajax/matches/delete
        else if (req.url.match(/^\/ajax\/matches\/delete\/?$/i) && req.method === 'DELETE') {
            const body = await router.processBody(req);
            const data = await db.matches.delete(body);
            await router.post(data, res);
        }

        // PLAYERS
        // /players
        else if (req.url.match(/^\/players\/?$/) && req.method === 'GET') {
            const players = await db.players.getAll();
            await router.get('views/players.ejs', { players }, res);
        }
        // ajax/players/player
        else if (req.url.match(/^\/ajax\/players\/player\/?$/i) && req.method === 'POST') {
            const body = await router.processBody(req);
            const player = await db.players.get(body);
            await router.post(player, res);
        }
        // ajax/players/all
        else if (req.url.match(/^\/ajax\/players\/all\/?$/i) && req.method === 'POST') {
            const players = await db.players.getAll();
            await router.post(players, res);
        }
        // ajax/players/player
        else if (req.url.match(/^\/ajax\/players\/update\/?$/i) && req.method === 'PATCH') {
            const body = await router.processBody(req);
            const player = await db.players.update(body);
            await router.post(player, res);
        }
        // ajax/players/tags
        else if (req.url.match(/^\/ajax\/players\/tags\/?$/i) && req.method === 'PUT') {
            const body = await router.processBody(req);
            const players = await db.players.addTag(body);
            await router.post(players, res);
        }

        // RATINGS
        // ratings
        else if (req.url.match(/^\/ratings\/?$/i) && req.method === 'GET') {
            await router.get('views/ratings.ejs', null, res);
        }
        // ajax/ratings/match
        else if (req.url.match(/^\/ajax\/ratings\/match\/?$/i) && req.method === 'POST') {
            const body = await router.processBody(req);
            const ratings = await db.ratings.get(body);
            await router.post(ratings, res);
        }
        // ajax/ratings/all
        else if (req.url.match(/^\/ajax\/ratings\/all\/?$/i) && req.method === 'POST') {
            const ratings = await db.ratings.getAggregatedAll();
            await router.post(ratings, res);
        }
        // ajax/ratings/dates
        else if (req.url.match(/^\/ajax\/ratings\/dates\/?$/i) && req.method === 'POST') {
            const body = await router.processBody(req);
            const ratings = await db.ratings.getAggregatedbyDates(body);
            await router.post(ratings, res);
        }

        // OTHER
        // /ajax/strawpoll
        else if (req.url.match(/^\/ajax\/strawpoll\/?$/i) && req.method === 'POST') {
            const body = await router.processBody(req);
            const poll = await strawpoll(body.id);
            await router.post(poll, res);
        }

        // STATIC RESOURCES
        else if (req.url.match(/(\.js|\.ejs|\.json|\.css|\.png|\.svg)$/) && req.method === 'GET') {
            const file = await fs.readFile(`${process.cwd()}${req.url}`);
            if (req.url.match(/\.js$/)) { res.writeHeader(200, { 'Content-Type': 'text/javascript' }); }
            else if (req.url.match(/\.ejs$/)) { res.writeHeader(200, { 'Content-Type': 'text/plain' }); }
            else if (req.url.match(/\.json$/)) { res.writeHeader(200, { 'Content-Type': 'application/json' }); }
            else if (req.url.match(/\.css$/)) { res.writeHeader(200, { 'Content-Type': 'text/css' }); }
            else if (req.url.match(/\.png$/)) { res.writeHeader(200, { 'Content-Type': 'image/png' }); }
            else if (req.url.match(/\.svg$/)) { res.writeHeader(200, { 'Content-Type': 'image/svg+xml' }); }
            else { res.writeHead(200, { 'Content-Type': 'application/octet-stream' }); }
            res.end(file);
        }

        // ERROR HANDLER
        else {
            const html = await ejs.renderFile('views/error.ejs', { error: new Error('Route or resource not found.') }, { async: true });
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(html);
        }
    } catch (error) {
        console.log(error);
        if (req.method.toLowerCase() === 'get') {
            const html = await ejs.renderFile('views/error.ejs', { error: error }, { async: true });
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(html);
        }
        else {
            res.writeHead(400, { 'Content-type': 'application/json' });
            res.end(JSON.stringify(error));
        }
    }
}

module.exports = controller;
