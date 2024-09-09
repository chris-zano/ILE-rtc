
import h from './helpers.js';

const environment_url = 'http://localhost:5050';
// const environment_url = 'https://b5q2fjr9-5050.uks1.devtunnels.ms/;
// const environment_url = 'https://ile-ile.onrender.com';

const deployed_url = `http://localhost:8080`;
// const deployed_url = `https://b5q2fjr9-8080.uks1.devtunnels.ms/`;
// const deployed_url = `https://ile-rtc.onrender.com`;

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
        const onboardingURL = new RegExp(`^${deployed_url}/meeting\\?courseId=[a-f0-9]{8}[a-f0-9]{16}&chapter=[0-9]+&userId=[a-f0-9]{8}[a-f0-9]{16}&userType=(lecturer|student)`);

        const meetingRoomUrl = new RegExp(`^${deployed_url}/meeting\\?room=[a-f0-9]{8}`);

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
            setUpRoom(h)
        }
        else {
            alert('Invalid Meeting URL');
            window.location.href = "https://ile-ile.onrender.com/login"
        }
    });
} catch (error) {
    console.log(error);
}
