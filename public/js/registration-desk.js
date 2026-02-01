// Registration Desk Portal - Unified Attendance & Spot Registration
let selectedWorkshopId = null;
let selectedWorkshop = null;
let attendanceQRCode = null;
let spotQRCode = null;
let attendanceRefreshInterval = null;
let attendanceCountdown = 120;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
}

// Check if already logged in
async function checkSession() {
    try {
        const response = await fetch('/api/registration-desk/check-session');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showPortal();
                loadWorkshops();
                return;
            }
        }
    } catch (error) {
        console.log('No active session');
    }
    // Show login form (default)
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('loginMessage');

    try {
        const response = await fetch('/api/registration-desk/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            messageDiv.textContent = 'Login successful! Loading...';
            messageDiv.className = 'message success';
            
            setTimeout(() => {
                showPortal();
                loadWorkshops();
            }, 500);
        } else {
            messageDiv.textContent = data.message || 'Invalid credentials';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        console.error('Login error:', error);
        messageDiv.textContent = 'Login failed. Please try again.';
        messageDiv.className = 'message error';
    }
}

// Show portal after login
function showPortal() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('portalSection').classList.add('active');
}

// Load workshops
async function loadWorkshops() {
    try {
        const response = await fetch('/api/registration-desk/workshops');
        const data = await response.json();

        if (data.success && data.data) {
            const select = document.getElementById('workshopSelect');
            select.innerHTML = '<option value="">-- Select a Workshop --</option>';
            
            data.data.forEach(workshop => {
                const date = new Date(workshop.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
                const option = document.createElement('option');
                option.value = workshop._id;
                option.textContent = `${workshop.title} - ${date}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading workshops:', error);
    }
}

// Select workshop
async function selectWorkshop() {
    const workshopId = document.getElementById('workshopSelect').value;
    
    if (!workshopId) {
        document.getElementById('workshopContent').style.display = 'none';
        document.getElementById('noWorkshop').style.display = 'block';
        stopAttendanceRefresh();
        selectedWorkshopId = null;
        selectedWorkshop = null;
        return;
    }

    selectedWorkshopId = workshopId;
    document.getElementById('workshopContent').style.display = 'block';
    document.getElementById('noWorkshop').style.display = 'none';

    // Fetch workshop details
    try {
        const response = await fetch(`/api/workshop/${workshopId}`);
        const data = await response.json();
        if (data.success) {
            selectedWorkshop = data.data;
            document.getElementById('selectedWorkshopTitle').textContent = selectedWorkshop.title;
            document.getElementById('spotWorkshopTitle').textContent = selectedWorkshop.title;
        }
    } catch (error) {
        console.error('Error fetching workshop:', error);
    }

    // Load both tabs data
    loadAttendanceData();
    loadSpotData();
    
    // Start attendance QR refresh
    startAttendanceQRRefresh();
    
    // Generate spot QR
    generateSpotQR();
}

// Switch tabs
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
}

// ==================== ATTENDANCE FUNCTIONS ====================

// Load attendance data
async function loadAttendanceData() {
    if (!selectedWorkshopId) return;

    try {
        // Load stats
        const statsResponse = await fetch(`/api/attendance/stats/${selectedWorkshopId}`);
        const statsData = await statsResponse.json();

        if (statsData.success) {
            const stats = statsData.data;
            document.getElementById('totalRegistrations').textContent = stats.totalRegistrations || 0;
            document.getElementById('totalPresent').textContent = stats.totalPresent || 0;
            document.getElementById('totalApplied').textContent = stats.totalApplied || 0;
            
            const percentage = stats.totalRegistrations > 0 
                ? Math.round((stats.totalPresent / stats.totalRegistrations) * 100) 
                : 0;
            document.getElementById('attendancePercentage').textContent = percentage + '%';
        }

        // Load recent attendance
        const recentResponse = await fetch(`/api/attendance/recent/${selectedWorkshopId}`);
        const recentData = await recentResponse.json();

        if (recentData.success) {
            displayRecentAttendance(recentData.data || []);
        }

    } catch (error) {
        console.error('Error loading attendance data:', error);
    }
}

// Display recent attendance
function displayRecentAttendance(records) {
    const container = document.getElementById('attendanceRecords');
    document.getElementById('attendanceCount').textContent = `(${records.length})`;

    if (records.length === 0) {
        container.innerHTML = '<div class="empty-state">No attendance records yet</div>';
        return;
    }

    let html = '';
    records.slice(0, 20).forEach(record => {
        const time = new Date(record.markedAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        html += `
            <div class="recent-item">
                <div>
                    <div class="name">${escapeHtml(record.studentName || record.mncUID)}</div>
                    <div style="font-size: 0.85rem; color: #666;">${record.mncUID}</div>
                </div>
                <div class="time">✅ ${time}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Start attendance QR refresh
function startAttendanceQRRefresh() {
    // Generate initial QR (no auto-refresh)
    generateAttendanceQR();
}

// Stop attendance refresh
function stopAttendanceRefresh() {
    if (attendanceRefreshInterval) {
        clearInterval(attendanceRefreshInterval);
        attendanceRefreshInterval = null;
    }
}

// Manual refresh function
function refreshAttendanceQR() {
    generateAttendanceQR();
    loadAttendanceData();
}

// Generate attendance QR code
async function generateAttendanceQR() {
    if (!selectedWorkshopId) return;

    try {
        const response = await fetch(`/api/attendance/qr-token/${selectedWorkshopId}`);
        const data = await response.json();

        if (data.success) {
            const scanURL = `${window.location.origin}/student-attendance-scan.html?workshopId=${data.workshopId}`;
            
            // Clear previous QR
            const container = document.getElementById('attendanceQRCanvas');
            container.innerHTML = '';
            
            // Generate new QR
            attendanceQRCode = new QRCode(container, {
                text: scanURL,
                width: 250,
                height: 250,
                colorDark: '#1a1a2e',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    } catch (error) {
        console.error('Error generating attendance QR:', error);
    }
}

// ==================== SPOT REGISTRATION FUNCTIONS ====================

// Load spot registration data
async function loadSpotData() {
    if (!selectedWorkshopId) return;

    try {
        const response = await fetch(`/api/spot-registration/stats/${selectedWorkshopId}`);
        const data = await response.json();

        if (data.success) {
            const stats = data.data;
            const limit = stats.spotRegistrationLimit || 0;
            const current = stats.currentSpotRegistrations || 0;
            const remaining = Math.max(0, limit - current);

            document.getElementById('spotLimit').textContent = limit;
            document.getElementById('spotCurrent').textContent = current;
            document.getElementById('spotRemaining').textContent = remaining;

            // Show/hide full banner
            if (remaining <= 0 && limit > 0) {
                document.getElementById('spotFullBanner').style.display = 'block';
                document.getElementById('spotQRSection').style.display = 'none';
            } else {
                document.getElementById('spotFullBanner').style.display = 'none';
                document.getElementById('spotQRSection').style.display = 'block';
            }
        }

        // Load recent spot registrations
        const recentResponse = await fetch(`/api/spot-registration/recent/${selectedWorkshopId}`);
        const recentData = await recentResponse.json();

        if (recentData.success) {
            displayRecentSpotRegistrations(recentData.data || []);
        }

    } catch (error) {
        console.error('Error loading spot data:', error);
    }
}

// Display recent spot registrations
function displayRecentSpotRegistrations(records) {
    const container = document.getElementById('spotRecords');
    document.getElementById('spotCount').textContent = `(${records.length})`;

    if (records.length === 0) {
        container.innerHTML = '<div class="empty-state">No spot registrations yet</div>';
        return;
    }

    let html = '';
    records.slice(0, 20).forEach(record => {
        const time = new Date(record.submittedAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        html += `
            <div class="recent-item">
                <div>
                    <div class="name">${escapeHtml(record.fullName)}</div>
                    <div style="font-size: 0.85rem; color: #666;">${record.mncUID} | Form #${record.formNumber}</div>
                </div>
                <div class="time">🎫 ${time}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Generate spot registration QR
async function generateSpotQR() {
    if (!selectedWorkshopId) return;

    try {
        const response = await fetch(`/api/spot-registration/qr-token/${selectedWorkshopId}`);
        const data = await response.json();

        if (data.success) {
            const registerURL = `${window.location.origin}/spot-register.html?token=${data.token}`;
            
            // Clear previous QR
            const container = document.getElementById('spotQRCanvas');
            container.innerHTML = '';
            
            // Generate new QR
            spotQRCode = new QRCode(container, {
                text: registerURL,
                width: 250,
                height: 250,
                colorDark: '#92400e',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    } catch (error) {
        console.error('Error generating spot QR:', error);
    }
}

// Refresh spot QR
function refreshSpotQR() {
    generateSpotQR();
    loadSpotData();
}

// ==================== UTILITY FUNCTIONS ====================

// Logout
async function logout() {
    try {
        await fetch('/api/registration-desk/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    stopAttendanceRefresh();
    window.location.reload();
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
