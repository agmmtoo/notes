import { default as express } from 'express';
import { NotesStore as notes } from '../models/notes-store.mjs';
export const router = express.Router();

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const keylist = await notes.keylist();
    // console.log(`keylist ${util.inspect(keylist)}`);
    const keyPromises = keylist?.map(key => notes.read(key));
    const notelist = await Promise.all(keyPromises);
    res.render('index', { title: 'Notes', notelist: notelist });
  } catch (err) {
    next(err);
  }
});
