// View Registration Handler
let currentRegistration = null;

// Check URL parameters
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mncUID = urlParams.get('mncUID');
    
    if (mncUID) {
        document.getElementById('mncUID').value = mncUID;
    }

    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const lookupForm = document.getElementById('lookupForm');
    const downloadBtn = document.getElementById('downloadBtn');
    const backBtn = document.getElementById('backBtn');
    const mobileInput = document.getElementById('mobileNumber');

    lookupForm.addEventListener('submit', handleLookup);
    downloadBtn.addEventListener('click', handleDownload);
    backBtn.addEventListener('click', showLookupForm);

    // Mobile number validation
    mobileInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
}

// Handle lookup form submission
async function handleLookup(e) {
    e.preventDefault();

    const mncUID = document.getElementById('mncUID').value.trim();
    const mobileNumber = document.getElementById('mobileNumber').value.trim();

    if (!mncUID || !mobileNumber) {
        showAlert('Please enter both MNC UID and Mobile Number', 'error');
        return;
    }

    if (!/^[0-9]{10}$/.test(mobileNumber)) {
        showAlert('Please enter a valid 10-digit mobile number', 'error');
        return;
    }

    showSpinner(true);

    try {
        const response = await fetch('/api/registration/view', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mncUID, mobileNumber })
        });

        const data = await response.json();
        showSpinner(false);

        if (data.success) {
            currentRegistration = data.data;
            showRegistrationDetails(data.data);
        } else {
            showAlert(data.message || 'No registration found with these details', 'error');
        }
    } catch (error) {
        console.error('Lookup error:', error);
        showSpinner(false);
        showAlert('Network error. Please try again.', 'error');
    }
}

// Show registration details
function showRegistrationDetails(data) {
    const detailsDiv = document.getElementById('registrationDetails');
    
    const submittedDate = new Date(data.submittedAt).toLocaleString('en-IN', {
        dateStyle: 'long',
        timeStyle: 'short'
    });

    detailsDiv.innerHTML = `
        <div class="review-details">
            <div class="review-item">
                <strong>Form Number</strong>
                <span>${data.formNumber || 'N/A'}</span>
            </div>
            <div class="review-item">
                <strong>Full Name</strong>
                <span>${data.fullName}</span>
            </div>
            <div class="review-item">
                <strong>MNC UID</strong>
                <span>${data.mncUID}</span>
            </div>
            <div class="review-item">
                <strong>MNC Registration Number</strong>
                <span>${data.mncRegistrationNumber}</span>
            </div>
            <div class="review-item">
                <strong>Mobile Number</strong>
                <span>${data.mobileNumber}</span>
            </div>
            <div class="review-item">
                <strong>Payment UTR / Transaction ID</strong>
                <span>${data.paymentUTR}</span>
            </div>
            <div class="review-item">
                <strong>Submitted At</strong>
                <span>${submittedDate}</span>
            </div>
            <div class="review-item">
                <strong>Payment Screenshot</strong>
                <span><img src="/uploads/payments/${data.paymentScreenshot}" style="max-width: 300px; border-radius: 8px; margin-top: 10px;" alt="Payment Screenshot"></span>
            </div>
        </div>
    `;

    // Update download info
    const downloadInfo = document.getElementById('downloadInfo');
    const remainingDownloads = 2 - data.downloadCount;
    
    if (remainingDownloads > 0) {
        downloadInfo.innerHTML = `<p>📥 Downloads remaining: ${remainingDownloads}/2</p>`;
        document.getElementById('downloadBtn').disabled = false;
    } else {
        downloadInfo.innerHTML = `<p style="color: var(--error-color);">❌ Download limit reached (2/2). You can still view your details here anytime.</p>`;
        document.getElementById('downloadBtn').disabled = true;
    }

    // Hide lookup form, show details
    document.getElementById('lookupCard').style.display = 'none';
    document.getElementById('detailsCard').style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show lookup form
function showLookupForm() {
    document.getElementById('lookupCard').style.display = 'block';
    document.getElementById('detailsCard').style.display = 'none';
    currentRegistration = null;
    
    // Clear form
    document.getElementById('lookupForm').reset();
}

// Handle PDF download
async function handleDownload() {
    if (!currentRegistration) {
        showAlert('No registration data found', 'error');
        return;
    }

    if (currentRegistration.downloadCount >= 2) {
        showAlert('Download limit reached. You have already downloaded 2 times.', 'error');
        return;
    }

    const proceed = confirm('Please confirm you will print and carry this form to the workshop. Continue to download PDF?');
    if (!proceed) {
        return;
    }

    try {
        // Increment download count first
        const response = await fetch('/api/registration/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mncUID: currentRegistration.mncUID,
                mobileNumber: currentRegistration.mobileNumber
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update local download count
            currentRegistration.downloadCount = data.downloadCount;
            
            // Generate PDF
            await generatePDF();

            // Update download info
            const remainingDownloads = 2 - data.downloadCount;
            const downloadInfo = document.getElementById('downloadInfo');
            
            if (remainingDownloads > 0) {
                downloadInfo.innerHTML = `<p>📥 Downloads remaining: ${remainingDownloads}/2</p>`;
            } else {
                downloadInfo.innerHTML = `<p style="color: var(--error-color);">❌ Download limit reached (2/2). You can still view your details here anytime.</p>`;
                document.getElementById('downloadBtn').disabled = true;
            }

            showAlert('PDF downloaded successfully!', 'success');
        } else {
            showAlert(data.message || 'Download failed', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        showAlert('Download failed. Please try again.', 'error');
    }
}

// Generate PDF
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const submittedDate = new Date(currentRegistration.submittedAt).toLocaleString('en-IN', {
        dateStyle: 'long',
        timeStyle: 'short'
    });

    // Header
    doc.setFontSize(18);
    doc.setTextColor(95, 37, 159);
    doc.text('SAI CARE GROUP OF INSTITUTES', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('CNE Registration 2025', 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Form Number: ${currentRegistration.formNumber || 'N/A'}`, 105, 38, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Registration Confirmation', 105, 40, { align: 'center' });

    // Draw line
    doc.setDrawColor(95, 37, 159);
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    let yPos = 60;

    // Registration Details
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    // Full Name
    doc.text('Full Name:', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(currentRegistration.fullName, 70, yPos);
    yPos += 15;

    // MNC UID
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('MNC UID:', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(currentRegistration.mncUID, 70, yPos);
    yPos += 15;

    // MNC Registration Number
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('MNC Registration Number:', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(currentRegistration.mncRegistrationNumber, 70, yPos);
    yPos += 15;

    // Mobile Number
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Mobile Number:', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(currentRegistration.mobileNumber, 70, yPos);
    yPos += 15;

    // Payment UTR
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Payment UTR / Transaction ID:', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(currentRegistration.paymentUTR, 70, yPos);
    yPos += 15;

    // Submitted At
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Submitted At:', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(submittedDate, 70, yPos);
    yPos += 20;

    // Payment Screenshot
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Payment Screenshot:', 20, yPos);
    yPos += 10;

    try {
        // Add payment screenshot image
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = `/uploads/payments/${currentRegistration.paymentScreenshot}`;
        
        await new Promise((resolve, reject) => {
            img.onload = () => {
                const imgWidth = 80;
                const imgHeight = (img.height * imgWidth) / img.width;
                
                doc.addImage(img, 'JPEG', 20, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 20;
                resolve();
            };
            img.onerror = () => {
                doc.setFontSize(9);
                doc.setTextColor(200, 0, 0);
                doc.text('Screenshot not available', 20, yPos);
                yPos += 20;
                resolve();
            };
        });
    } catch (error) {
        console.error('Error adding image:', error);
    }

    // Disclaimer
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }

    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(146, 64, 14);
    doc.text('IMPORTANT DISCLAIMER:', 20, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const disclaimerText = 'If MNC Registration Number or MNC UID is incorrect, we are NOT liable for credits not being added to your account.';
    const splitDisclaimer = doc.splitTextToSize(disclaimerText, 170);
    doc.text(splitDisclaimer, 20, yPos);
    yPos += (splitDisclaimer.length * 5) + 10;

    const printNote = 'Please print this form and carry it along with payment proof to the workshop entrance.';
    const splitPrintNote = doc.splitTextToSize(printNote, 170);
    doc.text(splitPrintNote, 20, yPos);
    yPos += (splitPrintNote.length * 5) + 10;

    doc.setDrawColor(245, 158, 11);
    doc.line(20, yPos, 190, yPos);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('© 2025 Sai Care Group of Institutes. All rights reserved.', 105, 285, { align: 'center' });

    // Save PDF
    doc.save(`CNE_Registration_${currentRegistration.mncUID}.pdf`);
}

// Show/hide spinner
function showSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    
    if (show) {
        spinner.classList.add('show');
    } else {
        spinner.classList.remove('show');
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
