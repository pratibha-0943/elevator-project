const callBtns = document.querySelectorAll('.call-btn');
const lifts = document.querySelectorAll('.lift-icon'); 
const arrivalSound = document.getElementById('arrival-sound');
const movingSound = document.getElementById('moving-sound');

const floors = document.querySelectorAll('.floor-bg');
const floorPositions = Array.from(floors).map(floor => floor.getBoundingClientRect().top + window.scrollY);

let liftStates = Array(lifts.length).fill('idle'); 
let liftCurrentPositions = Array.from(lifts).map(lift => lift.getBoundingClientRect().top + window.scrollY);

let waitingQueue = [];

setInterval(checkAvailableLifts, 1000);

callBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        console.log(`Button clicked: ${btn.innerHTML}`); // Debugging log
        
        // Prevent action if the button indicates "Arrived" or is in the "waiting" state
        if (btn.innerHTML === 'Arrived' || btn.innerHTML === 'waiting') {
            console.log('Button is in a waiting or arrived state. No action taken.');
            return; // Do nothing if the lift has arrived or is currently waiting
        }

        // Proceed if the button is in the "call" state
        if (btn.innerHTML === 'call') {
            btn.classList.add('btn-waiting');
            btn.innerHTML = 'waiting';
            console.log('Lift is being called.');

            const targetY = floorPositions[index];
            const nearestLiftIndex = findNearestAvailableLift(targetY);

            if (nearestLiftIndex !== -1) {
                moveLift(nearestLiftIndex, targetY, btn);
            } else {
                btn.innerHTML = 'busy';
                waitingQueue.push({ floorIndex: index, targetY: targetY, btn: btn });
                console.log('No lifts available. Added to waiting queue.');
            }
        }
    });
});

// Function to check for available lifts and reassign them to queued floors
function checkAvailableLifts() {
    if (waitingQueue.length > 0) {
        waitingQueue = waitingQueue.filter(request => {
            const { targetY, btn } = request;
            const nearestLiftIndex = findNearestAvailableLift(targetY);

            if (nearestLiftIndex !== -1) {
                btn.innerHTML = 'waiting'; 
                moveLift(nearestLiftIndex, targetY, btn);
                return false;
            }
            return true; 
        });
    }
}

// Function to find the nearest available (idle) lift
function findNearestAvailableLift(targetY) {
    let nearestLiftIndex = -1;
    let shortestDistance = Infinity;

    liftCurrentPositions.forEach((liftY, index) => {
        if (liftStates[index] === 'idle') {
            const distance = Math.abs(targetY - liftY);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestLiftIndex = index;
            }
        }
    });

    return nearestLiftIndex;
}

// Function to move a lift to the target floor
function moveLift(liftIndex, targetY, btn) {
    const lift = lifts[liftIndex]; 
    lift.style.position = 'absolute';

    lift.classList.remove('lift-black');
    lift.classList.add('lift-moving'); 

    movingSound.play();

    const currentLiftY = liftCurrentPositions[liftIndex];
    const distance = Math.abs(targetY - currentLiftY);
    const speed = 40; 
    const arrivalTime = (distance / speed) * 1000; 

    lift.style.top = `${currentLiftY}px`;
    lift.style.transition = `top ${arrivalTime / 1000}s ease`;

    // Display arrival time immediately
    const estimatedArrivalTimeInSeconds = (arrivalTime / 1000).toFixed(2); 
    const minutes = Math.floor(estimatedArrivalTimeInSeconds / 60);
    const seconds = Math.floor(estimatedArrivalTimeInSeconds % 60);
    const timeDisplay = document.createElement('div');
    timeDisplay.classList.add('lift-time-display');
    timeDisplay.style.position = 'absolute'; 
    timeDisplay.style.visibility = 'visible'; 
    timeDisplay.style.top = `${targetY}px`; 
    timeDisplay.style.left = `${lift.getBoundingClientRect().right + 10}px`; 
    timeDisplay.innerHTML = `${minutes} min ${seconds} sec`; 
    lift.parentNode.appendChild(timeDisplay); 

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

        timeDisplay.remove();
    }, arrivalTime);

    setTimeout(() => {
        resetButtonAndLift(liftIndex, btn); 
    }, arrivalTime + 1500); 
}

// Function to reset button and lift after reaching the target floor
function resetButtonAndLift(liftIndex, btn) {
    btn.classList.remove('btn-arrived');
    btn.classList.add('btn-call');
    btn.innerHTML = 'call';
    btn.disabled = false;  

    const lift = lifts[liftIndex];
    lift.classList.remove('lift-arrived');
    lift.classList.add('lift-black'); 
    liftStates[liftIndex] = 'idle'; 

    // After the lift becomes idle, check the waiting queue again
    checkAvailableLifts();
}
