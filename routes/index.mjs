import { default as express } from 'express';
import { io } from '../app.mjs';
import { NotesStore as notes } from '../models/notes-store.mjs';
export const router = express.Router();

import DBG from 'debug';
const debug = DBG('notes:routes-index');

/* GET home page. */
router.get('/', async (req, res, next) => {
    try {
        const notelist = await getKeyTitlesList();
        res.render('index', { title: 'Notes', notelist: notelist, user: req.user ? req.user : undefined });
    } catch (err) {
        next(err);
    }
});

async function getKeyTitlesList() {
    const keylist = await notes.keylist();
    const keyPromises = keylist.map(key => notes.read(key));
    const notelist = await Promise.all(keyPromises);
    return notelist.map(note => { return { key: note.key, title: note.title }; })
    // providing the array of Note objects to Socket.IO resulted in an array
    // of empty objects being sent to the browser while sending the anonymous objects
    // worked correctly
}

export const emitNoteTitles = async () => {
    const notelist = await getKeyTitlesList();
    io.of('/home').emit('notetitles', { notelist }); // wrapped by {}, meaning 'notelist' is in another obj
}

export function init() {
    io.of('/home').on('connect', socket => {
        debug('socketio connection on /home (namespace?)');
    });

    // each event give certain args, why don't use?
    notes.on('notecreated', emitNoteTitles);
    notes.on('noteupdated', emitNoteTitles);
    notes.on('notedestroyed', emitNoteTitles);
}