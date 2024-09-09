export default {
    generateRandomString() {
        const crypto = window.crypto || window.msCrypto;
        let array = new Uint32Array(1);

        return crypto.getRandomValues(array);
    },


    closeVideo(elemId) {
        if (document.getElementById(elemId)) {
            document.getElementById(elemId).remove();
        }
    },


    pageHasFocus() {
        return !(document.hidden || document.onfocusout || window.onpagehide || window.onblur);
    },


    getQString(url = '', keyToReturn = '') {
        try {
            url = url ? url : location.href;
            let queryStrings = decodeURIComponent(url).split('#', 2)[0].split('?', 2)[1];

            if (queryStrings) {
                let splittedQStrings = queryStrings.split('&');

                if (splittedQStrings.length) {
                    let queryStringObj = {};

                    splittedQStrings.forEach(function (keyValuePair) {
                        let keyValue = keyValuePair.split('=', 2);

                        if (keyValue.length) {
                            queryStringObj[keyValue[0]] = keyValue[1];
                        }
                    });

                    return keyToReturn ? (queryStringObj[keyToReturn] ? queryStringObj[keyToReturn] : null) : queryStringObj;
                }

                return null;
            }

            return null;
        }
        catch (error) {
            console.error("error getting query strings: ", error)
            return null;
        }
    },


    userMediaAvailable() {
        return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    },


    getUserFullMedia() {
        if (this.userMediaAvailable()) {
            return navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        }

        else {
            throw new Error('User media not available');
        }
    },


    getUserAudio() {
        if (this.userMediaAvailable()) {
            return navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
        }

        else {
            throw new Error('User media not available');
        }
    },



    shareScreen() {
        if (this.userMediaAvailable()) {
            return navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
        }

        else {
            throw new Error('User media not available');
        }
    },


    getIceServer() {
        return {
            iceServers: [
                {
                    urls: ["stun:eu-turn4.xirsys.com"]
                },
                {
                    username: "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl",
                    credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",
                    urls: [
                        "turn:eu-turn4.xirsys.com:80?transport=udp",
                        "turn:eu-turn4.xirsys.com:3478?transport=tcp"
                    ]
                }
            ]
        };
    },

    replaceTrack(stream, recipientPeer) {
        let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find(s => s.track && s.track.kind === stream.kind) : false;

        sender ? sender.replaceTrack(stream) : '';
    },



    toggleShareIcons(share) {
        let shareIconElem = document.querySelector('#share-screen');
    },


    toggleVideoBtnDisabled(disabled) {
        document.getElementById('toggle-video').disabled = disabled;
    },


    maximiseStream(e) {
        let elem = e.target.parentElement.previousElementSibling;

        elem.requestFullscreen() || elem.mozRequestFullScreen() || elem.webkitRequestFullscreen() || elem.msRequestFullscreen();
    },


    singleStreamToggleMute(e) {
        if (e.target.classList.contains('fa-microphone')) {
            e.target.parentElement.previousElementSibling.muted = true;
            e.target.classList.add('fa-microphone-slash');
            e.target.classList.remove('fa-microphone');
        }

        else {
            e.target.parentElement.previousElementSibling.muted = false;
            e.target.classList.add('fa-microphone');
            e.target.classList.remove('fa-microphone-slash');
        }
    },


    saveRecordedStream(stream, user) {
        let blob = new Blob(stream, { type: 'video/webm' });

        let file = new File([blob], `${user}-${moment().unix()}-record.webm`);

        // Create a URL for the blob
        let url = window.URL.createObjectURL(blob);

        // Create a link element
        let a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = file.name;

        // Append the link to the body
        document.body.appendChild(a);
        a.click();

        // Remove the link after downloading
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('File saved:', file);
        console.log(file)
    },


    toggleModal(id, show) {
        let el = document.getElementById(id);

        el.classList.toggle('hidden')
    },



    setLocalStream(stream, mirrorMode = true) {
        const userInfo = sessionStorage.getItem('user-info') ? JSON.parse(sessionStorage.getItem('user-info')) : null;
        const userName = `${userInfo.doc.firstName} ${userInfo.doc.lastName}`|| null;
        const localVidElem = document.getElementById('local');

        document.getElementById('my-name').innerText = `${userName} (me)`;

        localVidElem.srcObject = stream;
        mirrorMode ? localVidElem.classList.add('mirror-mode') : localVidElem.classList.remove('mirror-mode');
    },
};
