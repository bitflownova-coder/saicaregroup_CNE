// Attendance Portal JS
let selectedWorkshopId = null;
let qrRefreshInterval = null;
let countdownInterval = null;
let attendanceRefreshInterval = null;
let countdown = 5;

// Check authentication on page load
checkAuth();

function checkAuth() {
    fetch('/api/attendance/check-session')
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                window.location.href = 'attendance-login.html';
            } else {
                loadWorkshops();
            }
        })
        .catch(() => {
            window.location.href = 'attendance-login.html';
        });
}

function logout() {
    fetch('/api/attendance/logout', {
        method: 'POST'
    })
    .then(res => res.json())
    .then(() => {
        window.location.href = 'attendance-login.html';
    })
    .catch(err => {
        console.error('Logout error:', err);
        window.location.href = 'attendance-login.html';
    });
}

async function loadWorkshops() {
    try {
        const response = await fetch('/api/attendance/workshops');
        const data = await response.json();

        const select = document.getElementById('workshopSelect');
        select.innerHTML = '<option value="">-- Select a Workshop --</option>';

        if (data.success && data.data.length > 0) {
            data.data.forEach(workshop => {
                const option = document.createElement('option');
                option.value = workshop._id;
                const date = new Date(workshop.date).toLocaleDateString();
                option.textContent = `${workshop.title} - ${date} (${workshop.status})`;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option value="">No workshops available</option>';
        }
    } catch (error) {
        console.error('Error loading workshops:', error);
        const select = document.getElementById('workshopSelect');
        select.innerHTML = '<option value="">Error loading workshops</option>';
    }
}

function selectWorkshop() {
    const select = document.getElementById('workshopSelect');
    selectedWorkshopId = select.value;

    // Clear existing intervals
    if (qrRefreshInterval) clearInterval(qrRefreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    if (attendanceRefreshInterval) clearInterval(attendanceRefreshInterval);

    if (selectedWorkshopId) {
        document.getElementById('workshopContent').style.display = 'block';
        document.getElementById('noWorkshop').style.display = 'none';
        
        const selectedOption = select.options[select.selectedIndex];
        document.getElementById('selectedWorkshopTitle').textContent = selectedOption.textContent;

        // Generate QR code once (no auto-refresh)
        generateQR();

        // Load stats and attendance
        loadStats();
        loadAttendance();
        
        // Refresh attendance every 10 seconds
        attendanceRefreshInterval = setInterval(() => {
            loadStats();
            loadAttendance();
        }, 10000);
    } else {
        document.getElementById('workshopContent').style.display = 'none';
        document.getElementById('noWorkshop').style.display = 'block';
    }
}

async function generateQR() {
    if (!selectedWorkshopId) return;

    try {
        const response = await fetch(`/api/attendance/qr-token/${selectedWorkshopId}`);
        const data = await response.json();

        if (data.success) {
            // Generate QR code with attendance scan URL using workshopId
            const scanURL = `${window.location.origin}/attendance-scan.html?workshopId=${data.workshopId}`;
            
            const qrDiv = document.getElementById('qrCanvas');
            // Clear previous QR code
            qrDiv.innerHTML = '';
            
            new QRCode(qrDiv, {
                text: scanURL,
                width: 300,
                height: 300,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    } catch (error) {
        console.error('Error generating QR:', error);
    }
}

function startCountdown() {
    countdown = 30;
    document.getElementById('countdown').textContent = countdown;
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        countdown--;
        if (countdown < 0) {
            countdown = 30;
        }
        document.getElementById('countdown').textContent = countdown;
    }, 1000);
}

async function loadStats() {
    if (!selectedWorkshopId) return;

    try {
        const response = await fetch(`/api/attendance/stats/${selectedWorkshopId}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalRegistrations').textContent = data.data.totalRegistrations;
            document.getElementById('totalPresent').textContent = data.data.totalPresent;
            document.getElementById('totalApplied').textContent = data.data.totalApplied;
            document.getElementById('attendancePercentage').textContent = data.data.attendancePercentage + '%';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadAttendance() {
    if (!selectedWorkshopId) return;

    try {
        const response = await fetch(`/api/attendance/workshop/${selectedWorkshopId}`);
        const data = await response.json();

        const container = document.getElementById('attendanceRecords');
        const countSpan = document.getElementById('attendanceCount');

        if (data.success && data.data.length > 0) {
            countSpan.textContent = `(${data.count})`;
            
            container.innerHTML = data.data.slice(0, 20).map(record => {
                const time = new Date(record.markedAt).toLocaleString();
                return `
                    <div class="attendance-item">
                        <div>
                            <strong>${record.studentName}</strong>
                            <br>
                            <small>${record.mncRegistrationNumber}</small>
                        </div>
                        <div class="timestamp">${time}</div>
                    </div>
                `;
            }).join('');
        } else {
            countSpan.textContent = '(0)';
            container.innerHTML = '<p class="no-workshop">No attendance records yet</p>';
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
        document.getElementById('attendanceRecords').innerHTML = 
            '<p class="no-workshop">Error loading attendance records</p>';
    }
}

// Cleanup intervals when leaving page
window.addEventListener('beforeunload', () => {
    if (qrRefreshInterval) clearInterval(qrRefreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    if (attendanceRefreshInterval) clearInterval(attendanceRefreshInterval);
});
