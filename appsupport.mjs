import createError from 'http-errors';

import { port, server } from './app.mjs';
import { debug, debugerror } from './app.mjs';

import { NotesStore } from './models/notes-store.mjs';

export function normalizePort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}

export function onError(error) {
    debugerror(error);

    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);

        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);

        case 'ENOTESSTORE':
            console.error(`Notes data store initialization failure because `, error.error);
            process.exit(1);

        default:
            throw (error);
    }
}

export function onListening() {
    const addr = server.address();

    const bind = typeof port === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;

    debug(`Listening on ${bind}`);
}

export function handle404(req, res, next) {
    next(createError(404));
}

export function basicErrorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development'
        ? err
        : {};
    res.status(err.status || 500);
    res.render('error');
}

process.on('uncaughtException', err => console.error(`For I've crashed!!! - ${err.stack || err}`));
import * as util from 'util';
process.on('unhandledRejection', (reason, p) => console.error(`Unhandled rejection at: ${util.inspect(p)} reason: ${util.inspect(reason)}`));

async function catchProcessDeath(signal) {
    debug(`${signal}? urk...`);
    await NotesStore.close();
    await server.close();
    process.exit(0);
}

process.on('SIGTERM', catchProcessDeath);
process.on('SIGINT', catchProcessDeath);
process.on('SIGHUP', catchProcessDeath);
// process.on('SIGKILL', catchProcessDeath);

process.on('exit', () => { debug('exiting...'); });