import { MongoClient, ServerApiVersion } from 'mongodb';

const client = new MongoClient(process.env.DB_URI);
let conn;

// Connect to MongoDB
client.connect().then((connection) => {
    conn = connection;
    console.log('Connected to MongoDB');
});

const db = client.db('mastermind').collection('games');

export default db;