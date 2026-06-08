const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const countElement = document.getElementById('count');
const statusElement = document.getElementById('status');

let pushupCount = 0;
let isDown = false;

// Function to reset the counter
function resetCounter() {
    pushupCount = 0;
    isDown = false;
    countElement.innerText = pushupCount;
    statusElement.innerText = "Get in position!";
    statusElement.style.color = "#8A2BE2";
}

// Function to calculate the angle between three points
function calculateAngle(a, b, c) {
    let radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) { angle = 360 - angle; }
    return angle;
}

function onResults(results) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (results.poseLandmarks) {
        // Draw the body landmarks
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#ffffff', lineWidth: 4});
        drawLandmarks(canvasCtx, results.poseLandmarks, {color: '#8A2BE2', lineWidth: 2, radius: 4});

        // Fetch landmarks for the left side of the body
        const shoulder = results.poseLandmarks[11];
        const elbow = results.poseLandmarks[13];
        const wrist = results.poseLandmarks[15];
        const hip = results.poseLandmarks[23];
        const ankle = results.poseLandmarks[27];

        // Calculate angles
        const armAngle = calculateAngle(shoulder, elbow, wrist);
        const bodyAngle = calculateAngle(shoulder, hip, ankle);

        // Check if form is good (straight back)
        let goodForm = bodyAngle > 160;

        if (!goodForm) {
            statusElement.innerText = "Keep your back straight!";
            statusElement.style.color = "red";
        } else {
            // Pushup logic
            if (armAngle > 160) {
                statusElement.innerText = "Ready (Up)";
                statusElement.style.color = "#8A2BE2";
                if (isDown) {
                    pushupCount++;
                    countElement.innerText = pushupCount;
                    isDown = false;
                }
            } else if (armAngle < 90) {
                statusElement.innerText = "Push up! (Down)";
                statusElement.style.color = "#27ae60";
                isDown = true;
            } else {
                statusElement.innerText = "Go deeper...";
                statusElement.style.color = "#e67e22";
            }
        }
    }
    canvasCtx.restore();
}

// Initialize MediaPipe Pose
const pose = new Pose({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});

pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
pose.onResults(onResults);

// Start the camera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({image: videoElement});
    },
    width: 640,
    height: 480
});
camera.start();