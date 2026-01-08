// Admin Dashboard Handler - Mobile-Friendly Version
let selectedWorkshopId = '';
let searchTerm = '';

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Check if admin is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/api/admin/check-session');
        const data = await response.json();
        
        if (!data.success || !data.isAdmin) {
            window.location.href = '/admin-login';
            return;
        }
        
        // Load dashboard data
        loadWorkshops();
        loadRegistrations();
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/admin-login';
    }
}

// Setup event listeners
function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    const searchBox = document.getElementById('searchBox');
    const workshopFilter = document.getElementById('workshopFilter');

    logoutBtn.addEventListener('click', handleLogout);
    downloadExcelBtn.addEventListener('click', downloadExcel);

    // Workshop filter
    workshopFilter.addEventListener('change', (e) => {
        selectedWorkshopId = e.target.value;
        loadStats(selectedWorkshopId);
        loadRegistrations();
    });

    // Search with debounce
    let searchTimeout;
    searchBox.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchTerm = e.target.value;
            loadRegistrations();
        }, 500);
    });
}

// Load workshops for filter dropdown
async function loadWorkshops() {
    try {
        const response = await fetch('/api/admin/workshops');
        const result = await response.json();
        
        if (result.success && result.data) {
            const workshopFilter = document.getElementById('workshopFilter');
            const workshops = result.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            workshops.forEach(workshop => {
                const option = document.createElement('option');
                option.value = workshop._id;
                const date = new Date(workshop.date).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
                option.textContent = `${workshop.title} - ${date}`;
                workshopFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading workshops:', error);
    }
}

// Load dashboard stats
async function loadStats(workshopId = '') {
    const statsSection = document.getElementById('statsSection');
    
    if (!workshopId) {
        statsSection.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/stats?workshopId=${workshopId}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalCount').textContent = data.stats.total;
            document.getElementById('remainingCount').textContent = data.stats.remaining;
            document.getElementById('percentageFilled').textContent = data.stats.percentageFilled + '%';
            statsSection.style.display = 'grid';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        statsSection.style.display = 'none';
    }
}

// Load registrations
async function loadRegistrations() {
    const listContainer = document.getElementById('registrationsList');
    listContainer.innerHTML = '<div class="spinner"></div>';
    
    try {
        let url = `/api/admin/registrations?limit=1000&search=${searchTerm}`;
        if (selectedWorkshopId) {
            url += `&workshopId=${selectedWorkshopId}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            const registrations = (data.data || []).sort((a, b) => (a.formNumber || 0) - (b.formNumber || 0));
            displayRegistrations(registrations);
        }
    } catch (error) {
        console.error('Error loading registrations:', error);
        listContainer.innerHTML = '<div class="empty-state"><h3>Error loading registrations</h3><p>Please try again</p></div>';
    }
}

// Display registrations as cards
function displayRegistrations(registrations) {
    const listContainer = document.getElementById('registrationsList');
    
    if (registrations.length === 0) {
        listContainer.innerHTML = '<div class="empty-state"><h3>No registrations found</h3><p>Try changing the filters</p></div>';
        return;
    }

    let cardsHTML = '';
    
    registrations.forEach(reg => {
        const submittedDate = new Date(reg.submittedAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        cardsHTML += `
            <div class="registration-card">
                <div class="reg-header">
                    <div class="reg-name">${escapeHtml(reg.fullName)}</div>
                    <div class="reg-form-no">Form ${reg.formNumber || '-'}</div>
                </div>
                <div class="reg-details">
                    <div class="reg-detail-row">
                        <span class="reg-detail-label">MNC UID:</span>
                        <span>${escapeHtml(reg.mncUID)}</span>
                    </div>
                    <div class="reg-detail-row">
                        <span class="reg-detail-label">Mobile:</span>
                        <span>${reg.mobileNumber}</span>
                    </div>
                    <div class="reg-detail-row">
                        <span class="reg-detail-label">Payment UTR:</span>
                        <span>${reg.paymentUTR}</span>
                    </div>
                    <div class="reg-detail-row">
                        <span class="reg-detail-label">Submitted:</span>
                        <span>${submittedDate}</span>
                    </div>
                    <div class="reg-detail-row">
                        <span class="reg-detail-label">Downloads:</span>
                        <span style="color: ${reg.downloadCount >= 2 ? '#ef4444' : '#10b981'}; font-weight: 700;">${reg.downloadCount}/2</span>
                    </div>
                </div>
                <div class="reg-actions">
                    <button class="btn btn-primary btn-small" onclick="viewPayment('${reg.paymentScreenshot}')">
                        View Payment
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteRegistration('${reg._id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    listContainer.innerHTML = cardsHTML;
}

// View payment screenshot
function viewPayment(screenshotPath) {
    const modal = document.getElementById('paymentModal');
    const img = document.getElementById('paymentImage');
    // If path doesn't start with uploads/, add it
    const fullPath = screenshotPath.startsWith('uploads/') ? screenshotPath : `uploads/payments/${screenshotPath}`;
    img.src = '/' + fullPath;
    modal.style.display = 'block';
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'none';
}

// Delete registration
async function deleteRegistration(id) {
    if (!confirm('Are you sure you want to delete this registration?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/registrations/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Registration deleted successfully', 'success');
            loadStats(selectedWorkshopId);
            loadRegistrations();
        } else {
            showAlert(data.message || 'Failed to delete registration', 'error');
        }
    } catch (error) {
        console.error('Error deleting registration:', error);
        showAlert('Error deleting registration', 'error');
    }
}

// Download Excel
async function downloadExcel() {
    try {
        let url = '/api/admin/export-excel';
        if (selectedWorkshopId) {
            url += `?workshopId=${selectedWorkshopId}`;
        }
        
        const response = await fetch(url);
        
        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `registrations-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            
            showAlert('Excel downloaded successfully', 'success');
        } else {
            showAlert('Failed to download Excel', 'error');
        }
    } catch (error) {
        console.error('Error downloading Excel:', error);
        showAlert('Error downloading Excel', 'error');
    }
}

// Logout
async function handleLogout() {
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin-login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/admin-login';
    }
}

// Show alert
function showAlert(message, type) {
    const alert = document.getElementById('alertMessage');
    alert.textContent = message;
    alert.className = `alert ${type} show`;
    
    setTimeout(() => {
        alert.classList.remove('show');
    }, 3000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
