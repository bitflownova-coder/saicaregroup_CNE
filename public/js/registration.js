// Registration Form Handler
let formData = null;
let registrationCount = null;
let currentWorkshop = null;
let allWorkshops = [];

// Load workshops and registration count on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAllWorkshops();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('registrationForm');
    const fileInput = document.getElementById('paymentScreenshot');
    const mobileInput = document.getElementById('mobileNumber');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // File input change
    fileInput.addEventListener('change', handleFileChange);

    // Mobile number validation
    mobileInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Modal buttons
    cancelBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', confirmSubmission);
}

// Load all workshops
async function loadAllWorkshops() {
    try {
        // Fetch active and upcoming workshops
        const [activeRes, upcomingRes] = await Promise.all([
            fetch('/api/workshop/active'),
            fetch('/api/workshop/upcoming')
        ]);

        let workshops = [];
        
        // Add active workshop if exists
        if (activeRes.ok) {
            const result = await activeRes.json();
            if (result.success && result.data) {
                workshops.push(result.data);
            }
        }
        
        // Add upcoming workshops
        if (upcomingRes.ok) {
            const result = await upcomingRes.json();
            if (result.success && Array.isArray(result.data)) {
                workshops = workshops.concat(result.data);
            }
        }

        // Remove duplicates and sort by date
        allWorkshops = workshops
            .filter((workshop, index, self) => 
                index === self.findIndex(w => w._id === workshop._id)
            )
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        displayWorkshopsList();
    } catch (error) {
        console.error('Error loading workshops:', error);
        document.getElementById('workshopsContainer').innerHTML = `
            <div class="error-message" style="text-align: center; padding: 40px 20px;">
                <h3 style="color: #666;">Unable to Load Workshops</h3>
                <p style="color: #999;">Please try again later.</p>
            </div>
        `;
    }
}

// Display workshops list
function displayWorkshopsList() {
    const container = document.getElementById('workshopsContainer');
    
    if (allWorkshops.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <h3 style="color: #666; margin-bottom: 10px;">No Workshops Available</h3>
                <p style="color: #999;">There are no workshops currently available for registration. Please check back later.</p>
            </div>
        `;
        // Hide form if no workshops
        const formCard = document.getElementById('formCard');
        if (formCard) formCard.style.display = 'none';
        return;
    }

    let workshopsHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: var(--primary-color); font-size: 1.8rem; margin-bottom: 10px;">📚 Available CNE Workshops</h2>
            <p style="color: #666; font-size: 1rem;">Select a workshop below to register</p>
        </div>
    `;
    
    workshopsHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; padding: 20px 0;">';

    allWorkshops.forEach(workshop => {
        const date = new Date(workshop.date);
        const formattedDate = date.toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: '2-digit' 
        });

        const seatsLeft = workshop.maxSeats - workshop.currentRegistrations;
        const statusConfig = getStatusConfig(workshop.status, seatsLeft);
        const isRegisterable = workshop.status === 'active' && seatsLeft > 0;

        workshopsHTML += `
            <div class="workshop-card" onclick="selectWorkshop('${workshop._id}')" style="
                background: ${isRegisterable ? 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)' : '#f5f5f5'};
                border: 2px solid ${isRegisterable ? statusConfig.bgColor : '#ddd'};
                border-radius: 16px;
                padding: 24px;
                cursor: ${isRegisterable ? 'pointer' : 'not-allowed'};
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,${isRegisterable ? '0.12' : '0.06'});
                opacity: ${isRegisterable ? '1' : '0.7'};
            " ${isRegisterable ? "onmouseover=\"this.style.transform='translateY(-8px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.18)';\" onmouseout=\"this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)';\"" : ''}>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <span style="
                        background: ${statusConfig.bgColor};
                        color: ${statusConfig.textColor};
                        padding: 6px 14px;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                    ">${statusConfig.label}</span>
                    <span style="color: #666; font-size: 0.9rem; font-weight: 600;">${formattedDate}</span>
                </div>

                <h3 style="color: var(--primary-color); margin: 16px 0; font-size: 1.2rem; line-height: 1.4; min-height: 60px; font-weight: 700;">${escapeHtml(workshop.title)}</h3>

                <div style="margin: 12px 0; padding: 10px; background: rgba(103, 58, 183, 0.05); border-left: 3px solid var(--primary-color); border-radius: 4px;">
                    <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;"><strong>📅 ${workshop.dayOfWeek}</strong></div>
                    <div style="font-size: 0.8rem; color: #666; line-height: 1.4;">📍 ${escapeHtml(workshop.venue).substring(0, 80)}${workshop.venue.length > 80 ? '...' : ''}</div>
                </div>

                <div style="display: flex; justify-content: space-between; margin: 16px 0; padding: 16px; background: rgba(255,255,255,0.7); border-radius: 12px; border: 1px solid #e8e8e8;">
                    <div>
                        <strong style="color: #666; font-size: 0.8rem; display: block; margin-bottom: 6px; text-transform: uppercase;">Fee</strong>
                        <span style="color: var(--primary-color); font-size: 1.3rem; font-weight: 800;">₹${workshop.fee}</span>
                    </div>
                    <div style="text-align: right;">
                        <strong style="color: #666; font-size: 0.8rem; display: block; margin-bottom: 6px; text-transform: uppercase;">Credits</strong>
                        <span style="color: var(--primary-color); font-size: 1.3rem; font-weight: 800;">${workshop.credits}</span>
                    </div>
                </div>

                <div style="margin: 16px 0; padding: 12px; background: ${seatsLeft > 10 ? '#e8f5e9' : seatsLeft > 0 ? '#fff3e0' : '#ffebee'}; border-radius: 8px; text-align: center;">
                    <strong style="color: #666; font-size: 0.85rem; display: block; margin-bottom: 4px;">Available Seats</strong>
                    <span style="color: ${seatsLeft > 10 ? '#2e7d32' : seatsLeft > 0 ? '#ef6c00' : '#c62828'}; font-weight: 800; font-size: 1.4rem;">
                        ${seatsLeft > 0 ? `${seatsLeft} / ${workshop.maxSeats}` : 'FULL'}
                    </span>
                </div>

                <button style="
                    width: 100%;
                    margin-top: 16px;
                    padding: 14px;
                    background: ${isRegisterable ? 'linear-gradient(135deg, var(--primary-color) 0%, #5a3d9f 100%)' : '#9e9e9e'};
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: ${isRegisterable ? 'pointer' : 'not-allowed'};
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                " ${isRegisterable ? "onmouseover=\"this.style.transform='scale(1.03)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.3)';\" onmouseout=\"this.style.transform=''; this.style.boxShadow='0 4px 10px rgba(0,0,0,0.2)';\"" : ''} ${!isRegisterable ? 'disabled' : ''}>
                    ${isRegisterable ? '✓ Register Now' : statusConfig.buttonText}
                </button>
            </div>
        `;
    });

    workshopsHTML += '</div>';
    container.innerHTML = workshopsHTML;
}

// Get status configuration
function getStatusConfig(status, seatsLeft) {
    if (seatsLeft <= 0) {
        return {
            label: 'Full',
            bgColor: '#dc3545',
            textColor: 'white',
            buttonText: 'Full - Registration Closed'
        };
    }

    switch (status) {
        case 'active':
            return {
                label: 'Open',
                bgColor: '#28a745',
                textColor: 'white',
                buttonText: 'Register Now'
            };
        case 'upcoming':
            return {
                label: 'Upcoming',
                bgColor: '#17a2b8',
                textColor: 'white',
                buttonText: 'Opens Soon'
            };
        case 'completed':
            return {
                label: 'Completed',
                bgColor: '#6c757d',
                textColor: 'white',
                buttonText: 'Completed'
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                bgColor: '#dc3545',
                textColor: 'white',
                buttonText: 'Cancelled'
            };
        default:
            return {
                label: status,
                bgColor: '#6c757d',
                textColor: 'white',
                buttonText: 'View Details'
            };
    }
}

// Select workshop
function selectWorkshop(workshopId) {
    const workshop = allWorkshops.find(w => w._id === workshopId);
    if (!workshop) return;

    // Check if registration is allowed
    if (workshop.status !== 'active' || (workshop.maxSeats - workshop.currentRegistrations) <= 0) {
        alert(`Registration is not available for this workshop.\nStatus: ${workshop.status}\nSeats Available: ${workshop.maxSeats - workshop.currentRegistrations}`);
        return;
    }

    currentWorkshop = workshop;

    // Hide workshop cards container
    const workshopsContainer = document.getElementById('workshopsContainer');
    if (workshopsContainer) {
        workshopsContainer.style.display = 'none';
    }

    // Hide experience section
    const experienceSection = document.getElementById('experienceSection');
    if (experienceSection) {
        experienceSection.style.display = 'none';
    }

    // Show compact workshop summary
    displayCompactSummary(workshop);
    loadRegistrationCount(workshop._id);

    // Update form title with workshop name
    const formTitle = document.getElementById('formTitle');
    if (formTitle) {
        formTitle.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                <span>Registering for: ${escapeHtml(workshop.title)}</span>
                <span style="font-size: 0.8rem; color: #666; font-weight: 500;">Step 1 of 3: Fill Details</span>
            </div>
        `;
    }

    // Show form
    document.getElementById('formCard').style.display = 'block';

    // Smooth scroll to form
    setTimeout(() => {
        document.getElementById('workshopSummary').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Display compact workshop summary (replaces full details)
function displayCompactSummary(workshop) {
    const summaryDiv = document.getElementById('workshopSummary');
    const date = new Date(workshop.date);
    const formattedDate = date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit' 
    });

    // Show QR code section if available
    let qrSection = '';
    if (workshop.qrCodeImage) {
        qrSection = `
            <div style="margin: 25px 0; padding: 20px; background: white; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                <h3 style="margin: 0 0 15px 0; color: #673ab7; font-size: 1.1rem; font-weight: 700;">💳 Payment QR Code</h3>
                <img src="/uploads/qr-codes/${workshop.qrCodeImage}" alt="Payment QR" style="max-width: 280px; width: 100%; border: 3px solid #673ab7; border-radius: 12px; padding: 10px; background: #f9f9f9;">
                <p style="margin: 15px 0 0 0; color: #333; font-size: 1rem; font-weight: 700;">Scan & Pay ₹${workshop.fee}</p>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 0.85rem;">Use PhonePe, GPay, Paytm or any UPI app</p>
            </div>
        `;
    } else {
        qrSection = `
            <div style="margin: 25px 0; padding: 25px; background: white; border-radius: 12px; text-align: center; border: 2px dashed #ddd;">
                <div style="font-size: 3rem; margin-bottom: 10px;">💳</div>
                <h3 style="margin: 0 0 10px 0; color: #666; font-size: 1.1rem;">Payment Information</h3>
                <p style="margin: 0; color: #666; font-size: 0.9rem;">Pay ₹${workshop.fee} via PhonePe, GPay, Paytm</p>
                <p style="margin: 8px 0 0 0; color: #999; font-size: 0.85rem;">QR Code not uploaded by admin</p>
            </div>
        `;
    }

    summaryDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, #673ab7 0%, #512da8 100%); color: white; padding: 25px 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(103, 58, 183, 0.3); margin-bottom: 30px;">
            <button onclick="backToWorkshops()" style="
                background: rgba(255,255,255,0.2);
                color: white;
                border: 2px solid rgba(255,255,255,0.3);
                padding: 10px 18px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.95rem;
                font-weight: 600;
                margin-bottom: 20px;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                ← Back to All Workshops
            </button>
            
            <div>
                <h2 style="margin: 0 0 20px 0; font-size: 1.6rem; font-weight: 700; line-height: 1.3;">${escapeHtml(workshop.title)}</h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                    <div style="background: rgba(255,255,255,0.1); padding: 12px 16px; border-radius: 8px;">
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-bottom: 4px;">📅 Date & Day</div>
                        <div style="font-size: 0.95rem; font-weight: 600;">${formattedDate}<br>${workshop.dayOfWeek}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 12px 16px; border-radius: 8px;">
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-bottom: 4px;">💰 Workshop Fee</div>
                        <div style="font-size: 1.2rem; font-weight: 700;">₹${workshop.fee}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 12px 16px; border-radius: 8px;">
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-bottom: 4px;">🎓 CNE Credits</div>
                        <div style="font-size: 1.2rem; font-weight: 700;">${workshop.credits}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 12px 16px; border-radius: 8px;">
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-bottom: 4px;">💺 Available Seats</div>
                        <div style="font-size: 1.1rem; font-weight: 700;">${workshop.maxSeats - workshop.currentRegistrations} / ${workshop.maxSeats}</div>
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 14px 18px; border-radius: 8px; margin-top: 15px;">
                    <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 6px;">📍 Venue</div>
                    <div style="font-size: 0.95rem; line-height: 1.5;">${escapeHtml(workshop.venue)}</div>
                </div>
            </div>
        </div>
        
        ${qrSection}
        
        <div style="background: #fff9e6; border-left: 4px solid #fbbf24; padding: 16px 20px; border-radius: 8px; margin-bottom: 25px;">
            <div style="display: flex; align-items: start; gap: 12px;">
                <div style="font-size: 1.5rem;">⚠️</div>
                <div>
                    <strong style="color: #92400e; font-size: 1rem; display: block; margin-bottom: 6px;">Important Instructions</strong>
                    <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 0.9rem; line-height: 1.6;">
                        <li>Complete payment of ₹${workshop.fee} using the QR code above or any UPI app</li>
                        <li>Save the UTR/Transaction ID and screenshot</li>
                        <li>Fill the form below with payment details</li>
                        <li>Attendance is compulsory on workshop day</li>
                        <li>Ensure MNC UID and Registration Number are correct - we're not liable for wrong details</li>
                        <li>Amount once paid is non-refundable</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    summaryDiv.style.display = 'block';
}

// Load workshop details (old function - kept for compatibility)
async function loadWorkshop() {
    try {
        const response = await fetch('/api/workshop/latest');
        const result = await response.json();

        if (result.success && result.data) {
            currentWorkshop = result.data;
            displayWorkshopDetails(currentWorkshop);
            loadRegistrationCount(currentWorkshop._id);
        } else {
            showNoWorkshopMessage();
        }
    } catch (error) {
        console.error('Error loading workshop:', error);
        showNoWorkshopMessage();
    }
}

// Display workshop details
function displayWorkshopDetails(workshop) {
    const detailsDiv = document.getElementById('workshopDetails');
    const date = new Date(workshop.date);
    const formattedDate = date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).split('/').reverse().join('/');

    detailsDiv.innerHTML = `
        <div style="margin-bottom: 20px;">
            <button onclick="backToWorkshops()" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: background 0.3s ease;
            " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                ← Back to All Workshops
            </button>
        </div>

        <h3 style="color: var(--primary-color); margin-bottom: 16px; font-size: 1.3rem;">Details Of CNE Workshop</h3>
        
        <div style="margin-bottom: 14px;">
            <strong style="color: var(--text-dark); font-size: 1rem;">CNE Topic:</strong>
            <span style="color: var(--text-dark); font-size: 1rem; margin-left: 8px;">${escapeHtml(workshop.title)}</span>
        </div>
        
        <div style="margin-bottom: 14px;">
            <strong style="color: var(--text-dark); font-size: 1rem;">CNE Date:</strong>
            <span style="color: var(--text-dark); font-size: 1rem; margin-left: 8px;">${formattedDate} (${workshop.dayOfWeek})</span>
        </div>
        
        <div style="margin-bottom: 16px;">
            <strong style="color: var(--text-dark); font-size: 1rem;">CNE VENUE (Address):</strong>
            ${workshop.venueLink ? 
                `<a href="${workshop.venueLink}" target="_blank" style="color: var(--primary-color); font-size: 0.95rem; margin-left: 8px; display: block; margin-top: 6px; line-height: 1.6; text-decoration: underline;">
                    ${escapeHtml(workshop.venue)}
                </a>` : 
                `<span style="color: var(--text-dark); font-size: 0.95rem; margin-left: 8px; display: block; margin-top: 6px; line-height: 1.6;">
                    ${escapeHtml(workshop.venue)}
                </span>`
            }
        </div>
        
        <div style="margin-bottom: 16px;">
            <strong style="color: var(--text-dark); font-size: 1rem;">Workshop Fee:</strong>
            <span style="color: var(--text-dark); font-size: 1rem; margin-left: 8px; font-weight: 600;">₹ ${workshop.fee}/-</span>
        </div>
        
        <div style="margin-bottom: 16px;">
            <strong style="color: var(--text-dark); font-size: 1rem;">CNE Credits:</strong>
            <span style="color: var(--text-dark); font-size: 1rem; margin-left: 8px; font-weight: 600;">${workshop.credits} Credits</span>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-top: 16px;">
            <strong style="color: #92400e; font-size: 0.95rem;">Important Note:</strong>
            <p style="color: #92400e; font-size: 0.9rem; margin: 6px 0 0 0; line-height: 1.5;">
                Attendance is compulsory on the day of workshop. Management will not be responsible for loss of Candidates Due to Incomplete or wrong details (UID & MNC Reg. No.). Amount once Paid will not be Refundable.
            </p>
        </div>
    `;
}

// Back to workshops list
function backToWorkshops() {
    // Hide summary and form
    document.getElementById('workshopSummary').style.display = 'none';
    document.getElementById('workshopDetails').style.display = 'none';
    document.getElementById('formCard').style.display = 'none';
    
    // Show workshop cards and experience section
    const workshopsContainer = document.getElementById('workshopsContainer');
    if (workshopsContainer) {
        workshopsContainer.style.display = 'block';
    }
    
    const experienceSection = document.getElementById('experienceSection');
    if (experienceSection) {
        experienceSection.style.display = 'block';
    }
    
    // Scroll to workshops
    if (workshopsContainer) {
        workshopsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    currentWorkshop = null;
    
    // Reset form title
    const formTitle = document.getElementById('formTitle');
    if (formTitle) {
        formTitle.textContent = 'Register for CNE Workshop';
    }
    
    // Reset form
    const form = document.getElementById('registrationForm');
    if (form) {
        form.reset();
        const fileName = document.getElementById('fileName');
        if (fileName) {
            fileName.textContent = 'No file chosen';
        }
    }
}

// Show message when no workshop is available
function showNoWorkshopMessage() {
    const detailsDiv = document.getElementById('workshopDetails');
    detailsDiv.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <h3 style="color: #666; margin-bottom: 10px;">No Active Workshop</h3>
            <p style="color: #999;">There are no workshops currently open for registration. Please check back later.</p>
        </div>
    `;

    const formCard = document.getElementById('formCard');
    if (formCard) {
        formCard.style.display = 'none';
    }
}

// Load registration count
async function loadRegistrationCount(workshopId = null) {
    if (!workshopId) {
        return;
    }

    try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/registration/count?workshopId=${workshopId}&t=${timestamp}`);
        const data = await response.json();

        registrationCount = data.total || 0;
        const remaining = data.remaining || 0;
        const maxSeats = data.maxRegistrations || 500;
        
        // Check if workshop is full
        if (remaining <= 0 || (currentWorkshop && currentWorkshop.status !== 'active')) {
            // Hide the registration form
            const formCard = document.getElementById('formCard');
            if (formCard) {
                formCard.style.display = 'none';
            }
            
            // Show message in workshop details
            const workshopDetails = document.getElementById('workshopDetails');
            if (workshopDetails) {
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = 'background: #fee; border: 2px solid #dc3545; padding: 16px; border-radius: 8px; margin-top: 20px; text-align: center;';
                messageDiv.innerHTML = `<strong style="color: #dc3545; font-size: 1.1rem;">❌ Registration Closed - All ${maxSeats} Seats Filled</strong>`;
                workshopDetails.appendChild(messageDiv);
            }
        }
    } catch (error) {
        console.error('Error loading count:', error);
    }
}

// Show closed message
function showClosedMessage() {
    const formCard = document.getElementById('formCard');
    formCard.className = 'form-card closed';
    formCard.innerHTML = `
        <h2>❌ Registration Closed</h2>
        <p>We're sorry, but all ${registrationCount.maxRegistrations} seats have been filled.</p>
        <p>Thank you for your interest!</p>
        <div style="margin-top: 30px;">
            <a href="/view-registration" class="btn btn-primary">View Your Registration</a>
        </div>
    `;
}

// Handle file input change
function handleFileChange(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
    document.getElementById('fileName').textContent = fileName;
    
    if (e.target.files[0]) {
        // Validate file size (5MB)
        if (e.target.files[0].size > 5 * 1024 * 1024) {
            showAlert('File size must be less than 5MB', 'error');
            e.target.value = '';
            document.getElementById('fileName').textContent = 'No file chosen';
        }
    }
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    // Update step indicator
    const formTitle = document.getElementById('formTitle');
    if (formTitle && currentWorkshop) {
        formTitle.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                <span>Registering for: ${escapeHtml(currentWorkshop.title)}</span>
                <span style="font-size: 0.8rem; color: #666; font-weight: 500;">Step 2 of 3: Review Details</span>
            </div>
        `;
    }

    // Validate form
    if (!validateForm()) {
        return;
    }

    // Check if registration is full
    if (registrationCount && registrationCount.isFull) {
        showAlert(`Registration is closed. All ${registrationCount.maxRegistrations} seats are filled.`, 'error');
        return;
    }

    // Get form data
    const form = e.target;
    formData = new FormData(form);

    // Show review modal
    showReviewModal(formData);
}

// Validate form
function validateForm() {
    let isValid = true;

    // Full Name
    const fullName = document.getElementById('fullName');
    if (!fullName.value.trim()) {
        showFieldError('fullName');
        isValid = false;
    } else {
        hideFieldError('fullName');
    }

    // MNC Registration Number
    const mncRegNum = document.getElementById('mncRegistrationNumber');
    if (!mncRegNum.value.trim()) {
        showFieldError('mncRegistrationNumber');
        isValid = false;
    } else {
        hideFieldError('mncRegistrationNumber');
    }

    // MNC UID
    const mncUID = document.getElementById('mncUID');
    if (!mncUID.value.trim()) {
        showFieldError('mncUID');
        isValid = false;
    } else {
        hideFieldError('mncUID');
    }

    // Mobile Number
    const mobile = document.getElementById('mobileNumber');
    const mobilePattern = /^[0-9]{10}$/;
    if (!mobilePattern.test(mobile.value)) {
        showFieldError('mobileNumber');
        isValid = false;
    } else {
        hideFieldError('mobileNumber');
    }

    // Payment UTR
    const paymentUTR = document.getElementById('paymentUTR');
    if (!paymentUTR.value.trim()) {
        showFieldError('paymentUTR');
        isValid = false;
    } else {
        hideFieldError('paymentUTR');
    }

    // Payment Screenshot
    const screenshot = document.getElementById('paymentScreenshot');
    if (!screenshot.files || !screenshot.files[0]) {
        showFieldError('paymentScreenshot');
        isValid = false;
    } else {
        hideFieldError('paymentScreenshot');
    }

    return isValid;
}

// Show field error
function showFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    if (field) {
        field.classList.add('error');
        field.style.borderColor = '#dc3545';
    }
    const error = document.getElementById(fieldName + 'Error');
    if (error) {
        error.classList.add('show');
    }
}

// Hide field error
function hideFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    if (field) {
        field.classList.remove('error');
        field.style.borderColor = '';
    }
    const error = document.getElementById(fieldName + 'Error');
    if (error) {
        error.classList.remove('show');
    }
}

// Show review modal
function showReviewModal(formData) {
    const modal = document.getElementById('confirmationModal');
    const reviewDetails = document.getElementById('reviewDetails');

    const fileName = document.getElementById('paymentScreenshot').files[0].name;

    reviewDetails.innerHTML = `
        <div class="review-item">
            <strong>Full Name</strong>
            <span>${formData.get('fullName')}</span>
        </div>
        <div class="review-item">
            <strong>MNC Registration Number</strong>
            <span>${formData.get('mncRegistrationNumber')}</span>
        </div>
        <div class="review-item">
            <strong>MNC UID</strong>
            <span>${formData.get('mncUID')}</span>
        </div>
        <div class="review-item">
            <strong>Mobile Number</strong>
            <span>${formData.get('mobileNumber')}</span>
        </div>
        <div class="review-item">
            <strong>Payment UTR / Transaction ID</strong>
            <span>${formData.get('paymentUTR')}</span>
        </div>
        <div class="review-item">
            <strong>Payment Screenshot</strong>
            <span>${fileName}</span>
        </div>
    `;

    modal.classList.add('show');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.remove('show');
}

// Confirm submission
async function confirmSubmission() {
    if (!currentWorkshop) {
        showAlert('No active workshop available', 'error');
        return;
    }

    // Update step indicator
    const formTitle = document.getElementById('formTitle');
    if (formTitle && currentWorkshop) {
        formTitle.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                <span>Registering for: ${escapeHtml(currentWorkshop.title)}</span>
                <span style="font-size: 0.8rem; color: #673ab7; font-weight: 600;">Step 3 of 3: Processing...</span>
            </div>
        `;
    }

    closeModal();
    showSpinner(true);

    // Add workshopId to formData
    formData.append('workshopId', currentWorkshop._id);

    try {
        const response = await fetch('/api/registration/submit', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        showSpinner(false);

        if (data.success) {
            const formNumText = data.data.formNumber ? `Form Number: ${data.data.formNumber}` : '';
            
            // Update button to show success
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.textContent = '✅ Registration Successful!';
            submitBtn.style.background = '#28a745';
            submitBtn.disabled = true;
            
            showAlert(`✅ Registration Successful! ${formNumText} Your MNC UID ${data.data.mncUID} has been registered. Redirecting to view page...`, 'success');
            
            // Reset form
            setTimeout(() => {
                document.getElementById('registrationForm').reset();
                const fileNameDisplay = document.getElementById('fileName');
                if (fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
            }, 1000);
            
            // Reload count
            loadRegistrationCount();

            // Redirect to view page after 3 seconds
            setTimeout(() => {
                window.location.href = `/view-registration?mncUID=${data.data.mncUID}&mobile=${data.data.mobileNumber}`;
            }, 3000);
        } else {
            showAlert(data.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showSpinner(false);
        showAlert('Network error. Please check your connection and try again.', 'error');
    }
}

// Show/hide spinner
function showSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    const submitBtn = document.getElementById('submitBtn');
    
    if (show) {
        spinner.classList.add('show');
        submitBtn.disabled = true;
    } else {
        spinner.classList.remove('show');
        submitBtn.disabled = false;
    }
}

// Show alert message
function showAlert(message, type) {
    const alert = document.getElementById('alertMessage');
    alert.textContent = message;
    alert.className = `alert alert-${type} show`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
