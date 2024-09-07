# Video Conferencing System

This project is a web-based video conferencing system that supports real-time communication between multiple participants. The system is built using technologies like WebRTC, PeerJS, Socket.io, and Node.js. The front end is designed to handle various user roles such as lecturers and students, facilitating course-related video meetings.

## Table of Contents

- [Features](#features)
- [Setup and Installation](#setup-and-installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [How to Use](#how-to-use)
- [API Endpoints](#api-endpoints)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Real-Time Video Communication:** Supports real-time video and audio communication between participants.
- **Multiple Roles:** Different roles such as lecturer and student are supported, with role-specific functionalities.
- **Session Management:** Manages sessions, including joining and leaving calls, and handles participant data.
- **Messaging:** In-meeting messaging system to allow participants to communicate via text.
- **Screen Sharing:** Participants can share their screens during meetings.
- **Dynamic URL Handling:** Dynamically constructs and handles URLs for course pages and meetings.
- **Session Persistence:** Stores session and user data in `sessionStorage` for easy retrieval during a session.

## Setup and Installation

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- A browser that supports WebRTC (Google Chrome, Mozilla Firefox, etc.)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/chris-zano/ile-rtc.git
   cd ile-rtc
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the root directory and set up the following variables:

   ```bash
   ENVIRONMENT_URL=http://localhost:5050
   DEPLOYED_URL="your deplyment url"
   ```

4. **Start the server:**

   ```bash
   npm start
   ```

5. **Access the application:**

   Open your web browser and navigate to `http://localhost:8080` for the local environment or the deployed URL if running in production.

## Environment Variables

- **ENVIRONMENT_URL:** This is the URL of your local environment or development server.
- **DEPLOYED_URL:** This is the URL of the deployed application.

These URLs are used throughout the application to dynamically construct URLs for API calls and page redirection.

## Project Structure

```plaintext
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
├── src/
│   ├── helpers.js
│   ├── index.js
├── .env
├── package.json
└── README.md
```

- **public/**: Contains static files like CSS, JS, and images.
- **src/**: Contains the main JavaScript files, including helper functions and main logic.
- **.env**: Environment variables configuration.
- **package.json**: Lists dependencies and scripts for the project.

## How to Use

### Joining a Meeting

1. **Lecturer:** Access the platform, select the course, and start the meeting. Invite students by sharing the meeting link.
2. **Student:** Click on the meeting link shared by the lecturer to join the meeting.

### In-Meeting Controls

- **Leave Call:** Click on the "Leave Call" button to exit the meeting.
- **Chat:** Use the chat box to send and receive messages from participants.
- **Screen Sharing:** Click on the screen share icon to start sharing your screen.

### Ending the Call

- **Lecturer:** Click on the "End Call for All" button to terminate the meeting for everyone.
- **Student:** Simply leave the meeting when done.

## API Endpoints

- **GET /render/course/:courseId/:userId:** Renders the course page for the specified course and user.
- **POST /rtc/update-call-info/:courseId/:chapter:** Updates the call information for the specified course and chapter.

## Technologies Used

- **WebRTC:** For real-time communication.
- **Socket.io:** For managing real-time events and messaging.
- **PeerJS:** Simplifies the WebRTC peer-to-peer connection.
- **Node.js:** Backend server.
- **Express:** Web framework for Node.js.
- **HTML/CSS/JavaScript:** Front-end development.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.