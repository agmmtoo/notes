// import { default as util } rom 'util';
import express from 'express';
import { io } from '../app.mjs';
import { emitNoteTitles } from './index.mjs';
import { NotesStore as notes } from '../models/notes-store.mjs';
import { postMessage, destroyMessage, recentMessages, emitter as msgEvents } from '../models/messages-sequelize.mjs';

import DBG from 'debug';
const debug = DBG('notes:home');
const error = DBG('notes:error-home');

// authorization
import { ensureAuthenticated } from './users.mjs';

export const router = express.Router();

// Add Note
router.get('/add', ensureAuthenticated, async (req, res, next) => {
    try {
        res.render('noteedit', {
            title: "Add a Note",
            docreate: true,
            notekey: '',
            note: undefined,
            user: req.user
        });
    } catch (e) { next(e); }
});

// Save Note
router.post('/save', ensureAuthenticated, async (req, res, next) => {
    try {
        let note;
        if (req.body.docreate === "create") {
            note = await notes.create(req.body.notekey, req.body.title, req.body.body);
        } else {
            note = await notes.update(req.body.notekey, req.body.title, req.body.body);
        }
        res.redirect('/notes/view?key=' + req.body.notekey);
    } catch (error) {
        next(error);
    }
});

// View Note
router.get('/view', async (req, res, next) => {
    try {
        const note = await notes.read(req.query.key);
        const messages = await recentMessages('/notes', req.query.key);
        res.render('noteview', {
            title: note ? note.title : "",
            notekey: req.query.key,
            user: req.user ? req.user : undefined,
            note,
            messages
        });
    } catch (error) {
        next(error);
    }
});

// Edit Note
router.get('/edit', ensureAuthenticated, async (req, res, next) => {
    try {
        let note = await notes.read(req.query.key);
        res.render('noteedit', {
            title: note ? ("Edit " + note.title) : "Add a Note",
            docreate: false,
            notekey: req.query.key,
            note: note,
            user: req.user
        });
    } catch (error) {
        error(error);
        next(error);
    }
});

// Destroy Note
router.get('/destroy', ensureAuthenticated, async (req, res, next) => {
    try {
        let note = await notes.read(req.query.key);
        res.render('notedestroy', {
            title: note ? `Delete ${note.title}` : "",
            notekey: req.query.key,
            note: note,
            user: req.user
        })
    } catch (error) {
        next(error);
    }
});

router.post('/destroy/confirm', ensureAuthenticated, async (req, res, next) => {
    try {
        await notes.destroy(req.body.notekey);
        res.redirect('/')
    } catch (error) {
        next(error);
    }
});

export function init() {
    io.of('/notes').on('connect', async socket => {
        let notekey = socket.handshake.query.key;
        if (notekey) {
            socket.join(notekey); // join the room
        }

        socket.on('create-message', async (newmsg, fn) => {
            try {
                await postMessage(newmsg.from, newmsg.namespace, newmsg.room, newmsg.message);
                fn('ok');
            } catch (err) {
                error(`Fail to create message ${err.stack}`);
            }
        });

        socket.on('delete-message', async data => {
            try {
                await destroyMessage(data.id);
            } catch (err) {
                error(`Fail to delete message ${err.stack}`);
            }
        });
    });
    notes.on('noteupdated', note => {
        const toemit = {
            key: note.key,
            title: note.title,
            body: note.body
        };
        io.of('/notes').to(note.key).emit('noteupdated', toemit);
        emitNoteTitles();
    });
    notes.on('notedestroyed', key => {
        io.of('/notes').to(key).emit('notedestroyed', key);
        emitNoteTitles();
    });

    // message
    msgEvents.on('newmessage', newmsg => {
        io.of(newmsg.namespace).to(newmsg.room).emit('newmessage', newmsg);
    });
    msgEvents.on('destroymessage', data => {
        io.of(data.namespace).to(data.room).emit('destroymessage', data);
    });
}