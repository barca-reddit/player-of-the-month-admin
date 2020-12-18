require('dotenv').config({ path: './process.env' });
const http = require('http');
const mongoose = require('mongoose');
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', { shell: true })
}

const controller = require('./controllers/controller');
const db_init = require('./util/init');

const mongoose_options = {
    autoCreate: true,
    autoIndex: true,
    bufferCommands: true,
    connectTimeoutMS: 60000,
    family: 4,
    heartbeatFrequencyMS: 30000,
    poolSize: 5,
    socketTimeoutMS: 30000,
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ...process.env.NODE_ENV === 'development'
        ? {
            ssl: false,
        }
        : {
            ssl: true,
            retryWrites: true,
            w: 'majority'
        }
}

const connection_string = process.env.NODE_ENV === 'development'
    ? `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@localhost:27017/${process.env.DB_NAME}`
    : `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_ADDRESS}/${process.env.DB_NAME}`;

mongoose.connect(connection_string,
    mongoose_options,
    async (error) => {
        if (error) {
            throw error;
        }
        const db = mongoose.connection;
        await db_init();
        await createServer();

        db.on('error', console.error.bind(console, 'connection error:'));
    }
);

let server;
const PORT = process.env.PORT || 3000;

const createServer = async () => {
    server = http.createServer(async (req, res) => {
        await controller(req, res);
    });

    server.listen(PORT, () => { console.log(`${'-'.repeat(25)}\nServer running on:\nhttp://localhost:${PORT}\n${'-'.repeat(25)}`); })
    server.on('error', () => { console.log(error); });
}