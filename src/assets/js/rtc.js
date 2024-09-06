
import h from './helpers.js';

// const environment_url = 'http://localhost:5050';
const environment_url = 'https://ile-ile.onrender.com';

let roomCount = 0

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
try {
    window.addEventListener('load', async () => {
        const onboardingURL = /http:\/\/localhost:8080\/meeting\?courseId=[a-f0-9]{8}[a-f0-9]{16}&chapter=[0-9]+&userId=[a-f0-9]{8}[a-f0-9]{16}&userType=(lecturer|student)/

        const meetingRoomUrl = /http:\/\/localhost:8080\/meeting\?room=[a-f0-9]{8}/;

        if (onboardingURL.test(window.location.href)) {
            let courseRoom = h.getQString(location.href, 'courseId');
            let courseChapter = h.getQString(location.href, 'chapter');
            let usersID = h.getQString(location.href, 'userId');
            let typeOfUser = h.getQString(location.href, 'userType');


            const courseInfo = await getCourseInformation(courseRoom);
            const userInfo = await getUserInfo(usersID, typeOfUser);

            sessionStorage.setItem('course-info', JSON.stringify(courseInfo))
            sessionStorage.setItem('user-info', JSON.stringify(userInfo))
            sessionStorage.setItem('chapter-info', JSON.stringify(courseChapter))

            const roomUrl = `/meeting?room=${courseRoom}`;
            window.location.href = roomUrl;
        }
        else if (meetingRoomUrl.test(window.location.href)) {
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

                socket.emit('subscribe', {
                    room: room,
                    socketId: socketId
                });

                socket.emit('user-joined-sound', {
                    room: room,
                    socketId: socketId
                });

                socket.on('user-left-sound', () => {
                    console.log('a user has left tthe call')
                })

                socket.on('new user', (data) => {
                    socket.emit('newUserStart', { to: data.socketId, sender: socketId });
                    pc.push(data.socketId);
                    init(true, data.socketId);
                });


                socket.on('newUserStart', (data) => {
                    pc.push(data.sender);
                    init(false, data.sender);
                });


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
                        console.log(inputMsg, 2)
                        socket.emit('send-message', { room: room, socketId: socketId, inputMsg, userName });
                    }
                    document.getElementById('msg-preview').setAttribute('aria-hidden', 'true')
                });


            });





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
                    socket.emit('host-end-for-all', (room))
                    await updateCourseMeetingInformation(room, chapterInfo);

                    location.href = coursePageUrl;
                }

                else {
                    const endCallResponse = confirm("Are you sure you want to leave this call?");
                    if (endCallResponse) {
                        return window.location.href = coursePageUrl;

                    }
                }
            });


            function getAndSetUserStream() {
                h.getUserFullMedia().then((stream) => {
                    //save my stream
                    myStream = stream;

                    h.setLocalStream(stream);
                }).catch((e) => {
                    console.error(`stream error: ${e}`);
                });
            }



            function init(createOffer, partnerName) {
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
                        newVid.muted = true; // Optional: mute the video for local playback

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
                        userNameDiv.id = 'my-name';
                        userNameDiv.innerText = `Dr. Phillip Kissembe (me)`; // Example user name

                        overlayDiv.appendChild(userNameDiv);

                        // Append the overlay to the card
                        cardDiv.appendChild(overlayDiv);

                        console.log(roomCount);

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
                    e.target.classList.remove('fa-video');
                    e.target.classList.add('fa-video-slash');
                    elem.setAttribute('title', 'Show Video');

                    myStream.getVideoTracks()[0].enabled = false;
                }

                else {
                    e.target.classList.remove('fa-video-slash');
                    e.target.classList.add('fa-video');
                    elem.setAttribute('title', 'Hide Video');

                    myStream.getVideoTracks()[0].enabled = true;
                }

                broadcastNewTracks(myStream, 'video');
            });


            // //When the mute icon is clicked
            document.getElementById('toggle-mute').addEventListener('click', (e) => {
                e.preventDefault();

                let elem = document.getElementById('toggle-mute');

                if (myStream.getAudioTracks()[0].enabled) {
                    e.target.classList.remove('fa-microphone-alt');
                    e.target.classList.add('fa-microphone-alt-slash');
                    elem.setAttribute('title', 'Unmute');

                    myStream.getAudioTracks()[0].enabled = false;
                }

                else {
                    e.target.classList.remove('fa-microphone-alt-slash');
                    e.target.classList.add('fa-microphone-alt');
                    elem.setAttribute('title', 'Mute');

                    myStream.getAudioTracks()[0].enabled = true;
                }

                broadcastNewTracks(myStream, 'audio');
            });


            // //When user clicks the 'Share screen' button
            document.getElementById('share-screen').addEventListener('click', (e) => {
                e.preventDefault();
                console.log(roomCount)
                if (roomCount === 1) {
                    return window.alert('Cannot start screen-share. No one else in room')
                }

                if (screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended') {
                    stopSharingScreen();
                }

                else {
                    shareScreen();
                }
            });
        }
        else {
            alert('Invalid Meeting URL');
            window.location.href = "http://localhost:5050/login"
        }
    });
} catch (error) {
    console.log(error);
}
