// import { default as util } rom 'util';
import express from 'express';
import { NotesStore as notes } from '../models/notes-store.mjs';

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
        let note = await notes.read(req.query.key);
        res.render('noteview', {
            title: note ? note.title : "",
            notekey: req.query.key,
            note: note,
            user: req.user ? req.user : undefined
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