// Admin Dashboard Handler - Mobile-Friendly Version
let selectedWorkshopId = '';
let searchTerm = '';
let sortOrder = 'newest'; // Default to newest first

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
    const sortOrderSelect = document.getElementById('sortOrder');

    logoutBtn.addEventListener('click', handleLogout);
    downloadExcelBtn.addEventListener('click', downloadExcel);

    // Workshop filter
    workshopFilter.addEventListener('change', (e) => {
        selectedWorkshopId = e.target.value;
        loadStats(selectedWorkshopId);
        loadRegistrations();
    });

    // Sort order filter
    sortOrderSelect.addEventListener('change', (e) => {
        sortOrder = e.target.value;
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
        
        // Also fetch attendance stats
        try {
            const attendanceResponse = await fetch(`/api/attendance/stats/${workshopId}`);
            const attendanceData = await attendanceResponse.json();
            
            if (attendanceData.success) {
                document.getElementById('presentCount').textContent = attendanceData.data.totalPresent || 0;
                document.getElementById('appliedCount').textContent = attendanceData.data.totalApplied || 0;
            }
        } catch (err) {
            // Attendance stats optional, don't fail if not available
            console.log('Attendance stats not available');
            document.getElementById('presentCount').textContent = '0';
            document.getElementById('appliedCount').textContent = '0';
        }
        
        // Fetch spot registration count
        try {
            const spotResponse = await fetch(`/api/spot-registration/stats/${workshopId}`);
            const spotData = await spotResponse.json();
            
            if (spotData.success) {
                document.getElementById('spotCount').textContent = spotData.data.currentSpotRegistrations || 0;
            }
        } catch (err) {
            // Spot stats optional
            console.log('Spot registration stats not available');
            document.getElementById('spotCount').textContent = '0';
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
            let registrations = data.data || [];
            
            // Sort by registration time (submittedAt)
            registrations.sort((a, b) => {
                const dateA = new Date(a.submittedAt);
                const dateB = new Date(b.submittedAt);
                
                if (sortOrder === 'newest') {
                    return dateB - dateA; // Newest first (descending)
                } else {
                    return dateA - dateB; // Oldest first (ascending)
                }
            });
            
            displayRegistrations(registrations);
        }
    } catch (error) {
        console.error('Error loading registrations:', error);
        listContainer.innerHTML = '<div class="empty-state"><h3>Error loading registrations</h3><p>Please try again</p></div>';
    }
}

// Display registrations as Excel-like table
function displayRegistrations(registrations) {
    const listContainer = document.getElementById('registrationsList');
    
    if (registrations.length === 0) {
        listContainer.innerHTML = '<div class="empty-state"><h3>No registrations found</h3><p>Try changing the filters</p></div>';
        return;
    }

    let tableHTML = `
        <table class="registrations-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Form No.</th>
                    <th>Full Name</th>
                    <th>MNC UID</th>
                    <th>Mobile Number</th>
                    <th>Payment UTR</th>
                    <th>Workshop</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Submitted</th>
                    <th>Downloads</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    registrations.forEach((reg, index) => {
        const submittedDate = new Date(reg.submittedAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        // Attendance status
        const attendanceStatus = reg.attendanceStatus || 'applied';
        const statusClass = attendanceStatus === 'present' ? 'status-present' : 'status-applied';
        const statusText = attendanceStatus === 'present' ? '✓ Present' : '○ Applied';
        
        // Registration type
        const regType = reg.registrationType || 'online';
        const typeClass = regType === 'spot' ? 'type-spot' : 'type-online';
        const typeText = regType === 'spot' ? 'Spot' : 'Online';
        
        // Workshop title (truncate if too long)
        const workshopTitle = reg.workshopId?.title || reg.workshopTitle || 'N/A';
        const shortTitle = workshopTitle.length > 30 ? workshopTitle.substring(0, 27) + '...' : workshopTitle;
        
        // Download count color
        const downloadColor = reg.downloadCount >= 2 ? '#ef4444' : '#10b981';
        
        // For spot registrations, show MNC Registration Number instead of auto-generated UID
        const displayIdentifier = regType === 'spot' 
            ? escapeHtml(reg.mncRegistrationNumber)
            : escapeHtml(reg.mncUID);
        
        tableHTML += `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td><strong>${reg.formNumber || '-'}</strong></td>
                <td>${escapeHtml(reg.fullName)}</td>
                <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${displayIdentifier}</code></td>
                <td>${reg.mobileNumber}</td>
                <td><small>${reg.paymentUTR}</small></td>
                <td title="${escapeHtml(workshopTitle)}">${escapeHtml(shortTitle)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><span class="status-badge ${typeClass}">${typeText}</span></td>
                <td><small>${submittedDate}</small></td>
                <td style="color: ${downloadColor}; font-weight: 700;">${reg.downloadCount}/2</td>
                <td style="white-space: nowrap;">
                    <button class="btn btn-primary btn-table" onclick="viewPayment('${reg.paymentScreenshot}')" title="View Payment Screenshot">
                        👁️
                    </button>
                    <button class="btn btn-danger btn-table" onclick="deleteRegistration('${reg._id}')" title="Delete Registration">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    listContainer.innerHTML = tableHTML;
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
