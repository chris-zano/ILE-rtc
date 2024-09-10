// const environment_url = 'http://localhost:5050';
// const environment_url = 'https://b5q2fjr9-5050.uks1.devtunnels.ms/';
const environment_url = 'https://ile-ile.onrender.com';

let roomCount = 0;

const addParticipant = async (courseId, participant) => {
    console.log({ courseId, participant })
    const request = await fetch(`${environment_url}/rtc/add-participant/${courseId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ participant })
    });

    const status = request.status;
    const response = await request.json();

    if (status === 200) {
        return response.doc;
    }

    console.error("an unexpected error occured while adding participant");
    return [];
}

const getParticipants = async (courseId) => {
    const request = await fetch(`${environment_url}/rtc/get-participants/${courseId}`);
    const status = request.status;
    const response = await request.json();

    if (status === 200) {
        console.log('Participants data fetched successfully', response.doc);
        return response.doc;
    }
    console.error('An unexpected error occured while fetching participants');
    return [];
}

const getCourseInformation = async (courseId) => {

    const path = `/rtc/course/info?id=${courseId}`;
    const url = encodeURI(`${environment_url}${path}`);

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
        return data;
    }

    console.log(response.status, data);
    return null;
}

const getUserInfo = async (userId, userType) => {

    const path = `/rtc/user/info?id=${userId}&type=${userType}`;
    const url = encodeURI(`${environment_url}${path}`);

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
        return data;
    }

    console.log(response.status, data);
    return null;
}



const constructCoursePageUrl = (userId, courseId, userType) => {
    const validUserTypes = ["lecturer", "student"];
    if (validUserTypes.indexOf(userType) === -1) return null

    const url = `${environment_url}/${userType}s/render/course/${courseId}/${userId}`;

    return url;
}

const updateCourseMeetingInformation = async (courseId, chapter) => {
    const url = `${environment_url}/rtc/update-call-info/${courseId}/${chapter}`;
    const participants = await getParticipants(courseId);
    const headers = { "Content-Type": "application/json" };

    try {
        const request = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ attendees: participants })
        });

        const response = await request.json();

        if (response.status === 200 && response.message === "Success") {
            return true;
        }

        return false
    } catch (error) {
        console.log(error);
        return null;
    }
}

const formatAMPM = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

const setTime = () => {
    document.getElementById('time').innerText = formatAMPM(new Date) + " | Meeting";
}

const setLocalDateTime = () => {
    setInterval(setTime, 1000);
}

const playJoinSound = () => {
    const audio = document.getElementById('join-sound');
    audio.play();
}

const playLeaveSound = () => {
    const audio = document.getElementById('leave-sound');
    audio.play();
}

const setUpRoom = async (h) => {
    const courseInfo = sessionStorage.getItem('course-info') ? JSON.parse(sessionStorage.getItem('course-info')) : null;
    const userInfo = sessionStorage.getItem('user-info') ? JSON.parse(sessionStorage.getItem('user-info')) : null;
    const chapterInfo = sessionStorage.getItem('chapter-info') ? JSON.parse(sessionStorage.getItem('chapter-info')) : null;

    if (!courseInfo || !userInfo) {
        alert("Cannot validate your credentials. redirecting to login");
        // return window.location.href = 'https://ile-ile.onrender.com/login';
        return window.location.href = `${environment_url}/login`;
    }

    const room = courseInfo.doc._id;
    const _userType = userInfo.doc.type;
    const userName = `${userInfo.doc.firstName} ${userInfo.doc.lastName}` || null;

    const participantInformation = {
        userName: userName,
        uid: userInfo.doc._id,
        permissionClass: _userType,
        studentId: _userType === 'student' ? userInfo.doc.studentId : null,
        profilePicUrl: userInfo.doc.profilePicUrl
    }

    roomCount = Array.from(await addParticipant(room, participantInformation)).length;

    let commElem = document.getElementsByClassName('room-comm');

    for (let i = 0; i < commElem.length; i++) {
        commElem[i].attributes.removeNamedItem('hidden');
    }

    var pc = [];
    let socket = io();
    var socketId = '';
    var myStream = '';
    var screen = '';
    var recordedStream = [];
    var mediaRecorder = '';

    //Get user video by default
    getAndSetUserStream();


    socket.on('connect', () => {

        //set socketId
        socketId = socket.io.engine.id;

        //store socket locally
        SetSocket.setSocket(socket, socketId, room);

        socket.emit('subscribe', {
            room: room,
            socketId: socketId
        });

        socket.emit('user-joined-sound', {
            room: room,
            socketId: socketId,
            user: participantInformation
        });

        socket.on('user-left-sound', () => {
            console.log('a user has left the call')
        })

        socket.on('new user', (data) => {
            socket.emit('newUserStart', { to: data.socketId, sender: socketId, user: participantInformation });
            //play new user joined.
            playJoinSound();

            pc.push(data.socketId);
            init(true, data.socketId, data.user);
            socket.emit('get-username', {from: socketId, to: data.socketId})
        });


        socket.on('newUserStart', (data) => {
            pc.push(data.sender);
            init(false, data.sender, data.user);
            socket.emit('get-username', {from: socketId, to: data.sender})
        });

        socket.on('get_username', (data) => {
            socket.emit('send-username', {from: socketId, to: data.from, user: participantInformation})
        })

        socket.on('send_username', (data) => {
            addUserName(data.from, data.user.userName)
        })


        socket.on('ice candidates', async (data) => {
            data.candidate ? await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
        });


        socket.on('sdp', async (data) => {
            if (data.description.type === 'offer') {
                data.description ? await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

                h.getUserFullMedia().then(async (stream) => {
                    if (!document.getElementById('local').srcObject) {
                        h.setLocalStream(stream);
                    }

                    //save my stream
                    myStream = stream;


                    stream.getTracks().forEach((track) => {
                        pc[data.sender].addTrack(track, stream);
                    });

                    let answer = await pc[data.sender].createAnswer();

                    await pc[data.sender].setLocalDescription(answer);

                    socket.emit('sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId });
                }).catch((e) => {
                    console.error(e);
                });
            }

            else if (data.description.type === 'answer') {
                await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
            }
        });

        socket.on('call-ended-for-all', () => {
            alert('call ended by host')
            const coursePageUrl = constructCoursePageUrl(participantInformation.uid, room, participantInformation.permissionClass);
            location.href = coursePageUrl;
        });

        socket.on('user-left-sound', (data) => {
            console.log(data);
            playLeaveSound();
        });

        socket.on('lowerHand', (data) => {
            const raised_target = document.getElementById(`${data.socketId}-wave`);

            if (raised_target) {
                raised_target.parentElement.removeChild(raised_target)
            }
        });

        socket.on('hand-raised', (data) => {
            const {user, socketId} = data;

            const waver = document.createElement('div');
            waver.className = 'hand-raised-user';
            waver.id = `${socketId}-wave`;
            waver.innerHTML =`
                <i class="fa fa-hand-paper waving-hand"></i>
                <span class="user-name">${user}</span>
            `;
            document.getElementById('hand-raised-stack').append(waver);
        })

        socket.on('receive-message', (inputMsg, userName) => {
            console.log('message received from server', { userName, inputMsg })
            inputMsg = urlify(inputMsg);
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="sender">${userName}</span>
                <p class="message">${inputMsg}</p>
                <span class="date-time">&nbsp;${formatAMPM(new Date)}</span>
            `;
            document.getElementById('chat-list').append(li);
        });

        document.getElementById('form').addEventListener('submit', (e) => {
            e.preventDefault();
            let inputMsg = document.getElementById('msg-input').value;
            console.log(inputMsg, 1)
            if (inputMsg != '') {
                socket.emit('send-message', { room: room, socketId: socketId, inputMsg, userName });
            }
            document.getElementById('msg-input').value = ""
        });


    });

    function addUserName(senderId, username) {
        console.log(senderId + "-name")
        setTimeout(() => {
            const participant = document.getElementById(`${senderId}-name`);
            participant.textContent = username;
        },2000);
    }

    function urlify(text) {
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, function (url) {
            return '<a href="' + url + '">' + url + '</a>';
        })
    }

    const leaveButton = document.getElementById('leave-call');

    leaveButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const coursePageUrl = constructCoursePageUrl(participantInformation.uid, room, participantInformation.permissionClass);

        if (participantInformation.permissionClass === 'lecturer') {
            alert('ending call for all particpants')
            socket.emit('host-end-for-all', (room));
            updateCourseMeetingInformation(room, chapterInfo)
            .then(()=> {
                return;
            })
            .catch(error => {
                console.log(error);
            });

            location.href = coursePageUrl;
        }

        else {
            const endCallResponse = confirm("Are you sure you want to leave this call?");
            if (endCallResponse) {
                socket.emit('user-left', { room: room, socketId: socketId, user: participantInformation })
                return window.location.href = coursePageUrl;

            }
        }
    });


    function getAndSetUserStream() {
        h.getUserFullMedia().then((stream) => {
            //save my stream
            myStream = stream;

            setTimeout(() => {
                h.setLocalStream(stream);
            }, 2000);
        }).catch((e) => {
            console.error(`stream error: ${e}`);
        });
    }



    function init(createOffer, partnerName, user) {
        pc[partnerName] = new RTCPeerConnection(h.getIceServer());

        if (screen && screen.getTracks().length) {
            screen.getTracks().forEach((track) => {
                pc[partnerName].addTrack(track, screen);//should trigger negotiationneeded event
            });
        }

        else if (myStream) {
            myStream.getTracks().forEach((track) => {
                pc[partnerName].addTrack(track, myStream);//should trigger negotiationneeded event
            });
        }

        else {
            h.getUserFullMedia().then((stream) => {
                //save my stream
                myStream = stream;

                stream.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, stream);//should trigger negotiationneeded event
                });

                h.setLocalStream(stream);
            }).catch((e) => {
                console.error(`stream error: ${e}`);
            });
        }



        //create offer
        if (createOffer) {
            pc[partnerName].onnegotiationneeded = async () => {
                let offer = await pc[partnerName].createOffer();

                await pc[partnerName].setLocalDescription(offer);

                socket.emit('sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId });
            };
        }

        //send ice candidate to partnerNames
        pc[partnerName].onicecandidate = ({ candidate }) => {
            socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: socketId });
        };



        //add
        pc[partnerName].ontrack = async (e) => {
            let str = e.streams[0];
            if (document.getElementById(`${partnerName}-video`)) {
                document.getElementById(`${partnerName}-video`).srcObject = str;
            }

            else {
                const videoGrid = document.getElementById('video-grid');

                // Create a new video element
                let newVid = document.createElement('video');
                newVid.id = `${partnerName}-video`;
                newVid.srcObject = str;
                newVid.autoplay = true;
                newVid.muted = false;

                // Create a new div for the card
                let cardDiv = document.createElement('div');
                cardDiv.className = 'user-video';
                cardDiv.id = partnerName;
                cardDiv.appendChild(newVid);

                // Create the overlay controls div
                let overlayDiv = document.createElement('div');
                overlayDiv.className = 'video-overlay-controls';
                overlayDiv.onclick = () => expandCard(overlayDiv);

                // Add the user's name to the overlay
                let userNameDiv = document.createElement('div');
                userNameDiv.className = 'user-name';
                userNameDiv.id = `${partnerName}-name`;
                userNameDiv.innerText = ``; // Example user name

                overlayDiv.appendChild(userNameDiv);

                // Append the overlay to the card
                cardDiv.appendChild(overlayDiv);


                // Apply classes based on the number of callers
                if (roomCount === 2) {
                    videoGrid.classList.add('two-callers');
                } else {
                    videoGrid.classList.add('one-caller');
                }

                // Add the card to the video grid
                videoGrid.appendChild(cardDiv);

            }
        };



        pc[partnerName].onconnectionstatechange = (d) => {
            switch (pc[partnerName].iceConnectionState) {
                case 'disconnected':
                case 'failed':
                    h.closeVideo(partnerName);
                    break;

                case 'closed':
                    h.closeVideo(partnerName);
                    break;
            }
        };



        pc[partnerName].onsignalingstatechange = (d) => {
            switch (pc[partnerName].signalingState) {
                case 'closed':
                    console.log("Signalling state is 'closed'");
                    h.closeVideo(partnerName);
                    break;
            }
        };
    }



    function shareScreen() {
        h.shareScreen().then((stream) => {
            h.toggleShareIcons(true);

            //disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
            //It will be enabled was user stopped sharing screen
            h.toggleVideoBtnDisabled(true);

            //save my screen stream
            screen = stream;

            //share the new stream with all partners
            broadcastNewTracks(stream, 'video', false);
            
            document.getElementById('share-screen').style.backgroundColor = '#137ee8'

            //When the stop sharing button shown by the browser is clicked
            screen.getVideoTracks()[0].addEventListener('ended', () => {
                stopSharingScreen();
            });
        }).catch((e) => {
            console.error(e);
        });
    }



    function stopSharingScreen() {
        //enable video toggle btn
        h.toggleVideoBtnDisabled(false);

        return new Promise((res, rej) => {
            screen.getTracks().length ? screen.getTracks().forEach(track => track.stop()) : '';

            res();
        }).then(() => {
            h.toggleShareIcons(false);
            broadcastNewTracks(myStream, 'video');
            document.getElementById('share-screen').style.backgroundColor = '#434649'
        }).catch((e) => {
            console.error(e);
        });
    }



    function broadcastNewTracks(stream, type, mirrorMode = true) {
        h.setLocalStream(stream, mirrorMode);

        let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

        for (let p in pc) {
            let pName = pc[p];

            if (typeof pc[pName] == 'object') {
                h.replaceTrack(track, pc[pName]);
            }
        }
    }


    // //When the video icon is clicked
    document.getElementById('toggle-video').addEventListener('click', (e) => {
        e.preventDefault();

        let elem = document.getElementById('toggle-video');

        if (myStream.getVideoTracks()[0].enabled) {
            document.getElementById("lbl-vid").parentElement.parentElement.classList.add('cancelled');

            myStream.getVideoTracks()[0].enabled = false;
        }

        else {
            document.getElementById("lbl-vid").parentElement.parentElement.classList.remove('cancelled');

            myStream.getVideoTracks()[0].enabled = true;
        }

        broadcastNewTracks(myStream, 'video');
    });


    // //When the mute icon is clicked
    document.getElementById('toggle-mute').addEventListener('click', (e) => {
        e.preventDefault();

        let elem = document.getElementById('toggle-mute');

        if (myStream.getAudioTracks()[0].enabled) {
            document.getElementById("lbl-mic").parentElement.parentElement.classList.add('cancelled');

            myStream.getAudioTracks()[0].enabled = false;
        }

        else {
            document.getElementById("lbl-mic").parentElement.parentElement.classList.remove('cancelled');

            myStream.getAudioTracks()[0].enabled = true;
        }

        broadcastNewTracks(myStream, 'audio');
    });


    // //When user clicks the 'Share screen' button
    document.getElementById('share-screen').addEventListener('click', (e) => {
        e.preventDefault();
        console.log(roomCount)

        if (screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended') {
            stopSharingScreen();
            document.getElementById('share-screen').setAttribute('title', 'Share Screen');
            document.getElementById('share-screen').style.backgroundColor = 'inherit'
        }
        
        else {
            shareScreen();
            document.getElementById('share-screen').setAttribute('title', 'Stop Sharing');
            
        }
    });
}

const utilsMain = () => {
    setLocalDateTime();
    const userInfo = sessionStorage.getItem('user-info') ? JSON.parse(sessionStorage.getItem('user-info')) : null;
    const courseInfo = sessionStorage.getItem('course-info') ? JSON.parse(sessionStorage.getItem('course-info')) : null;
    const room = courseInfo.doc._id;

    const participantsBtn = document.getElementById("get-participants");
    participantsBtn.addEventListener("click", async () => {

        const articleAtt = document.getElementById("article-attendance");
        if (articleAtt.getAttribute("aria-hidden") === "true") {
            document.getElementById("popups").setAttribute("aria-hidden", "false");
            articleAtt.setAttribute("aria-hidden", "false");
            const loader = new LoadingSpinner(articleAtt);
            loader.show();

            const participants = await getParticipants(room);
            document.getElementById('participants-list').innerHTML = "";

            document.getElementById('participants-count').innerText = participants ? participants.length : 0;

            participants.forEach((participant) => {
                const li = document.createElement("li");
                if (participant.permissionClass === 'lecturer') {
                    li.innerHTML = `
                        <img src="${environment_url}${participant.profilePicUrl}" alt="pp" width="30px" height="30px" style="object-fit: cover; border-radius: 50%;">
                        <p>${participant.userName}(Host)</p>
                  `;
                }

                else if (participant.permissionClass === 'student') {
                    li.innerHTML = `
                        <img src="${environment_url}${participant.profilePicUrl}" alt="pp" width="30px" height="30px" style="object-fit: cover; border-radius: 50%;">
                        <p>${participant.userName}<br>${participant.studentId}</p>
                    `;
                }
                else {
                    return;
                }
                document.getElementById('participants-list').append(li);
            });

            loader.hide();

        }
        else {
            document.getElementById("popups").setAttribute("aria-hidden", "true")
            articleAtt.setAttribute("aria-hidden", "true")
        }

    });

    //toggle chats open close
    const chatsDiv = document.getElementById("chats");
    const chatsBtn = document.getElementById("chat-box-btn");
    chatsBtn.addEventListener('click', () => {
        if (chatsDiv.getAttribute("aria-hidden") === "true") {
            document.getElementById("popups").setAttribute("aria-hidden", "false")
            chatsDiv.setAttribute('aria-hidden', "false");
        }
        else {
            chatsDiv.setAttribute('aria-hidden', 'true');
            document.getElementById("popups").setAttribute("aria-hidden", "true");
        }
    });

    const whiteBoardBtn = document.getElementById('whiteboard-control');
    whiteBoardBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const a = document.createElement('a');
        a.href = 'https://excalidraw.com/';
        a.target = "_blank";
        a.style.display = 'none';
        document.getElementById('rtc-room-main').append(a);
        return a.click();
    })

}

document.addEventListener("DOMContentLoaded", utilsMain);