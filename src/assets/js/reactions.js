// let socket = io();

const toggleEmojiTray = () => {
    const tray = document.getElementById('emoji-tray');
    if (tray.classList.contains('hidden')) {
        tray.classList.remove('hidden');
        tray.classList.add('show');
    } else {
        tray.classList.remove('show');
        tray.classList.add('hidden');
    }
}

const emojiReaction = (button) => {
    const emojiClicked = button.textContent;

    if (!emojiClicked) {
        console.log(emojiClicked, 'nope');
        return;
    }

    const _socket =SetSocket.getSocket();
    const _socketId = SetSocket.getSocketId();
    const _room = SetSocket.getRoom();
    
    _socket.emit('emojiReaction', ({room: _room, socketId: _socketId, emojiClicked}));
    _socket.on('emojiReaction', (emoji) => {
        console.log('received from broadcast, emoji reaction', emoji);
    })
}