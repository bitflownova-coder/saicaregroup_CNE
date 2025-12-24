// Registration Form Handler
let formData = null;
let registrationCount = null;

// Load registration count on page load
document.addEventListener('DOMContentLoaded', () => {
    loadRegistrationCount();
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

// Load registration count
async function loadRegistrationCount() {
    try {
        const response = await fetch('/api/registration/count');
        const data = await response.json();

        const counter = document.getElementById('registrationCounter');
        
        if (data.success) {
            registrationCount = data;
            
            if (data.isFull) {
                counter.textContent = `Registration Closed - All ${data.maxRegistrations} Seats Filled`;
                counter.classList.add('full');
                showClosedMessage();
            } else {
                counter.textContent = `Registrations Remaining: ${data.remaining}/${data.maxRegistrations}`;
            }

            const seatValue = document.getElementById('seatValue');
            if (seatValue) {
                seatValue.textContent = `${data.remaining}/${data.maxRegistrations}`;
            }
            
            const seatValueTop = document.getElementById('seatValueTop');
            if (seatValueTop) {
                seatValueTop.textContent = `${data.remaining}/${data.maxRegistrations}`;
            }
        }
    } catch (error) {
        console.error('Error loading count:', error);
        showAlert('Error loading registration status', 'error');
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
    const error = document.getElementById(fieldName + 'Error');
    
    field.classList.add('error');
    error.classList.add('show');
}

// Hide field error
function hideFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    const error = document.getElementById(fieldName + 'Error');
    
    field.classList.remove('error');
    error.classList.remove('show');
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
    closeModal();
    showSpinner(true);

    try {
        const response = await fetch('/api/registration/submit', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        showSpinner(false);

        if (data.success) {
            const formNumText = data.data.formNumber ? `Form Number: ${data.data.formNumber}` : '';
            showAlert(`Registration successful! ${formNumText} Your MNC UID ${data.data.mncUID} has been registered.`, 'success');
            
            // Reset form
            document.getElementById('registrationForm').reset();
            document.getElementById('fileName').textContent = 'No file chosen';
            
            // Reload count
            loadRegistrationCount();

            // Redirect to view page after 3 seconds
            setTimeout(() => {
                window.location.href = `/view-registration?mncUID=${data.data.mncUID}`;
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
