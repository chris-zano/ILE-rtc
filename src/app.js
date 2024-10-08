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

app.get('/url/main', (req, res) => {
    const url = process.env.MAIN_URL;
    res.status(200).json({url: url});
})

app.get('/url/host', (req, res) => {
    const url = process.env.SERVER_URL;
    res.status(200).json({url: url});
})

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
            socket.to( data.room ).emit( 'new user', { socketId: data.socketId, user: data.user } );
        }
    } );


    socket.on( 'newUserStart', ( data ) => {
        socket.to( data.to ).emit( 'newUserStart', { sender: data.sender, user: data.user } );
    } );


    socket.on( 'sdp', ( data ) => {
        socket.to( data.to ).emit( 'sdp', { description: data.description, sender: data.sender } );
    } );


    socket.on( 'ice candidates', ( data ) => {
        socket.to( data.to ).emit( 'ice candidates', { candidate: data.candidate, sender: data.sender } );
    } );

    socket.on( 'get-username' , (data)=> {
        socket.to(data.to).emit('get_username', {from: data.from, to: data.to})
    });

    socket.on( 'send-username', (data) => {
        socket.to(data.to).emit('send_username', {from: data.from, to: data.to, user: data.user});
        
    })

    socket.on('send-message', (data) => {
        io.to(data.room).emit('receive-message', data.inputMsg, data.userName);
    });

    socket.on('host-end-for-all', (room) => {
        socket.to(room).emit('call-ended-for-all');
    });

    socket.on('emojiReaction', (data) => {
        io.to(data.room).emit('emojiReaction', data);
    });

    socket.on('user-left', (data) => {
        io.to(data.room).emit('user-left-sound', {username: data.user.userName});
    });

    socket.on('user-raised-hand', (data) => {
        io.to(data.room).emit('hand-raised', data);
    })

    socket.on('not_handRaised', (data) => {
        io.to(data.room).emit('lowerHand', data);
    })
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => console.log(`app is live on port: ${PORT}`));