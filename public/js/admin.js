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
        loadStats(); // Load stats for all workshops
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
    statsSection.style.display = 'grid'; // Always show stats
    
    try {
        const url = workshopId ? `/api/admin/stats?workshopId=${workshopId}` : '/api/admin/stats';
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalCount').textContent = data.stats.total;
            document.getElementById('remainingCount').textContent = data.stats.remaining;
        }
        
        // Fetch attendance stats
        let presentCount = 0;
        let appliedCount = 0;
        try {
            if (workshopId) {
                const attendanceResponse = await fetch(`/api/attendance/stats/${workshopId}`);
                const attendanceData = await attendanceResponse.json();
                
                if (attendanceData.success) {
                    presentCount = attendanceData.data.totalPresent || 0;
                    appliedCount = attendanceData.data.totalApplied || 0;
                }
            }
        } catch (err) {
            console.log('Attendance stats not available');
        }
        document.getElementById('presentCount').textContent = presentCount;
        document.getElementById('appliedCount').textContent = appliedCount;
        
        // Fetch spot registration count
        let spotCount = 0;
        try {
            if (workshopId) {
                const spotResponse = await fetch(`/api/spot-registration/stats/${workshopId}`);
                const spotData = await spotResponse.json();
                
                if (spotData.success) {
                    spotCount = spotData.data.currentSpotRegistrations || 0;
                }
            }
        } catch (err) {
            console.log('Spot registration stats not available');
        }
        document.getElementById('spotCount').textContent = spotCount;
        
        // Calculate online count (total - spot)
        const totalCount = parseInt(data.stats.total) || 0;
        const onlineCount = Math.max(0, totalCount - spotCount);
        document.getElementById('onlineCount').textContent = onlineCount;
        
    } catch (error) {
        console.error('Error loading stats:', error);
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
            
            // Update registration count in header
            const regCountEl = document.getElementById('regCount');
            if (regCountEl) regCountEl.textContent = registrations.length;
            
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
    
    // Store for detail view
    currentRegistrations = registrations;
    
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
                    <th>Name</th>
                    <th>MNC UID</th>
                    <th>Mobile</th>
                    <th>UTR</th>
                    <th>Workshop</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Submitted</th>
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
        
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>#${reg.formNumber || '-'}</strong></td>
                <td>${escapeHtml(reg.fullName)}</td>
                <td><span class="mncuid-badge">${escapeHtml(reg.mncUID)}</span></td>
                <td>${reg.mobileNumber}</td>
                <td>${reg.paymentUTR}</td>
                <td title="${escapeHtml(workshopTitle)}">${escapeHtml(shortTitle)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><span class="status-badge ${typeClass}">${typeText}</span></td>
                <td>${submittedDate}</td>
                <td style="white-space: nowrap;">
                    <button class="action-btn view" onclick="viewPayment('${reg.paymentScreenshot}')" title="View Payment">🖼️</button>
                    <button class="action-btn view" onclick="showRegistrationDetails('${reg._id}')" title="View Details">👁️</button>
                    <button class="action-btn delete" onclick="deleteRegistration('${reg._id}')" title="Delete">🗑️</button>
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

// Store current registrations for detail view
let currentRegistrations = [];

// Show registration details in a modal
function showRegistrationDetails(regId) {
    const reg = currentRegistrations.find(r => r._id === regId);
    if (!reg) return;
    
    const submittedDate = new Date(reg.submittedAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const workshopTitle = reg.workshopId?.title || reg.workshopTitle || 'N/A';
    const regType = reg.registrationType || 'online';
    const attendanceStatus = reg.attendanceStatus || 'applied';
    
    const modal = document.createElement('div');
    modal.id = 'detailModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div style="background:white;border-radius:16px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
            <div style="padding:20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
                <h2 style="font-size:1.2rem;color:#1e293b;">Registration Details</h2>
                <button onclick="document.getElementById('detailModal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#64748b;">×</button>
            </div>
            <div style="padding:20px;">
                <div style="display:grid;gap:16px;">
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">Form Number</span>
                        <span style="font-weight:700;color:#1e293b;">#${reg.formNumber || '-'}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">Full Name</span>
                        <span style="font-weight:600;color:#1e293b;">${escapeHtml(reg.fullName)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">MNC UID</span>
                        <span style="font-family:monospace;background:#e2e8f0;padding:4px 8px;border-radius:4px;">${escapeHtml(reg.mncUID)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">MNC Reg. No.</span>
                        <span style="font-weight:600;color:#1e293b;">${escapeHtml(reg.mncRegistrationNumber || '-')}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">Mobile</span>
                        <span style="font-weight:600;color:#1e293b;">${reg.mobileNumber}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">Payment UTR</span>
                        <span style="font-weight:600;color:#1e293b;">${reg.paymentUTR}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">Workshop</span>
                        <span style="font-weight:600;color:#1e293b;">${escapeHtml(workshopTitle)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">Status</span>
                        <span style="padding:4px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;background:${attendanceStatus === 'present' ? '#dcfce7' : '#fef3c7'};color:${attendanceStatus === 'present' ? '#166534' : '#92400e'};">${attendanceStatus.toUpperCase()}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">Type</span>
                        <span style="padding:4px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;background:${regType === 'spot' ? '#f3e8ff' : '#dbeafe'};color:${regType === 'spot' ? '#7c3aed' : '#1e40af'};">${regType.toUpperCase()}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">Submitted</span>
                        <span style="font-weight:600;color:#1e293b;">${submittedDate}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span style="color:#64748b;font-weight:500;">Downloads</span>
                        <span style="font-weight:700;color:${reg.downloadCount >= 2 ? '#dc2626' : '#22c55e'};">${reg.downloadCount || 0}/2</span>
                    </div>
                </div>
                <div style="display:flex;gap:12px;margin-top:20px;">
                    <button onclick="viewPayment('${reg.paymentScreenshot}');document.getElementById('detailModal').remove();" style="flex:1;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">👁️ View Payment</button>
                    <button onclick="deleteRegistration('${reg._id}');document.getElementById('detailModal').remove();" style="flex:1;padding:12px;background:#ef4444;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}
