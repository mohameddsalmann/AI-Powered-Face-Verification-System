# 🔐 LivenessGuard - AI-Powered Face Verification System

<div align="center">

![LivenessGuard Banner](https://img.shields.io/badge/AI-Face%20Verification-667eea?style=for-the-badge&logo=tensorflow&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.11.0-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Enterprise-grade liveness detection system for identity verification**

*Similar to Uber, Persona, and Jumio verification flows*

[Live Demo](#demo) • [Features](#features) • [Installation](#installation) • [API](#api) • [Contributing](#contributing)

</div>

---

## 🎯 Overview

LivenessGuard is a **production-ready** face verification system that prevents identity fraud through advanced liveness detection. Built with TensorFlow.js, it runs entirely in the browser - no server-side processing required.

Perfect for:
- 🚗 **Ride-sharing apps** (Driver verification like Uber/Lyft)
- 🏦 **Banking & Fintech** (KYC compliance)
- 🔒 **Secure authentication** (2FA with biometrics)
- 📱 **Mobile onboarding** (Identity verification)

## ✨ Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| 🎭 **Anti-Spoofing** | Detects photos, videos, masks, and deepfakes |
| 👁️ **Blink Detection** | Eye Aspect Ratio (EAR) algorithm with adaptive thresholds |
| 😊 **Smile Detection** | Mouth ratio analysis with baseline calibration |
| ↔️ **Head Pose Estimation** | 3D head orientation tracking |
| 📊 **Depth Analysis** | FaceMesh 468-landmark 3D face reconstruction |
| 🎥 **Video Recording** | Evidence capture for audit trails |

### Technical Highlights

- **🚀 Real-time Processing** - 15-30 FPS on modern devices
- **🔒 Privacy-First** - All processing happens client-side
- **📱 Responsive Design** - Works on desktop and mobile
- **🌍 Multi-language** - English and Arabic (RTL support)
- **♿ Accessible** - WCAG 2.1 compliant
- **⚡ Optimized** - Lazy loading, frame skipping, memory management

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LivenessGuard                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  BlazeFace  │  │  FaceMesh   │  │  Passive Analysis   │  │
│  │  (Fast BB)  │  │ (468 pts)   │  │  (Texture/Moire)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Liveness Challenger                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐    │  │
│  │  │  Blink  │  │  Smile  │  │  Head Turn          │    │  │
│  │  │  (EAR)  │  │ (Ratio) │  │  (Yaw Estimation)   │    │  │
│  │  └─────────┘  └─────────┘  └─────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Security Score Engine                     │  │
│  │  Active(30%) + Passive(25%) + AntiSpoof(25%) + ...    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/livenessguard.git

# Navigate to project
cd livenessguard

# Serve locally (Python)
python -m http.server 8080

# Or with Node.js
npx serve .
```

### Usage

```html
<!-- Include TensorFlow.js -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.2"></script>

<!-- Include LivenessGuard -->
<script src="js/main.js"></script>
```

```javascript
// Initialize and start verification
const app = new LivenessApp();

// Listen for verification result
app.onComplete = (result) => {
  if (result.success) {
    console.log('Verification passed!', result.score);
  }
};
```

## 📁 Project Structure

```
livenessguard/
├── index.html              # Main application
├── css/
│   └── styles.css          # Responsive styles with RTL support
├── js/
│   ├── main.js             # Application controller
│   ├── faceDetector.js     # BlazeFace wrapper
│   ├── depthEstimator.js   # FaceMesh 3D analysis
│   ├── livenessChallenger.js # Challenge verification
│   ├── passiveLiveness.js  # Texture/moire detection
│   ├── antiSpoofing.js     # Spoof attack detection
│   ├── videoRecorder.js    # MediaRecorder wrapper
│   └── translations.js     # i18n support
└── README.md
```

## 🔧 Configuration

```javascript
// Customize verification settings
const config = {
  requiredChallenges: 2,        // Number of challenges
  holdStillDuration: 1200,      // ms to hold still
  challengeTimeout: 6000,       // ms per challenge
  minConfidence: 70,            // Minimum pass score
  cameraResolution: {
    width: 640,
    height: 480
  }
};
```

## 📊 Security Scoring

| Component | Weight | Description |
|-----------|--------|-------------|
| Active Liveness | 30% | Challenge completion (blink, smile, head turn) |
| Passive Liveness | 25% | Texture analysis, temporal consistency |
| Anti-Spoofing | 25% | Photo/screen/mask detection |
| Depth Analysis | 15% | 3D face structure verification |
| Eye Reflection | 5% | Specular highlight analysis |

## 🎮 Demo

### Verification Flow

1. **Position Face** - Center face in oval guide
2. **Hold Still** - Remain stable for 1.2 seconds
3. **Complete Challenges** - Blink, smile, or turn head
4. **Get Results** - Security score and verification status

### Screenshots

<div align="center">
<table>
<tr>
<td align="center"><b>Face Positioning</b></td>
<td align="center"><b>Challenge</b></td>
<td align="center"><b>Results</b></td>
</tr>
<tr>
<td><img src="screenshots/positioning.png" width="250"/></td>
<td><img src="screenshots/challenge.png" width="250"/></td>
<td><img src="screenshots/results.png" width="250"/></td>
</tr>
</table>
</div>

## 🔬 Algorithms

### Eye Aspect Ratio (EAR) for Blink Detection

```javascript
// EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
const leftEAR = (dist(p159, p145) + dist(p158, p153)) / (2 * dist(p33, p133));
const rightEAR = (dist(p386, p374) + dist(p385, p380)) / (2 * dist(p362, p263));
const avgEAR = (leftEAR + rightEAR) / 2;

// Blink detected when EAR drops below 60% of baseline
if (avgEAR < baseline * 0.60) eyesClosed = true;
```

### Head Pose Estimation

```javascript
// Yaw = horizontal rotation
const eyeCenterX = (leftEye.x + rightEye.x) / 2;
const yaw = (noseTip.x - eyeCenterX) / eyeDistance;

// yaw < -0.15 = looking left
// yaw > 0.15 = looking right
```

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 80+ | ✅ Full Support |
| Firefox | 75+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 80+ | ✅ Full Support |
| Mobile Chrome | 80+ | ✅ Full Support |
| Mobile Safari | 14+ | ✅ Full Support |

## 📈 Performance

| Metric | Value |
|--------|-------|
| Model Load Time | ~2-3 seconds |
| Detection FPS | 15-30 FPS |
| Memory Usage | ~150-200 MB |
| Verification Time | 8-15 seconds |

## 🔒 Security Considerations

- ✅ No data sent to external servers
- ✅ All processing happens in browser
- ✅ Video recordings stored locally only
- ✅ No PII stored or transmitted
- ✅ HTTPS required for camera access

## 🛣️ Roadmap

- [ ] Add nod detection (up/down)
- [ ] Implement voice liveness
- [ ] Add document verification
- [ ] React/Vue component wrappers
- [ ] Mobile SDK (React Native)
- [ ] Server-side verification API

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

```bash
# Fork the repo
# Create feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m 'Add amazing feature'

# Push to branch
git push origin feature/amazing-feature

# Open Pull Request
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

## 🙏 Acknowledgments

- [TensorFlow.js](https://www.tensorflow.org/js) - ML framework
- [BlazeFace](https://github.com/nicholasbraun/blazeface) - Face detection
- [MediaPipe FaceMesh](https://google.github.io/mediapipe/) - 468 landmark detection
- [Persona](https://withpersona.com/) - UX inspiration

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ for the developer community

</div>
