
let _reactionSocket = null;
let _reactionSocketId = null;
let _reactionRoom = null;
const displayEmoji = (emoji, userId) => {
    const emojiElement = document.createElement('div');
    emojiElement.className = 'floating-emoji';
    emojiElement.innerHTML = `${emoji} - ${userId} reacted`;
    document.body.appendChild(emojiElement);

    // Floating animation (CSS)
    setTimeout(() => {
        emojiElement.classList.add('float-up');
        setTimeout(() => {
            emojiElement.remove();
        }, 2500);
    }, 100);
}

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
    const userInfo = sessionStorage.getItem('user-info') ? JSON.parse(sessionStorage.getItem('user-info')) : null;
    const userName = `${userInfo.doc.firstName} ${userInfo.doc.lastName}` || null;

    const emojiClicked = button.textContent;

    if (!emojiClicked) {
        console.log(emojiClicked, 'nope');
        return;
    }

    const _socket = SetSocket.getSocket();
    const _socketId = SetSocket.getSocketId();
    const _room = SetSocket.getRoom();

    _socket.emit('emojiReaction', ({ room: _room, socketId: _socketId, emojiClicked, user: userName }));

}

document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        emojiReaction(btn);
    })
});
/**
 * Toggles the "raise hand" feature.
 * @param {HTMLButtonElement} button 
 */
const raiseHand = (button) => {
    const isRaised = button.getAttribute('data-raised') === 'true';
    const targetIcon = button.querySelector('i');
    const parentButton = button.querySelector('button');

    const _socket = SetSocket.getSocket();
    const _socketId = SetSocket.getSocketId();
    const _room = SetSocket.getRoom();

    const userInfo = sessionStorage.getItem('user-info') ? JSON.parse(sessionStorage.getItem('user-info')) : null;
    const userName = `${userInfo.doc.firstName}` || null;

    
    if (isRaised) {
        // Hand is currently raised; reset the state
        targetIcon.style.color = 'white';
        const raisedDiv = parentButton.querySelector('.has-hands-raised');
        if (raisedDiv) {
            parentButton.removeChild(raisedDiv);
        }
        button.setAttribute('data-raised', 'false');
        _socket.emit('not_handRaised', ({ room: _room, socketId: _socketId}));
    } else {
        // Hand is not raised; set the state
        targetIcon.style.color = '#ffd000';
        if (!parentButton.querySelector('.has-hands-raised')) {
            const div = document.createElement('div');
            div.className = 'has-hands-raised';
            div.id = `${_socketId}-raised`;
            div.textContent = 'Raised Hand';
            parentButton.appendChild(div);
        }
        button.setAttribute('data-raised', 'true');
        _socket.emit('user-raised-hand', {room: _room, socketId: _socketId, user: userName});
    }
}


document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const _socket = SetSocket.getSocket();
        _socket.on('emojiReaction', (data) => {
            displayEmoji(data.emojiClicked, `${data.user}`);
        });
    },1000);
})