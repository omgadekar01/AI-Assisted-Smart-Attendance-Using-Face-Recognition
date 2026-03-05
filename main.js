// ===== GLOBAL VARIABLES =====
let videoStream = null;
let registeredStudents = [];
let attendanceRecords = [];
let autoDetectMode = false;
let faceDetectionInterval = null;

// ===== VOICE ASSISTANT VARIABLES =====
let voiceModeEnabled = false;
let isListening = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
}

const SIMILARITY_THRESHOLD = 40; // Lower = more similar
const DETECTION_INTERVAL = 500; // Check every 500ms

// ===== VOICE ASSISTANT FUNCTIONS =====
function toggleVoiceMode() {
    if (!SpeechRecognition) {
        showToast('Voice recognition not supported in your browser', 'error');
        return;
    }
    
    voiceModeEnabled = !voiceModeEnabled;
    const btn = document.getElementById('voiceToggleBtn');
    const listenBtn = document.getElementById('voiceListenBtn');
    const indicator = document.querySelector('.voice-indicator');
    
    if (voiceModeEnabled) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i> Disable Voice';
        listenBtn.disabled = false;
        if (indicator) indicator.innerHTML = '🎤';
        updateVoiceStatus('Voice mode enabled. Click "Listen" to speak!');
        showToast('Voice mode enabled! Click "Listen" to speak.', 'success');
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-microphone"></i> Enable Voice';
        listenBtn.disabled = true;
        stopVoiceInput();
        if (indicator) indicator.innerHTML = '';
        updateVoiceStatus('');
        showToast('Voice mode disabled', 'success');
    }
}

function startVoiceInput() {
    if (!voiceModeEnabled || !recognition) {
        showToast('Please enable voice mode first', 'error');
        return;
    }
    
    isListening = true;
    document.getElementById('voiceListenBtn').style.display = 'none';
    document.getElementById('stopListeningBtn').style.display = 'inline-block';
    updateVoiceStatus('🎤 Listening... Speak now!');
    
    recognition.onstart = function() {
        console.log('Voice recognition started');
    };
    
    recognition.onresult = function(event) {
        let transcript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptSegment = event.results[i][0].transcript;
            transcript += transcriptSegment;
        }
        
        if (event.isFinal) {
            updateVoiceStatus('Processing: ' + transcript);
            document.getElementById('aiQuery').value = transcript;
            setTimeout(() => {
                sendAIQuery();
            }, 500);
        }
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        updateVoiceStatus('Error: ' + event.error);
        showToast('Voice error: ' + event.error, 'error');
    };
    
    recognition.onend = function() {
        isListening = false;
        document.getElementById('voiceListenBtn').style.display = 'inline-block';
        document.getElementById('stopListeningBtn').style.display = 'none';
        updateVoiceStatus('Voice mode ready');
    };
    
    recognition.start();
}

function stopVoiceInput() {
    if (recognition && isListening) {
        recognition.stop();
        isListening = false;
        document.getElementById('voiceListenBtn').style.display = 'inline-block';
        document.getElementById('stopListeningBtn').style.display = 'none';
        updateVoiceStatus('Voice mode ready');
    }
}

function speakResponse(text) {
    if (!voiceModeEnabled || !synth) {
        return;
    }
    
    // Cancel any ongoing speech
    synth.cancel();
    
    // Clean text for speech
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/[🎤🎧📊📈💬]/g, '').trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = function() {
        updateVoiceStatus('🔊 AI Speaking...');
    };
    
    utterance.onend = function() {
        if (voiceModeEnabled) {
            updateVoiceStatus('Voice mode ready');
        }
    };
    
    utterance.onerror = function(event) {
        console.error('Speech synthesis error:', event);
    };
    
    synth.speak(utterance);
}

function updateVoiceStatus(status) {
    const statusEl = document.getElementById('voiceStatus');
    if (statusEl) {
        statusEl.textContent = status;
        statusEl.style.fontSize = '12px';
        statusEl.style.color = '#666';
        statusEl.style.marginTop = '8px';
        statusEl.style.minHeight = '20px';
    }
}

// ===== TAB SWITCHING =====
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// ===== UTILITIES =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== STUDENT REGISTRATION =====
function loadStudents() {
    const stored = localStorage.getItem('registeredStudents');
    registeredStudents = stored ? JSON.parse(stored) : [];
    displayStudents();
    updateTotalStudents();
}

function saveStudents() {
    localStorage.setItem('registeredStudents', JSON.stringify(registeredStudents));
    updateTotalStudents();
}

// Register a new student
function registerStudent(event) {
    event.preventDefault();

    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentId').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const photoInput = document.getElementById('studentPhoto');

    if (!name || !id || !photoInput.files.length) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    // Check if student ID already exists
    if (registeredStudents.some(student => student.id === id)) {
        showToast('Student ID already registered', 'error');
        return;
    }

    // Convert photo to base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const newStudent = {
            id: id,
            name: name,
            email: email,
            photo: e.target.result,  // Base64 encoded image
            registeredDate: new Date().toLocaleString(),
            attendance: []
        };

        registeredStudents.push(newStudent);
        saveStudents();
        displayStudents();

        // Reset form
        document.getElementById('registrationForm').reset();
        document.getElementById('photoPreview').innerHTML = '<i class="fas fa-image"></i><p>No image selected</p>';

        showToast(`Student "${name}" registered successfully!`, 'success');
    };

    reader.readAsDataURL(photoInput.files[0]);
}

// Display registered students
function displayStudents() {
    const grid = document.getElementById('studentsGrid');

    if (registeredStudents.length === 0) {
        grid.innerHTML = '<p class="empty-state">No students registered yet. Use the form above to register students.</p>';
        return;
    }

    grid.innerHTML = registeredStudents.map(student => `
        <div class="student-card">
            <img src="${student.photo}" alt="${student.name}" class="student-image">
            <div class="student-info">
                <div class="student-name">${student.name}</div>
                <div class="student-id">ID: ${student.id}</div>
                <div class="student-date">Registered: ${student.registeredDate}</div>
                <div class="student-attendance">Today: ${student.attendance.filter(a => a.date === new Date().toLocaleDateString()).length} marks</div>
                <button class="btn btn-danger btn-small" onclick="deleteStudent('${student.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Delete a student
function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        registeredStudents = registeredStudents.filter(s => s.id !== studentId);
        saveStudents();
        displayStudents();
        showToast('Student deleted successfully', 'success');
    }
}

// ===== TIME & DATE DISPLAY =====
function updateTime() {
    const now = new Date();
    const timeDisplay = document.getElementById('currentTime');
    const dateDisplay = document.getElementById('currentDate');

    if (timeDisplay) {
        timeDisplay.textContent = now.toLocaleTimeString();
    }
    if (dateDisplay) {
        dateDisplay.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

setInterval(updateTime, 1000);
updateTime();

// ===== FACE DETECTION & RECOGNITION =====
async function startWebcam() {
    try {
        const video = document.getElementById('videoElement');
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        });
        video.srcObject = videoStream;

        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('autoDetectBtn').disabled = false;
        document.getElementById('captureBtn').disabled = false;

        updateDetectionStatus('Webcam started - Ready to detect');
        showToast('Webcam started successfully', 'success');
    } catch (error) {
        showToast('Error accessing webcam: ' + error.message, 'error');
        console.error('Webcam error:', error);
    }
}

function stopWebcam() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        document.getElementById('videoElement').srcObject = null;

        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('autoDetectBtn').disabled = true;
        document.getElementById('captureBtn').disabled = true;
        document.getElementById('autoDetectBtn').textContent = 'Auto-Detect: OFF';
        autoDetectMode = false;

        if (faceDetectionInterval) {
            clearInterval(faceDetectionInterval);
            faceDetectionInterval = null;
        }

        updateDetectionStatus('Webcam stopped');
        showToast('Webcam stopped', 'success');
    }
}

function toggleAutoDetect() {
    autoDetectMode = !autoDetectMode;
    const btn = document.getElementById('autoDetectBtn');

    if (autoDetectMode) {
        btn.textContent = 'Auto-Detect: ON';
        btn.classList.add('active');
        updateDetectionStatus('Auto-detection enabled - Scanning for faces...');
        startAutoFaceDetection();
        showToast('Auto-detection enabled', 'success');
    } else {
        btn.textContent = 'Auto-Detect: OFF';
        btn.classList.remove('active');
        stopAutoFaceDetection();
        updateDetectionStatus('Auto-detection disabled');
        showToast('Auto-detection disabled', 'success');
    }
}

function startAutoFaceDetection() {
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
    }

    faceDetectionInterval = setInterval(() => {
        if (autoDetectMode && videoStream) {
            captureAndRecognize();
        }
    }, DETECTION_INTERVAL);
}

function stopAutoFaceDetection() {
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
        faceDetectionInterval = null;
    }
}

function updateDetectionStatus(status) {
    const statusEl = document.getElementById('detectionStatus');
    if (statusEl) {
        statusEl.textContent = `Status: ${status}`;
    }
}

// ===== FACE RECOGNITION WITH IMAGE SIMILARITY =====
async function captureAndRecognize() {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvasElement');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    if (canvas.width > 0 && canvas.height > 0) {
        try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            await recognizeStudentFromCapture(canvas);
        } catch (error) {
            console.error('Capture error:', error);
        }
    }
}

async function recognizeStudentFromCapture(canvas) {
    if (registeredStudents.length === 0) {
        updateDetectionStatus('No registered students');
        return;
    }

    try {
        const capturedImageData = canvas.toDataURL('image/jpeg', 0.7);

        let bestMatch = null;
        let bestSimilarity = SIMILARITY_THRESHOLD;

        for (let student of registeredStudents) {
            const similarity = await calculateImageSimilarity(capturedImageData, student.photo);

            if (similarity < bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = student;
            }
        }

        if (bestMatch) {
            await markStudentPresent(bestMatch);
        }
    } catch (error) {
        console.error('Recognition error:', error);
    }
}

async function calculateImageSimilarity(img1Data, img2Data) {
    return new Promise((resolve) => {
        const canvas1 = document.createElement('canvas');
        const canvas2 = document.createElement('canvas');
        const ctx1 = canvas1.getContext('2d');
        const ctx2 = canvas2.getContext('2d');

        const img1 = new Image();
        const img2 = new Image();

        let loadedCount = 0;

        const onImageLoad = () => {
            loadedCount++;
            if (loadedCount === 2) {
                canvas1.width = canvas2.width = 64;
                canvas1.height = canvas2.height = 64;

                ctx1.drawImage(img1, 0, 0, 64, 64);
                ctx2.drawImage(img2, 0, 0, 64, 64);

                const imgData1 = ctx1.getImageData(0, 0, 64, 64).data;
                const imgData2 = ctx2.getImageData(0, 0, 64, 64).data;

                let difference = 0;
                for (let i = 0; i < imgData1.length; i++) {
                    difference += Math.abs(imgData1[i] - imgData2[i]);
                }

                const normalizedDifference = (difference / (imgData1.length * 255)) * 100;
                resolve(normalizedDifference);
            }
        };

        img1.onload = onImageLoad;
        img2.onload = onImageLoad;
        img1.onerror = img2.onerror = () => resolve(100);

        img1.src = img1Data;
        img2.src = img2Data;
    });
}

async function markStudentPresent(student) {
    const now = new Date();
    const today = now.toLocaleDateString();
    
    // Check if already marked today
    const alreadyMarked = student.attendance.some(a => a.date === today);

    if (alreadyMarked) {
        updateDetectionStatus(`${student.name} already marked today`);
        return;
    }

    const attendanceRecord = {
        name: student.name,
        studentId: student.id,
        date: today,
        time: now.toLocaleTimeString(),
        status: 'Present',
        timestamp: now.getTime()
    };

    student.attendance.push(attendanceRecord);
    saveStudents();
    addAttendanceRecord(attendanceRecord);
    updateStats();

    const resultDiv = document.getElementById('recognitionResults');
    const resultHTML = `
        <div class="recognized-person success-animation">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div class="student-photo-small">
                    <img src="${student.photo}" alt="${student.name}">
                </div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 5px 0; color: #2ecc71;">✓ PRESENT</h3>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: var(--dark);">${student.name}</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">ID: ${student.id} | ${attendanceRecord.time}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
            </div>
        </div>
    `;
    resultDiv.insertAdjacentHTML('afterbegin', resultHTML);

    updateDetectionStatus(`✓ ${student.name} marked PRESENT`);
    showToast(`✓ ${student.name} - PRESENT`, 'success');

    const results = resultDiv.querySelectorAll('.recognized-person');
    if (results.length > 10) {
        results[results.length - 1].remove();
    }
}

function captureFrame() {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvasElement');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0);

    updateDetectionStatus('Performing face recognition...');
    captureAndRecognize();
}

// ===== ATTENDANCE MANAGEMENT =====
function addAttendanceRecord(record) {
    attendanceRecords.push(record);
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
    updateAttendanceTable();
}

// Load attendance records
function loadAttendanceRecords() {
    const stored = localStorage.getItem('attendanceRecords');
    attendanceRecords = stored ? JSON.parse(stored) : [];
    updateAttendanceTable();
}

// Update attendance table
function updateAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    if (attendanceRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No records yet</td></tr>';
        return;
    }

    // Display recent records (last 50)
    const recentRecords = attendanceRecords.slice(-50).reverse();
    tbody.innerHTML = recentRecords.map(record => `
        <tr>
            <td><strong>${record.name}</strong></td>
            <td>${record.date}</td>
            <td>${record.time}</td>
            <td><span class="status-badge present">${record.status}</span></td>
        </tr>
    `).join('');
}

// Update total students count
function updateTotalStudents() {
    const totalEl = document.getElementById('totalStudents');
    if (totalEl) {
        totalEl.textContent = registeredStudents.length;
    }

    const dashTotal = document.getElementById('dash-total');
    if (dashTotal) {
        dashTotal.textContent = registeredStudents.length;
    }
}

// ===== STATISTICS FUNCTIONS =====
function updateStats() {
    // Get today's date
    const today = new Date().toLocaleDateString();
    
    // Count today's attendance
    const todayAttendance = attendanceRecords.filter(record => record.date === today);
    const todayMarked = todayAttendance.length;
    const totalStudents = registeredStudents.length;
    const attendancePercentage = totalStudents > 0 
        ? Math.round((todayMarked / totalStudents) * 100) 
        : 0;

    const todayEl = document.getElementById('todayMarked');
    const totalEl = document.getElementById('totalStudents');
    const percentEl = document.getElementById('attendancePercentage');

    if (todayEl) todayEl.textContent = todayMarked;
    if (totalEl) totalEl.textContent = totalStudents;
    if (percentEl) percentEl.textContent = attendancePercentage + '%';

    // Also update dashboard
    const dashToday = document.getElementById('dash-today');
    const dashTotal = document.getElementById('dash-total');
    const dashAbsent = document.getElementById('dash-absent');
    const dashPercentage = document.getElementById('dash-percentage');

    if (dashToday) dashToday.textContent = todayMarked;
    if (dashTotal) dashTotal.textContent = totalStudents;
    if (dashAbsent) dashAbsent.textContent = totalStudents - todayMarked;
    if (dashPercentage) dashPercentage.textContent = attendancePercentage + '%';
}

function refreshStats() {
    updateStats();
    showToast('Statistics refreshed', 'success');
}

// ===== ATTENDANCE DOWNLOAD =====
function downloadAttendance() {
    // Create CSV header
    let csvContent = "Name,Student ID,Date,Time,Status\n";
    
    // Add attendance records
    attendanceRecords.forEach(record => {
        csvContent += `"${record.name}","${record.studentId}","${record.date}","${record.time}","${record.status}"\n`;
    });

    if (attendanceRecords.length === 0) {
        csvContent += "No records available";
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toLocaleDateString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Attendance exported successfully', 'success');
}

// ===== SYSTEM FUNCTIONS =====
function initializeSystem() {
    showToast('System reinitialized', 'success');
    updateStats();
}

function clearTodayData() {
    if (confirm('Are you sure you want to clear today\'s attendance data? This action cannot be undone.')) {
        const today = new Date().toLocaleDateString();
        attendanceRecords = attendanceRecords.filter(record => record.date !== today);
        registeredStudents.forEach(student => {
            student.attendance = student.attendance.filter(a => a.date !== today);
        });
        localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
        saveStudents();
        updateAttendanceTable();
        displayStudents();
        updateStats();
        showToast('Today\'s data cleared', 'success');
    }
}

// ===== PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    // Load students and attendance records
    loadStudents();
    loadAttendanceRecords();

    // Initialize stats on page load
    updateStats();

    // Set first tab as active
    const firstTab = document.querySelector('.tab-content');
    if (firstTab) {
        firstTab.classList.add('active');
    }

    const firstNavLink = document.querySelector('.nav-link');
    if (firstNavLink) {
        firstNavLink.classList.add('active');
    }

    // Update server status
    const serverStatus = document.getElementById('serverStatus');
    if (serverStatus) {
        serverStatus.textContent = 'Connected';
        serverStatus.className = 'status-badge present';
    }

    // Update last updated time
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) {
        lastUpdated.textContent = new Date().toLocaleTimeString();
    }

    // Setup photo preview listener
    const photoInput = document.getElementById('studentPhoto');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('photoPreview');
                    preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    console.log('Smart Attendance System - Frontend Loaded');
});

// ===== AI ANALYTICS INTEGRATION =====
// Refresh and display AI analytics
function refreshAIAnalytics() {
    // Generate insights
    const insights = aiEngine.getDetailedInsights(registeredStudents);
    const formatted = aiEngine.formatInsightsForDisplay(insights);
    
    // Update overview metrics
    document.getElementById('ai-avg-attendance').textContent = formatted.classAverage;
    document.getElementById('ai-today-status').textContent = formatted.todayStatus;
    document.getElementById('ai-risk-count').textContent = insights.atRiskStudents.length;
    document.getElementById('ai-best-day').textContent = formatted.bestDay;
    
    // Display top performers
    displayTopPerformers(insights.topPerformers);
    
    // Display at-risk students
    displayAtRiskStudents(insights.atRiskStudents);
    
    // Display predictions
    displayPredictions(insights.predictions);
    
    // Display anomalies
    displayAnomalies(aiEngine.detectAnomalies(registeredStudents));
    
    // Display trends
    displayTrends(insights.weeklyTrends);
    
    // Display recommendations
    displayRecommendations(aiEngine.generateRecommendations(registeredStudents));
    
    showToast('AI Analytics updated', 'success');
}

// Display top performers
function displayTopPerformers(topPerformers) {
    const container = document.getElementById('aiTopPerformers');
    if (!container) return;
    
    if (topPerformers.length === 0) {
        container.innerHTML = '<p class=\"empty-state\">No data available</p>';
        return;
    }
    
    container.innerHTML = topPerformers.map(student => `
        <div class=\"performer-card\">
            <div class=\"performer-rank\">${student.rank}</div>
            <div class=\"performer-info\">
                <div class=\"performer-name\">${student.name}</div>
                <div class=\"performer-rate\">${student.rate}%</div>
            </div>
            <div class=\"performer-badge\">${student.badge}</div>
        </div>
    `).join('');
}

// Display at-risk students
function displayAtRiskStudents(atRiskStudents) {
    const container = document.getElementById('aiAtRiskList');
    if (!container) return;
    
    if (atRiskStudents.length === 0) {
        container.innerHTML = '<p class=\"positive-state\">✅ No at-risk students. All students are doing well!</p>';
        return;
    }
    
    container.innerHTML = atRiskStudents.map(student => `
        <div class="risk-card">
            <div class="risk-indicator">${student.riskIndicator}</div>
            <div class="risk-info">
                <div class="risk-name">${student.name}</div>
                <div class="risk-rate">${student.rate}% attendance</div>
            </div>
        </div>
    `).join('');
}

// Display predictions\nfunction displayPredictions(predictions) {\n    const container = document.getElementById('aiPredictions');\n    if (!container) return;\n    \n    if (predictions.length === 0) {\n        container.innerHTML = '<p class=\"empty-state\">No prediction data available</p>';\n        return;\n    }\n    \n    container.innerHTML = predictions.slice(0, 5).map(pred => `\n        <div class=\"prediction-card\">\n            <div class=\"pred-header\">\n                <span class=\"pred-name\">${pred.studentName}</span>\n                <span class=\"pred-risk ${pred.riskLevel.includes('High') ? 'high' : pred.riskLevel.includes('Medium') ? 'medium' : 'low'}\">${pred.riskLevel}</span>\n            </div>\n            <div class=\"pred-details\">\n                <div class=\"pred-item\">Rate: ${pred.historicalRate}%</div>\n                <div class=\"pred-item\">Trend: ${pred.trendDirection}</div>\n                <div class=\"pred-item\">Confidence: ${pred.confidenceScore}</div>\n            </div>\n        </div>\n    `).join('');\n}\n\n// Display anomalies\nfunction displayAnomalies(anomalies) {\n    const container = document.getElementById('aiAnomalies');\n    if (!container) return;\n    \n    if (anomalies.length === 0) {\n        container.innerHTML = '<p class=\"positive-state\">✅ No anomalies detected. All patterns are normal!</p>';\n        return;\n    }\n    \n    container.innerHTML = anomalies.slice(0, 5).map(anom => `\n        <div class=\"anomaly-card\">\n            <div class=\"anom-type\">${anom.type}</div>\n            <div class=\"anom-student\">${anom.studentName}</div>\n            <div class=\"anom-severity\">Severity: ${anom.severity}</div>\n            <div class=\"anom-action\">Action: ${anom.action}</div>\n        </div>\n    `).join('');\n}\n\n// Display trends\nfunction displayTrends(trends) {\n    const container = document.getElementById('aiTrends');\n    if (!container) return;\n    \n    if (trends.length === 0) {\n        container.innerHTML = '<p class=\"empty-state\">No trend data available</p>';\n        return;\n    }\n    \n    container.innerHTML = trends.map(trend => `\n        <div class=\"trend-item\">\n            <span class=\"trend-week\">${trend.week}</span>\n            <div class=\"trend-bar\">\n                <div class=\"trend-fill\" style=\"width: ${trend.rate}\"></div>\n            </div>\n            <span class=\"trend-rate\">${trend.rate}</span>\n        </div>\n    `).join('');\n}\n\n// Display recommendations\nfunction displayRecommendations(recommendations) {\n    const container = document.getElementById('aiRecommendations');\n    if (!container) return;\n    \n    if (Object.keys(recommendations).length === 0) {\n        container.innerHTML = '<p class=\"empty-state\">No recommendations available</p>';\n        return;\n    }\n    \n    const recList = Object.values(recommendations).slice(0, 5);\n    container.innerHTML = recList.map(rec => `\n        <div class=\"recommendation-card\">\n            <div class=\"rec-name\">${rec.studentName}</div>\n            ${rec.recommendations.map(r => `\n                <div class=\"rec-item\">\n                    <span class=\"rec-priority\">${r.priority}</span>\n                    <span class=\"rec-action\">${r.action}</span>\n                    <div class=\"rec-details\">Impact: ${r.impact}</div>\n                </div>\n            `).join('')}\n        </div>\n    `).join('');\n}\n\n// Send AI query
function sendAIQuery() {
    const queryInput = document.getElementById('aiQuery');
    const chatbox = document.getElementById('aiChatbox');
    
    if (!queryInput.value.trim()) return;
    
    const query = queryInput.value;
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user-message';
    userMsg.innerHTML = `<p>${query}</p>`;
    chatbox.appendChild(userMsg);
    
    // Generate AI response
    const response = aiAssistant.generateResponse(query, registeredStudents);
    
    // Add bot response
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-message bot-message';
        botMsg.innerHTML = `<p>${response}</p>`;
        chatbox.appendChild(botMsg);
        chatbox.scrollTop = chatbox.scrollHeight;
        
        // Speak response if voice mode is enabled
        if (voiceModeEnabled) {
            speakResponse(response);
        }
    }, 300);
    
    // Clear input
    queryInput.value = '';
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Allow Enter key to send query
document.addEventListener('DOMContentLoaded', function() {
    const queryInput = document.getElementById('aiQuery');
    if (queryInput) {
        queryInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendAIQuery();
            }
        });
    }
});

// ===== EVENT LISTENERS =====
document.addEventListener('keydown', function(event) {
    // Close webcam on ESC key
    if (event.key === 'Escape') {
        stopWebcam();
    }
});
