const callBtns = document.querySelectorAll('.call-btn');
const lifts = document.querySelectorAll('.lift-icon'); 
const arrivalSound = document.getElementById('arrival-sound');
const movingSound = document.getElementById('moving-sound');

const floors = document.querySelectorAll('.floor-bg');
const floorPositions = Array.from(floors).map(floor => floor.getBoundingClientRect().top + window.scrollY);

let liftStates = Array(lifts.length).fill('idle'); 
let liftCurrentPositions = Array.from(lifts).map(lift => lift.getBoundingClientRect().top + window.scrollY);

let waitingQueue = [];
let callCount = Array(callBtns.length).fill(0); // Track how many times each floor button has been called
let lastLiftForFloor = Array(callBtns.length).fill(-1); // Track the last lift dispatched for each floor

setInterval(checkAvailableLifts, 1000);

// Adding click event listeners to call buttons
callBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        // Proceed only if the button is in the 'Call' state
        if (btn.innerHTML === 'Call') {
            btn.classList.add('btn-waiting');
            btn.innerHTML = 'Waiting...'; // Change text to indicate waiting

            const targetY = floorPositions[index];
            callCount[index]++; // Increment the call count for this floor

            const liftIndex = findLiftForFloor(index); // Find the lift based on the current call count

            if (liftIndex !== -1) {
                moveLift(liftIndex, targetY, btn, index);
                lastLiftForFloor[index] = liftIndex; // Update the last lift used for this floor
            } else {
                btn.innerHTML = 'Busy';
                waitingQueue.push({ floorIndex: index, targetY: targetY, btn: btn });
            }
        }
    });
});

// Function to check for available lifts and reassign them to queued floors
function checkAvailableLifts() {
    if (waitingQueue.length > 0) {
        waitingQueue = waitingQueue.filter(request => {
            const { targetY, btn } = request;
            const liftIndex = findLiftForFloor(request.floorIndex);

            if (liftIndex !== -1) {
                btn.innerHTML = 'Waiting...'; 
                moveLift(liftIndex, targetY, btn, request.floorIndex);
                lastLiftForFloor[request.floorIndex] = liftIndex; // Update last lift used
                return false; // Remove from the queue
            }
            return true; // Keep in the queue
        });
    }
}

// Function to find a lift for a given floor based on call count
function findLiftForFloor(floorIndex) {
    const liftCount = lifts.length;
    for (let i = 0; i < liftCount; i++) {
        const liftIndex = (callCount[floorIndex] - 1 + i) % liftCount; // Circularly pick the lift
        // Ensure the lift is idle and not the last one dispatched for this floor
        if (liftStates[liftIndex] === 'idle' && liftIndex !== lastLiftForFloor[floorIndex]) {
            return liftIndex;
        }
    }
    return -1; // No available lifts
}

// Function to move a lift to the target floor
function moveLift(liftIndex, targetY, btn, floorIndex) {
    const lift = lifts[liftIndex]; 
    lift.style.position = 'absolute';
    
    lift.classList.remove('lift-black');
    lift.classList.add('lift-moving'); 

    movingSound.play();

    const currentLiftY = liftCurrentPositions[liftIndex];
    const distance = Math.abs(targetY - currentLiftY);
    const speed = 50; 
    const arrivalTime = (distance / speed) * 1000; 

    lift.style.top = `${currentLiftY}px`;
    lift.style.transition = `top ${arrivalTime / 1000}s ease`;

    // Create a div for the time display
    const timeDisplay = document.createElement('div');
    timeDisplay.classList.add('lift-time-display');
    timeDisplay.style.position = 'absolute'; 
    timeDisplay.style.top = `${targetY}px`; 
    timeDisplay.style.transform = 'translateX(-50%)'; // Center the time display horizontally
    timeDisplay.style.left = `${lift.getBoundingClientRect().left + lift.offsetWidth / 2}px`; // Center below the lift
    lift.parentNode.appendChild(timeDisplay); 

    // Calculate and display arrival time
    const estimatedArrivalTimeInSeconds = (arrivalTime / 1000).toFixed(2); 
    const minutes = Math.floor(estimatedArrivalTimeInSeconds / 60);
    const seconds = Math.floor(estimatedArrivalTimeInSeconds % 60);
    timeDisplay.innerHTML = `${minutes} min ${seconds} sec`; // Display only the time

    setTimeout(() => {
        lift.style.top = `${targetY}px`; 
    }, 0);

    liftCurrentPositions[liftIndex] = targetY;
    liftStates[liftIndex] = 'moving'; 

    setTimeout(() => {
        btn.classList.remove('btn-waiting');
        btn.classList.add('btn-arrived');
        btn.innerHTML = 'Arrived';

        lift.classList.remove('lift-moving'); 
        lift.classList.add('lift-arrived'); 
        arrivalSound.play(); 

        timeDisplay.remove(); // Remove the time display when the lift arrives
    }, arrivalTime);

    // Add a delay of 2 seconds before resetting the button and checking for available lifts
    setTimeout(() => {
        resetButtonAndLift(liftIndex, btn); 
    }, arrivalTime + 1500 + 2000); // Wait 2 seconds (2000 ms) after arriving
}

// Function to reset button and lift states
function resetButtonAndLift(liftIndex, btn) {
    liftStates[liftIndex] = 'idle'; 
    btn.classList.remove('btn-arrived');
    btn.innerHTML = 'Call'; // Reset button text to Call
}

// Initialize the lift positions
window.onload = () => {
    lifts.forEach((lift, index) => {
        lift.style.position = 'absolute';
        lift.style.top = `${floorPositions[floors.length - 1]}px`; // Start all lifts at ground floor
        liftCurrentPositions[index] = floorPositions[floors.length - 1]; // Ground floor
    });
};
