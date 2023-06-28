function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');

    let period = 'AM';
    if (hours >= 12) {
        period = 'PM';
    }
    if (hours > 12) {
        hours = hours - 12;
    }
    if (hours === 0) {
        hours = 12;
    }

    document.getElementById('clock').textContent = `${hours}:${minutes} ${period}`;
}

window.onload = function() {
    updateTime();  // Update the time immediately
    setInterval(updateTime, 1000);  // Update the time every second

    var waitingBox = document.getElementById('waitingBox');
    waitingBox.classList.remove('hidden');  // Show the "waiting" box

    startTracking();  // Start the face tracking
};

function startTracking() {
    var video = document.getElementById('webcam');
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    var tracker = new tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);

    tracking.track('#webcam', tracker, { camera: true });

    tracker.on('track', function(event) {
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (event.data.length > 0) {  // If a face is detected
            onFaceDetected();  // Show the "detected" box and hide the "waiting" box

            event.data.forEach(function(rect) {
                context.strokeStyle = '#a64ceb';
                context.strokeRect(rect.x, rect.y, rect.width, rect.height);
                context.fillStyle = "#fff";
                context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
                context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
            });
        }
    });
}