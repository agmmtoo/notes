// import { default as util } rom 'util';
import express from 'express';
import { NotesStore as notes } from '../models/notes-store.mjs';

export const router = express.Router();

// Add Note
router.get('/add', async (req, res, next) => {
    res.render('noteedit', {
        title: "Add a Note",
        docreate: true,
        notekey: '',
        note: undefined
    });
});

// Save Note
router.post('/save', async (req, res, next) => {
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
            note: note
        });
    } catch (error) {
        next(error);
    }
});

// Edit Note
router.get('/edit', async (req, res, next) => {
    try {
        let note = await notes.read(req.query.key);
        res.render('noteedit', {
            title: note ? ("Edit " + note.title) : "Add a Note",
            docreate: false,
            notekey: req.query.key,
            note: note
        });
    } catch (error) {
        next(error);
    }
});

// Destroy Note
router.get('/destroy', async (req, res, next) => {
    try {
        let note = await notes.read(req.query.key);
        res.render('notedestroy', {
            title: note ? `Delete ${note.title}` : "",
            notekey: req.query.key,
            note: note
        })
    } catch (error) {
        next(error);
    }
});

router.post('/destroy/confirm', async (req, res, next) => {
    try {
        await notes.destroy(req.body.notekey);
        res.redirect('/')
    } catch (error) {
        next(error);
    }
});