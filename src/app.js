let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let stream = require('./ws/stream');
let path = require('path');
require('dotenv').config();

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/meeting', (req, res) => {
    if (!req.query || Object.keys(req.query).length === 0) {
        return res.status(400).json({ message: 'invalid request format.', validPath: '/meeting?courseId=$&chapter=$' })
    }

    const { courseId, chapter, userId, userType } = req.query;

    try {
        console.log({ courseId, chapter, userId, userType })
        res.status(200).render('index', { courseId, chapter, userId, userType });

    } catch (error) {
        console.log(`Error from /meeting`, error);
        res.status(500).json({ message: 'internal server error' });
    }
})

io.of('/stream').on('connection', stream);

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => console.log(`app is live on port: ${PORT}`));