let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
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
        res.status(200).render('index', { courseId, chapter, userId, userType });

    } catch (error) {
        console.log(`Error from /meeting`, error);
        res.status(500).json({ message: 'internal server error' });
    }
})


io.on('connection', (socket) => {
    socket.on( 'subscribe', ( data ) => {
        //subscribe/join a room
        socket.join( data.room );
        socket.join( data.socketId );

        //Inform other members in the room of new user's arrival
        if ( socket.adapter.rooms.has(data.room) === true ) {
            socket.to( data.room ).emit( 'new user', { socketId: data.socketId } );
        }
    } );


    socket.on( 'newUserStart', ( data ) => {
        socket.to( data.to ).emit( 'newUserStart', { sender: data.sender } );
    } );


    socket.on( 'sdp', ( data ) => {
        socket.to( data.to ).emit( 'sdp', { description: data.description, sender: data.sender } );
    } );


    socket.on( 'ice candidates', ( data ) => {
        socket.to( data.to ).emit( 'ice candidates', { candidate: data.candidate, sender: data.sender } );
    } );

    socket.on('send-message', (data) => {
        io.to(data.room).emit('receive-message', data.inputMsg, data.userName);
    });

    socket.on('host-end-for-all', (room) => {
        socket.to(room).emit('call-ended-for-all');
    })
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => console.log(`app is live on port: ${PORT}`));