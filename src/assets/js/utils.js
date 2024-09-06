// const environment_url = 'http://localhost:5050';
const environment_url = 'https://ile-ile.onrender.com';

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
        console.log('Participants data added successfully', response.doc);
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

            const participants = await getParticipants(room);
            document.getElementById('participants-list').innerHTML = "";

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
     })

}

document.addEventListener("DOMContentLoaded", utilsMain);