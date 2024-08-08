
const addParticipant = async (courseId, participant) => {
    console.log({ courseId, participant })
    const request = await fetch(`http://localhost:5050/rtc/add-participant/${courseId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ participant })
    });

    const status = request.status;
    const response = await request.json();

    if (status === 200) {
        console.log('Participants data added successfully', response.doc);
        return response.doc;
    }

    console.error("an unexpected error occured while adding participant");
    return [];
}

const getParticipants = async (courseId) => {
    const request = await fetch(`http://localhost:5050/rtc/get-participants/${courseId}`);
    const status = request.status;
    const response = await request.json();

    if (status === 200) {
        console.log('Participants data fetched successfully', response.doc);
        return response.doc;
    }
    console.log(`Error`, response)

    console.error('An unexpected error occured while fetching participants');
    return [];
}

const getCourseInformation = async (courseId) => {

    const path = `/rtc/course/info?id=${courseId}`;
    const url = encodeURI(`http://localhost:5050${path}`);

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
    const url = encodeURI(`http://localhost:5050${path}`);

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
        return data;
    }

    console.log(response.status, data);
    return null;
}

const utilsMain = () => {
    const userInfo = sessionStorage.getItem('user-info') ? JSON.parse(sessionStorage.getItem('user-info')) : null;
    const courseInfo = sessionStorage.getItem('course-info') ? JSON.parse(sessionStorage.getItem('course-info')) : null;

    const participantsButton = document.getElementById('get-participants');

    participantsButton.addEventListener('click', async (e) => {
        const collection = document.getElementById("participants-collection");
        collection.innerHTML = ""
        const participantsDiv = document.getElementById('participants-div');

        if (participantsDiv.getAttribute('aria-hidden') === 'false') {
            participantsDiv.setAttribute("aria-hidden", 'true');
            participantsDiv.style.display = 'none'
        }
        else {
            participantsDiv.style.display = 'block';
            participantsDiv.setAttribute("aria-hidden", 'false');

            const courseInfo = sessionStorage.getItem('course-info') ? JSON.parse(localStorage.getItem('course-info')) : null;
            if (courseInfo !== null) {
                let courseId = courseInfo.doc._id;
                const participants = await getParticipants(courseId);

                Array.from(participants).forEach((participant) => {
                    const div = document.createElement('div');

                    if (participant.permissionClass === 'lecturer') {
                        div.classList.add('participant-host');
                        div.innerHTML = `
                            <p class="participant-name">${participant.userName} - <span>Host</span></p>
                            <p class="participant-id">${participant.studenId ? participant.studenId : ""}</p>
                        `;
                    }
                    else {
                        console.log("participant is => ", participant)
                        div.innerHTML = `
                            <p class="participant-name">${participant.userName} - <span>Host</span></p>
                            <p class="participant-id">${participant.studenId ? participant.studenId : ""}</p>
                        `;
                    }


                    collection.appendChild(div)
                });

                document.getElementById('attendance-count').innerText = `${participants.length}`
            }
        }
    })

}

document.addEventListener("DOMContentLoaded", utilsMain);