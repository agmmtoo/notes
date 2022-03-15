// lib
import { default as express } from 'express';
import { default as hbs } from 'hbs';
import * as path from 'path';
// import * as favicon from 'serve-favicon';
import { default as logger } from 'morgan';
import { default as rfs } from 'rotating-file-stream';
import { default as cookieParser } from 'cookie-parser';
import { createServer } from 'http';

// local
import { approotdir } from './approotdir.mjs';
const __dirname = approotdir;
import { normalizePort, onError, onListening, handle404, basicErrorHandler } from './appsupport.mjs';
// router
import { router as indexRouter } from './routes/index.mjs';
import { router as notesRouter } from './routes/notes.mjs';

// Debug
import { default as DBG } from 'debug';
export const debug = DBG('notes:debug');
export const debugerror = DBG('notes:error');

// Notes
import { useModel as useNotesModel } from './models/notes-store.mjs';
useNotesModel(process.env.NOTES_MODEL || "memory")
    .then(store => { debug(`${JSON.stringify(store)} is imported successfully within app.mjs`) })
    .catch(err => { onError({ code: 'ENOTESSTORE', err }); });

export const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'partials'));
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev', {
    stream: process.env.REQUEST_LOG_FILE
        ? rfs.createStream(process.env.REQUEST_LOG_FILE, {
            size: '10M', // rotate every 10 MegaBytes written
            interval: '1d', // rotate daily
            compress: 'gzip' // compress rotated files
        })
        : process.stdout
}));
if (process.env.REQUEST_LOG_FILE) app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// static and libs
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets/vendor/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/assets/vendor/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.use('/assets/vendor/popper.js', express.static(path.join(__dirname, 'node_modules', 'popper.js', 'dist', 'umd')));
app.use('/assets/vendor/feather-icons', express.static(path.join(__dirname, 'node_modules', 'feather-icons', 'dist')));

// router function lists
app.use('/', indexRouter);
app.use('/notes', notesRouter);

// error handlers
// catch 404 and forward to error handler
app.use(handle404);
// other errors
app.use(basicErrorHandler);

// PORT setup
export const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

// server setup
export const server = createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// DEBUG LOG
server.on('request', (req, res) => {
    debug(`${new Date().toISOString()} request ${req.method} ${req.url}`);
});