# SAI CARE GROUP OF INSTITUTES - CNE Registration System

A comprehensive registration management system for CNE (Continuing Nursing Education) with payment verification, PDF generation, and admin panel.

## 🌟 Features

### User Features
- ✅ Online registration form with real-time validation
- 📱 PhonePe QR code payment integration
- 📄 PDF download with 2-download limit
- 🔍 View registration anytime using MNC UID + Mobile
- 📊 Real-time registration counter (500 slots)
- 🔒 Secure file upload for payment screenshots

### Admin Features
- 🔐 Secure admin login
- 📈 Dashboard with statistics
- 🔎 Search and filter registrations
- 📥 Bulk Excel export
- 👁️ View individual registration details
- 📸 View payment screenshots

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **PDF Generation:** jsPDF, html2canvas
- **Excel Export:** XLSX
- **Security:** express-session, bcrypt, rate-limiting

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)

### Setup Steps

1. **Install Dependencies**
   ```powershell
   npm install
   ```

2. **Quick Start (EASIEST WAY)**
   
   **Just double-click:** `START.bat`
   
   This will:
   - ✅ Start MongoDB (if needed)
   - ✅ Start Node.js server
   - ✅ Open website automatically
   
   See [START_INSTRUCTIONS.md](START_INSTRUCTIONS.md) for details.

3. **Manual Start** (Alternative)
   
   Start MongoDB (if using local MongoDB):
   ```powershell
   mongod
   ```
   
   Start Server:
   ```powershell
   npm start
   ```
   
   Or for development with auto-reload:
   ```powershell
   npm run dev
   ```

4. **Access Application**
   - Registration Form: http://localhost:3000
   - View Registration: http://localhost:3000/view-registration
   - Admin Login: http://localhost:3000/admin-login

## 🔑 Admin Credentials

- **Username:** `saicaregroupofinstitues`
- **Password:** `bHAGIRATH@2025?.`

## 📁 Project Structure

```
CNE/
├── assest/
│   └── phonepe-qr.jpg          # PhonePe QR code
├── models/
│   └── Registration.js         # MongoDB schema
├── routes/
│   ├── registration.js         # Registration APIs
│   └── admin.js                # Admin APIs
├── middleware/
│   └── auth.js                 # Authentication
├── public/
│   ├── index.html              # Registration form
│   ├── view-registration.html  # View page
│   ├── admin-login.html        # Admin login
│   ├── admin-dashboard.html    # Admin dashboard
│   ├── css/
│   │   └── styles.css          # All styles
│   └── js/
│       ├── registration.js     # Form logic
│       ├── view-registration.js # View logic
│       └── admin.js            # Admin logic
├── uploads/
│   └── payments/               # Payment screenshots
├── server.js                   # Express server
├── package.json
└── .env                        # Configuration
```

## 🚀 Usage Guide

### For Users

1. **Register:**
   - Visit homepage
   - Fill all required fields
   - Upload payment screenshot
   - Review details in confirmation popup
   - Confirm and submit

2. **View Registration:**
   - Go to "View Registration" page
   - Enter MNC UID and Mobile Number
   - View details
   - Download PDF (max 2 times)

### For Admin

1. **Login:**
   - Visit `/admin-login`
   - Enter credentials
   - Access dashboard

2. **Manage Registrations:**
   - View all registrations
   - Search by name, MNC UID, mobile
   - View individual details
   - Download Excel report

## 🔒 Security Features

- ✅ Input validation (client & server)
- ✅ File upload restrictions (type, size)
- ✅ Rate limiting (100 req/15min)
- ✅ Session-based authentication
- ✅ Secure password handling
- ✅ CORS configuration
- ✅ SQL injection prevention (MongoDB)

## 📊 Database Schema

```javascript
{
  mncUID: String (unique, indexed),
  fullName: String,
  mncRegistrationNumber: String,
  mobileNumber: String (10 digits),
  paymentUTR: String,
  paymentScreenshot: String (filename),
  downloadCount: Number (0-2),
  submittedAt: Date,
  ipAddress: String
}
```

## 🎨 Design Features

- 📱 Fully responsive design
- 🎨 Modern gradient UI
- ✨ Smooth animations
- ⚡ Fast loading
- 🌈 Professional color scheme

## 🐛 Troubleshooting

### MongoDB Connection Error
```powershell
# Check if MongoDB is running
mongod --version

# Start MongoDB service
net start MongoDB
```

### Port Already in Use
```powershell
# Change PORT in .env file
PORT=3001
```

### File Upload Errors
- Check `uploads/payments/` folder exists
- Verify file size < 5MB
- Only JPEG, JPG, PNG allowed

## 📝 API Endpoints

### Registration APIs
- `GET /api/registration/count` - Get registration count
- `POST /api/registration/submit` - Submit new registration
- `POST /api/registration/view` - View registration
- `POST /api/registration/download` - Increment download count

### Admin APIs
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/check-session` - Check session
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/registrations` - Get all registrations
- `GET /api/admin/download-excel` - Download Excel

## 🔄 Updates & Maintenance

### Adding More Slots
Edit `.env`:
```
MAX_REGISTRATIONS=1000
```

### Changing Admin Password
Edit `.env`:
```
ADMIN_PASSWORD=NewPassword@2025
```

## 📞 Support

For issues or questions, contact Sai Care Group of Institutes.

## 📄 License

© 2025 Sai Care Group of Institutes. All rights reserved.

---

**Built with ❤️ for Sai Care Group of Institutes**
