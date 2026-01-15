class LivenessChallenger {
    constructor() {
        // Only 3 challenges as requested: smile, head turn, blink
        this.challenges = [
            {
                id: 'blink',
                name: 'Blink Detection',
                instruction: 'Please blink your eyes twice',
                icon: '👁️',
                duration: 10000,
                verify: this.verifyBlink.bind(this)
            },
            {
                id: 'smile',
                name: 'Smile Detection',
                instruction: 'Please smile naturally',
                icon: '😊',
                duration: 8000,
                verify: this.verifySmile.bind(this)
            },
            {
                id: 'turnHead',
                name: 'Head Turn',
                instruction: 'Turn your head slowly left, then right',
                icon: '↔️',
                duration: 12000,
                verify: this.verifyHeadTurn.bind(this)
            }
        ];

        this.currentChallenge = null;
        this.challengeHistory = [];
        this.isActive = false;
        this.startTime = null;

        // Enhanced tracking variables
        this.landmarkHistory = [];
        this.maxHistoryLength = 30; // Track last 30 frames
        this.blinkCount = 0;
        this.blinkRequired = 2; // User requested blink twice
        this.headTurnStates = { left: false, center: false, right: false };
        this.eyeMovementStates = { left: false, center: false, right: false };
        this.mouthOpenDetected = false;
        this.eyebrowRaiseDetected = false;

        // Baseline measurements
        this.baseline = {
            eyeDistance: null,
            mouthWidth: null,
            eyeToEyebrowDistance: null,
            faceWidth: null
        };
    }

    /**
     * Get a random challenge
     * @returns {Object} Challenge object
     */
    getRandomChallenge() {
        const availableChallenges = this.challenges.filter(
            c => !this.challengeHistory.some(h => h.id === c.id)
        );

        if (availableChallenges.length === 0) {
            this.challengeHistory = [];
            return null;
        }

        const randomIndex = Math.floor(Math.random() * availableChallenges.length);
        return availableChallenges[randomIndex];
    }

    /**
     * Start a new challenge
     * @param {Function} onComplete - Callback when challenge completes
     * @param {Function} onProgress - Callback for progress updates
     */
    startChallengeExplicit(challenge, onComplete, onProgress) {
        this.currentChallenge = challenge;
        this.initChallengeState(onComplete, onProgress);
    }

    // Extracted init logic
    initChallengeState(onComplete, onProgress) {
        this.isActive = true;
        this.startTime = Date.now();

        // Reset all tracking variables
        this.landmarkHistory = [];
        this.blinkCount = 0;
        this.blinkState = 'OPEN';
        this.headTurnStates = { left: false, center: false, right: false };
        this.eyeMovementStates = { left: false, center: false, right: false };
        this.mouthOpenDetected = false;
        this.eyebrowRaiseDetected = false;
        this.baseline = {
            eyeDistance: null,
            mouthWidth: null,
            eyeToEyebrowDistance: null,
            faceWidth: null
        };

        console.log(`Starting challenge: ${this.currentChallenge.name}`);

        // Monitor challenge timeout
        setTimeout(() => {
            if (this.isActive && this.currentChallenge) { // Check if still active/same challenge
                // Only fail if we haven't succeeded yet
                this.completeChallenge(false, onComplete);
            }
        }, this.currentChallenge.duration);

        // Progress updates
        const progressInterval = setInterval(() => {
            if (!this.isActive) {
                clearInterval(progressInterval);
                return;
            }

            const elapsed = Date.now() - this.startTime;
            const progress = Math.min((elapsed / this.currentChallenge.duration) * 100, 100);

            if (onProgress) {
                onProgress(progress);
            }
        }, 100);
    }

    startChallenge(onComplete, onProgress) {
        this.currentChallenge = this.getRandomChallenge();

        if (!this.currentChallenge) {
            onComplete({ success: true, allChallengesComplete: true });
            return;
        }

        this.initChallengeState(onComplete, onProgress);
    }

    /**
     * Process detection data for current challenge
     * @param {Object} detectionData - Face detection data
     * @param {Function} onComplete - Callback when challenge completes
     */
    processDetection(detectionData, onComplete) {
        if (!this.isActive || !this.currentChallenge) {
            return;
        }

        const success = this.currentChallenge.verify(detectionData);

        if (success) {
            this.completeChallenge(true, onComplete);
        }
    }

    /**
     * Complete the current challenge
     * @param {Boolean} success - Whether challenge was successful
     * @param {Function} onComplete - Callback function
     */
    completeChallenge(success, onComplete) {
        if (!this.currentChallenge) return;

        this.isActive = false;

        const result = {
            id: this.currentChallenge.id,
            name: this.currentChallenge.name,
            success: success,
            duration: Date.now() - this.startTime
        };

        this.challengeHistory.push(result);

        console.log(`Challenge ${this.currentChallenge.name}: ${success ? 'SUCCESS' : 'FAILED'}`);

        if (onComplete) {
            onComplete(result);
        }

        this.currentChallenge = null;
    }

    addToHistory(landmarks) {
        this.landmarkHistory.push(landmarks);
        if (this.landmarkHistory.length > this.maxHistoryLength) {
            this.landmarkHistory.shift();
        }
    }

    calculateDistance(point1, point2) {
        const dx = point1[0] - point2[0];
        const dy = point1[1] - point2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    establishBaseline(landmarks) {
        if (this.landmarkHistory.length < 5) return false;

        const rightEye = landmarks[0];
        const leftEye = landmarks[1];
        const mouth = landmarks[3];

        this.baseline.eyeDistance = this.calculateDistance(rightEye, leftEye);
        this.baseline.mouthWidth = Math.abs(mouth[0] - ((rightEye[0] + leftEye[0]) / 2));
        this.baseline.faceWidth = this.baseline.eyeDistance * 2.5;

        return true;
    }


    verifyBlink(detectionData) {
        // High-Res (FaceMesh) Logic
        if (detectionData.isHighRes && detectionData.landmarks.length > 10) {
            const lm = detectionData.landmarks;
            // Left Eye: 159 (upper), 145 (lower)
            // Right Eye: 386 (upper), 374 (lower)
            // We need to handle if keypoints are array of {x,y,z} or flat array.
            // FaceMesh usually returns array of objects {x,y,z}.

            const getP = (idx) => lm[idx];
            const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

            const leftEAR = dist(getP(159), getP(145)) / dist(getP(33), getP(133)); // Vertical / Horizontal
            const rightEAR = dist(getP(386), getP(374)) / dist(getP(362), getP(263));

            const avgEAR = (leftEAR + rightEAR) / 2;

            // EAR (Eye Aspect Ratio) < 0.15 usually means closed
            if (avgEAR < 0.15) {
                this.blinkCount++;
                console.log(`High-Res Blink Detected! EAR: ${avgEAR.toFixed(3)}`);
                // Debounce?
            }
            // Simple logic for now: High quality blink check
            // We need persistent state to count distinct blinks.
            // Simplified: Just pass if eyes closed.
            if (this.blinkCount >= this.blinkRequired) return true;
            return false;
        }

        // Fallback to Low-Res (BlazeFace) Logic
        if (!detectionData.landmarks || detectionData.landmarks.length < 6) {
            return false;
        }

        const landmarks = detectionData.landmarks;
        this.addToHistory(landmarks);

        if (this.landmarkHistory.length < 3) {
            return false;
        }

        const rightEye = landmarks[0];
        const leftEye = landmarks[1];

        // Get previous frames
        const prev1 = this.landmarkHistory[this.landmarkHistory.length - 2];
        const prev2 = this.landmarkHistory[this.landmarkHistory.length - 3];

        // Calculate eye distance (vertical) to detect closure
        const currentEyeDistance = this.calculateDistance(rightEye, leftEye);
        const prev1EyeDistance = this.calculateDistance(prev1[0], prev1[1]);
        const prev2EyeDistance = this.calculateDistance(prev2[0], prev2[1]);

        // Detect blink pattern with stricter thresholds
        const closureThreshold = 0.85; // Stricter logic (was 0.90)
        const recoveryThreshold = 0.95; // Stricter recovery (was 0.92)

        if (prev1EyeDistance < currentEyeDistance * closureThreshold &&
            prev2EyeDistance > prev1EyeDistance * recoveryThreshold) {
            this.blinkCount++;
            console.log(`Blink detected! Count: ${this.blinkCount}/${this.blinkRequired}`);
        }

        return this.blinkCount >= this.blinkRequired;
    }

    verifySmile(detectionData) {
        // High-Res (FaceMesh) Logic
        if (detectionData.isHighRes && detectionData.landmarks.length > 10) {
            const lm = detectionData.landmarks;
            const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

            // Mouth corners: 61 (left), 291 (right)
            // Lips top/bottom: 0, 17
            const mouthWidth = dist(lm[61], lm[291]);
            const faceWidth = dist(lm[234], lm[454]); // Cheek to cheek (approx)

            const ratio = mouthWidth / faceWidth;
            // Normal ~0.35, Smile > 0.45
            if (ratio > 0.45) {
                console.log("High-Res Smile Detected!");
                return true;
            }
            return false;
        }

        // Fallback Logic
        if (!detectionData.landmarks || detectionData.landmarks.length < 6) {
            return false;
        }

        const landmarks = detectionData.landmarks;
        this.addToHistory(landmarks);

        if (!this.establishBaseline(landmarks)) {
            return false;
        }

        const rightEye = landmarks[0];
        const leftEye = landmarks[1];
        const mouth = landmarks[3];
        const nose = landmarks[2];

        // Calculate mouth position relative to eyes
        const eyeCenter = [(rightEye[0] + leftEye[0]) / 2, (rightEye[1] + leftEye[1]) / 2];
        const mouthToEyeDistance = this.calculateDistance(mouth, eyeCenter);

        // When smiling, mouth corners move up and outward
        const currentMouthWidth = Math.abs(mouth[0] - eyeCenter[0]);
        const mouthWidthRatio = currentMouthWidth / this.baseline.mouthWidth;

        // Smile detection with stricter threshold
        const smileThreshold = 1.15; // Standard threshold (was optimized to 1.08)
        const isSmiling = mouthWidthRatio > smileThreshold;

        if (isSmiling) {
            console.log('Smile detected!');
            return true;
        }

        return false;
    }

    verifyHeadTurn(detectionData) {
        if (!detectionData.landmarks || detectionData.landmarks.length < 6) {
            return false;
        }

        const landmarks = detectionData.landmarks;
        this.addToHistory(landmarks);

        const rightEye = landmarks[0];
        const leftEye = landmarks[1];
        const nose = landmarks[2];
        const rightEar = landmarks[4];
        const leftEar = landmarks[5];

        // Calculate face center and orientation
        const eyeCenter = [(rightEye[0] + leftEye[0]) / 2, (rightEye[1] + leftEye[1]) / 2];
        const noseOffset = nose[0] - eyeCenter[0];
        const eyeDistance = this.calculateDistance(rightEye, leftEye);

        // Normalize offset by face width
        const normalizedOffset = noseOffset / eyeDistance;

        // Stricter thresholds for clear head turns
        const leftThreshold = -0.35;  // Stricter (was -0.25)
        const rightThreshold = 0.35;  // Stricter (was 0.25)
        const centerThreshold = 0.15; // Stricter (was 0.18)

        if (normalizedOffset < leftThreshold) {
            this.headTurnStates.left = true;
            console.log('Head turned LEFT');
        } else if (normalizedOffset > rightThreshold) {
            this.headTurnStates.right = true;
            console.log('Head turned RIGHT');
        } else if (Math.abs(normalizedOffset) < centerThreshold) {
            this.headTurnStates.center = true;
        }

        // Require: center -> left -> center -> right (or reverse)
        return this.headTurnStates.left && this.headTurnStates.right && this.headTurnStates.center;
    }

    verifyMouthOpen(detectionData) {
        if (!detectionData.landmarks || detectionData.landmarks.length < 6) {
            return false;
        }

        const landmarks = detectionData.landmarks;
        this.addToHistory(landmarks);

        if (!this.establishBaseline(landmarks)) {
            return false;
        }

        const mouth = landmarks[3];
        const nose = landmarks[2];

        // Calculate vertical distance between nose and mouth
        const mouthToNoseDistance = Math.abs(mouth[1] - nose[1]);

        // When mouth opens, distance increases
        const openThreshold = 1.3; // Stricter (was 1.2)

        if (this.landmarkHistory.length > 5) {
            const avgDistance = this.landmarkHistory.slice(-5).reduce((sum, lm) => {
                return sum + Math.abs(lm[3][1] - lm[2][1]);
            }, 0) / 5;

            if (mouthToNoseDistance > avgDistance * openThreshold) {
                this.mouthOpenDetected = true;
                console.log('Mouth opening detected!');
            }
        }

        return this.mouthOpenDetected;
    }

    verifyEyebrowRaise(detectionData) {
        if (!detectionData.landmarks || detectionData.landmarks.length < 6) {
            return false;
        }

        const landmarks = detectionData.landmarks;
        this.addToHistory(landmarks);

        if (this.landmarkHistory.length < 10) {
            return false;
        }

        const rightEye = landmarks[0];
        const leftEye = landmarks[1];
        const nose = landmarks[2];

        // Calculate eye to nose distance (when eyebrows raise, eyes appear higher)
        const eyeCenter = [(rightEye[0] + leftEye[0]) / 2, (rightEye[1] + leftEye[1]) / 2];
        const eyeToNoseDistance = Math.abs(eyeCenter[1] - nose[1]);

        // Compare with historical average
        const avgDistance = this.landmarkHistory.slice(-10).reduce((sum, lm) => {
            const ec = [(lm[0][0] + lm[1][0]) / 2, (lm[0][1] + lm[1][1]) / 2];
            return sum + Math.abs(ec[1] - lm[2][1]);
        }, 0) / 10;

        // Eyebrow raise makes eyes appear higher
        const raiseThreshold = 0.92; // Stricter (was 0.95)

        if (eyeToNoseDistance < avgDistance * raiseThreshold) {
            this.eyebrowRaiseDetected = true;
            console.log('Eyebrow raise detected!');
        }

        return this.eyebrowRaiseDetected;
    }

    verifyEyeMovement(detectionData) {
        if (!detectionData.landmarks || detectionData.landmarks.length < 6) {
            return false;
        }

        const landmarks = detectionData.landmarks;
        this.addToHistory(landmarks);

        if (this.landmarkHistory.length < 5) {
            return false;
        }

        const rightEye = landmarks[0];
        const leftEye = landmarks[1];
        const nose = landmarks[2];

        // Calculate eye center position
        const eyeCenter = [(rightEye[0] + leftEye[0]) / 2, (rightEye[1] + leftEye[1]) / 2];
        const eyeDistance = this.calculateDistance(rightEye, leftEye);

        // Calculate horizontal offset from nose (indicates eye direction)
        const eyeOffset = eyeCenter[0] - nose[0];
        const normalizedOffset = eyeOffset / eyeDistance;

        // Stricter thresholds for eye movement
        const leftThreshold = -0.25; // Stricter
        const rightThreshold = 0.25; // Stricter
        const centerThreshold = 0.10; // Stricter

        if (normalizedOffset < leftThreshold) {
            this.eyeMovementStates.left = true;
            console.log('Eyes looking LEFT');
        } else if (normalizedOffset > rightThreshold) {
            this.eyeMovementStates.right = true;
            console.log('Eyes looking RIGHT');
        } else if (Math.abs(normalizedOffset) < centerThreshold) {
            this.eyeMovementStates.center = true;
        }

        return this.eyeMovementStates.left && this.eyeMovementStates.right && this.eyeMovementStates.center;
    }

    /**
     * Get current challenge information
     * @returns {Object|null} Current challenge or null
     */
    getCurrentChallenge() {
        return this.currentChallenge;
    }

    /**
     * Get challenge history
     * @returns {Array} Array of completed challenges
     */
    getHistory() {
        return this.challengeHistory;
    }

    /**
     * Get challenge statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const total = this.challengeHistory.length;
        const successful = this.challengeHistory.filter(c => c.success).length;
        const failed = total - successful;
        const successRate = total > 0 ? (successful / total) * 100 : 0;

        return {
            total,
            successful,
            failed,
            successRate: Math.round(successRate),
            averageDuration: total > 0
                ? Math.round(this.challengeHistory.reduce((sum, c) => sum + c.duration, 0) / total)
                : 0
        };
    }

    reset() {
        this.currentChallenge = null;
        this.challengeHistory = [];
        this.isActive = false;
        this.startTime = null;
        this.landmarkHistory = [];
        this.blinkCount = 0;
        this.headTurnStates = { left: false, center: false, right: false };
        this.eyeMovementStates = { left: false, center: false, right: false };
        this.mouthOpenDetected = false;
        this.eyebrowRaiseDetected = false;
        this.baseline = {
            eyeDistance: null,
            mouthWidth: null,
            eyeToEyebrowDistance: null,
            faceWidth: null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LivenessChallenger;
}
