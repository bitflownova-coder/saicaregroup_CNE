// Spot Registration Portal JS
let selectedWorkshopId = null;
let statsRefreshInterval = null;

// Check authentication on page load
checkAuth();

function checkAuth() {
    fetch('/api/spot-registration/check-session')
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                window.location.href = 'spot-login.html';
            } else {
                loadWorkshops();
            }
        })
        .catch(() => {
            window.location.href = 'spot-login.html';
        });
}

function logout() {
    fetch('/api/spot-registration/logout', {
        method: 'POST'
    })
    .then(res => res.json())
    .then(() => {
        window.location.href = 'spot-login.html';
    })
    .catch(err => {
        console.error('Logout error:', err);
        window.location.href = 'spot-login.html';
    });
}

async function loadWorkshops() {
    try {
        const response = await fetch('/api/spot-registration/workshops');
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
            select.innerHTML = '<option value="">No workshops with spot registration enabled</option>';
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

    // Clear existing interval
    if (statsRefreshInterval) clearInterval(statsRefreshInterval);

    if (selectedWorkshopId) {
        document.getElementById('workshopContent').style.display = 'block';
        document.getElementById('noWorkshop').style.display = 'none';
        
        const selectedOption = select.options[select.selectedIndex];
        document.getElementById('selectedWorkshopTitle').textContent = selectedOption.textContent;

        // Generate QR and load stats
        generateQR();
        loadStats();
        
        // Refresh stats every 15 seconds
        statsRefreshInterval = setInterval(() => {
            loadStats();
        }, 15000);
    } else {
        document.getElementById('workshopContent').style.display = 'none';
        document.getElementById('noWorkshop').style.display = 'block';
    }
}

async function generateQR() {
    if (!selectedWorkshopId) return;

    try {
        const response = await fetch(`/api/spot-registration/qr-token/${selectedWorkshopId}`);
        const data = await response.json();

        if (data.success) {
            // Generate QR code with spot registration URL
            const registerURL = `${window.location.origin}/spot-register.html?token=${data.token}`;
            
            const canvas = document.getElementById('qrCanvas');
            // Clear previous QR code
            canvas.innerHTML = '';
            
            new QRCode(canvas, {
                text: registerURL,
                width: 300,
                height: 300,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });

            // Update UI based on spots remaining
            if (data.spotsFull) {
                document.getElementById('fullBanner').style.display = 'block';
                document.getElementById('qrSection').style.opacity = '0.5';
            } else {
                document.getElementById('fullBanner').style.display = 'none';
                document.getElementById('qrSection').style.opacity = '1';
            }
        } else {
            alert('Failed to generate QR code: ' + data.message);
        }
    } catch (error) {
        console.error('Error generating QR:', error);
        alert('Failed to generate QR code');
    }
}

async function loadStats() {
    if (!selectedWorkshopId) return;

    try {
        const response = await fetch(`/api/spot-registration/stats/${selectedWorkshopId}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('spotLimit').textContent = data.data.spotRegistrationLimit;
            document.getElementById('spotCurrent').textContent = data.data.currentSpotRegistrations;
            document.getElementById('spotRemaining').textContent = data.data.spotsRemaining;

            // Update full banner
            if (data.data.spotsRemaining <= 0) {
                document.getElementById('fullBanner').style.display = 'block';
                document.getElementById('qrSection').style.opacity = '0.5';
            } else {
                document.getElementById('fullBanner').style.display = 'none';
                document.getElementById('qrSection').style.opacity = '1';
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function refreshQR() {
    generateQR();
    loadStats();
}

// Cleanup interval when leaving page
window.addEventListener('beforeunload', () => {
    if (statsRefreshInterval) clearInterval(statsRefreshInterval);
});
