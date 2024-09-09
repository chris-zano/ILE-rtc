class SetSocket {
    static _socket = null;  // Static property to store the socket
    static _socketId = null;
    static _room = null;

    // Static method to set the socket instance
    static setSocket(socket, socketId, room) {
        this._socket = socket;
        this._socketId = socketId;
        this._room = room;
    }

    // Static method to retrieve the socket instance
    static getSocket() {
        if (!this._socket) {
            throw new Error('Cannot get socket because socket is null');
        }
        return this._socket;
    }
    
    // Static method to retrieve the socketId instance
    static getSocketId() {
        if (!this._socketId) {
            throw new Error('Cannot get socketId because socket is null');
        }
        return this._socketId;
    }

    // Static method to retrieve the room instance
    static getRoom() {
        if (!this._room) {
            throw new Error('Cannot get room because socket is null');
        }
        return this._room;
    }

    // Static method to reset or clear the socket instance
    static resetSocket() {
        this._socket = null;
    }
}
