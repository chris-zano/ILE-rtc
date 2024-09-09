
import h from './helpers.js';

// const environment_url = 'http://localhost:5050';
// const environment_url = 'https://b5q2fjr9-5050.uks1.devtunnels.ms/;
const environment_url = 'https://ile-ile.onrender.com';

// const deployed_url = `http://localhost:8080`;
// const deployed_url = `https://b5q2fjr9-8080.uks1.devtunnels.ms/`;
const deployed_url = `https://ile-rtc.onrender.com`;

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
