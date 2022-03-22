import { Note, AbstractNotesStore } from './Notes.mjs';
import mongodb from 'mongodb';
const MongoClient = mongodb.MongoClient(process.env.MONGO_URL);
import DBG from 'debug';
const debug = DBG('notes:notes-mongodb');
const error = DBG('notes:notes-error');

let client;

const connectDB = async () => {
    if (!client) client = await MongoClient.connect();
}

const db = () => client.db(process.env.MONGODB_NAME);

export default class MongoDBNotesStore extends AbstractNotesStore {
    async close() {
        if (client) client.close();
        client = undefined;
    }

    async update(key, title, body) {
        await connectDB();
        const note = new Note(key, title, body);
        const collection = db().collection('notes');
        await collection.updateOne({ notekey: key }, { $set: { title: title, body: body } });
        return note;
    }

    async create(key, title, body) {
        await connectDB();
        const note = new Note(key, title, body);
        const collection = db().collection('notes');
        await collection.insertOne({ notekey: key, title: title, body: body });
        return note;
    }

    async read(key) {
        await connectDB();
        const collection = db().collection('notes');
        const doc = await collection.findOne({ notekey: key });
        const note = new Note(doc.notekey, doc.title, doc.body);
        return note;
    }

    async destroy(key) {
        await connectDB();
        const collection = db().collection('notes');
        const doc = await collection.findOne({ notekey: key });
        if (!doc) {
            throw new Error(`No note found for ${key}`);
        } else {
            await collection.findOneAndDelete({ notekey: key });
            this.emitDestroyed(key);
        }
    }

    async keylist() {
        await connectDB();
        const collection = db().collection('notes');
        const keyz = await new Promise((resolve, reject) => {
            const keyz = [];
            collection.find({}).forEach(
                note => keyz.push(note.notekey),
                err => err ? reject(err) : resolve(keyz)
            );
        });
        return keyz;
    }

    async count() {
        await connectDB();
        const collection = db().collection('notes');
        const count = await collection.countDocuments({});
        return count;
    }
}
