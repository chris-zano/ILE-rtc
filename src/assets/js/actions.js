const expandCard = (button) => {
    const presenterView = document.getElementById('presenting-main');
    const videoGrid = document.getElementById('video-grid');
    const userVideoInPresenter = presenterView.querySelector('.user-video');
    const noPresenterText = document.getElementById('no-presenter');
    
    // Determine the target video div that was clicked
    const targetVideoDiv = button.closest('.user-video');

    // Check if the button clicked is within the presenting view
    if (presenterView.contains(targetVideoDiv)) {
        // If the clicked button is in the presenter view, swap the elements
        videoGrid.appendChild(targetVideoDiv);

        // Check if there's no video in the presenter view
        if (!presenterView.querySelector('.user-video')) {
            // Show the 'No one is presenting' message if there's no video
            noPresenterText.style.display = 'flex';
        }
    } else {
        // If the button is not in the presenter view, move the video element to the presenter view
        if (userVideoInPresenter) {
            // Unmount the current video in presenter and move it to the video grid
            presenterView.removeChild(userVideoInPresenter);
            videoGrid.appendChild(userVideoInPresenter);
        }

        // Move the clicked target video to presenter view
        presenterView.appendChild(targetVideoDiv);
        
        // Hide the 'No one is presenting' message since a video is now present
        noPresenterText.style.display = 'none';
    }
};
