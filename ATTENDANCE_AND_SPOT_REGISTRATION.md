# QR-Based Attendance & Spot Registration System

## New Features Added

### 1. QR-Based Attendance System ✅

A secure, real-time attendance marking system using rotating QR codes.

#### Features:
- **Rotating QR Codes**: QR code refreshes every 5 seconds for security
- **Workshop Selection**: Support for multiple workshops
- **Real-time Stats**: Live tracking of Applied vs Present status
- **Student Self-Service**: Students scan QR and enter their MNC Registration Number
- **Admin Portal Integration**: Attendance status visible in admin dashboard

#### Access:
- **Portal URL**: `http://localhost:3000/attendance-login.html`
- **Default Credentials**:
  - Username: `attendance`
  - Password: `attend123`

#### How It Works:
1. **Attendance Staff Login** → Select Workshop → Display QR Code
2. **QR Code Auto-Refreshes** every 5 seconds with new token
3. **Students Scan QR** → Enter MNC Registration Number → Attendance Marked
4. **Real-time Updates** in attendance portal and admin dashboard
5. **Status Changes**: Registration status changes from "Applied" to "Present"

#### Security:
- QR tokens valid for only 5 seconds
- One attendance per student per workshop
- Device fingerprinting for audit trail
- Session-based authentication for attendance portal

---

### 2. Spot Registration System 🎫

On-site registration system for walk-in participants during workshops.

#### Features:
- **QR Code Access**: Unique QR code per workshop for spot registration
- **Limit Control**: Admin sets max spot registration limit per workshop
- **Real-time Tracking**: Shows spots remaining
- **Full Registration Flow**: Same as online (name, mobile, MNC UID, payment)
- **Distinct Badge**: Spot registrations marked with "Spot" badge

#### Access:
- **Portal URL**: `http://localhost:3000/spot-login.html`
- **Default Credentials**:
  - Username: `spot`
  - Password: `spot123`

#### How It Works:
1. **Admin Enables Spot Registration** for a workshop (in admin panel)
2. **Sets Spot Limit** (e.g., 50 spots)
3. **Spot Staff Login** → Select Workshop → Display QR Code
4. **Walk-in Participants Scan QR** → Fill registration form
5. **System Tracks Spots** and prevents over-registration
6. **QR Code Valid** for 24 hours or until manually disabled

#### Spot Registration Settings:
Admin can configure per workshop:
- Enable/Disable spot registration
- Set maximum spot registration limit
- View current spot registration count
- Spots count toward total workshop capacity

---

### 3. Enhanced Admin Dashboard 📊

#### New Statistics:
- **Present Count**: Students who marked attendance (Green badge)
- **Applied Count**: Registered but not present (Orange badge)
- **Spot Registration Count**: Number of on-site registrations (Purple badge)
- **Attendance Percentage**: Real-time attendance rate

#### Registration Status Badges:
- **Applied** (Orange): ○ Applied - Registered but attendance not marked
- **Present** (Green): ✓ Present - Attendance successfully marked
- **Online** (Blue): Registration type - Online registration
- **Spot** (Purple): Registration type - Spot/On-site registration

---

## Database Schema Changes

### Workshop Model Updates:
```javascript
{
  // ... existing fields ...
  
  // Spot Registration Fields
  spotRegistrationEnabled: Boolean (default: false),
  spotRegistrationLimit: Number (default: 0),
  currentSpotRegistrations: Number (default: 0),
  spotRegistrationQRToken: String,
  spotRegistrationTokenExpiry: Date
}
```

### Registration Model Updates:
```javascript
{
  // ... existing fields ...
  
  registrationType: {
    type: String,
    enum: ['online', 'spot'],
    default: 'online'
  },
  attendanceStatus: {
    type: String,
    enum: ['applied', 'present'],
    default: 'applied'
  }
}
```

### New Attendance Model:
```javascript
{
  workshopId: ObjectId (ref: Workshop),
  registrationId: ObjectId (ref: Registration),
  mncUID: String,
  mncRegistrationNumber: String,
  studentName: String,
  qrToken: String,
  markedAt: Date,
  ipAddress: String,
  userAgent: String,
  deviceFingerprint: String
}
```

---

## API Endpoints

### Attendance Routes (`/api/attendance`)
- `POST /login` - Attendance portal login
- `GET /check-session` - Check authentication
- `POST /logout` - Logout
- `GET /workshops` - Get workshops for attendance
- `GET /qr-token/:workshopId` - Generate new QR token (5-sec validity)
- `POST /scan` - Mark attendance via QR scan
- `GET /stats/:workshopId` - Get attendance statistics
- `GET /workshop/:workshopId` - Get all attendance records
- `GET /student/:workshopId/:mncUID` - Check student attendance status

### Spot Registration Routes (`/api/spot-registration`)
- `POST /login` - Spot registration portal login
- `GET /check-session` - Check authentication
- `POST /logout` - Logout
- `GET /workshops` - Get workshops with spot registration enabled
- `GET /qr-token/:workshopId` - Get/generate spot registration QR token
- `POST /verify-token` - Verify spot registration token (public)
- `POST /submit` - Submit spot registration (public)
- `GET /stats/:workshopId` - Get spot registration statistics

### Admin Workshop Updates (`/api/admin/workshops`)
- `PUT /:id/spot-settings` - Update spot registration settings

---

## Setup Instructions

### 1. Environment Variables
Add to your `.env` file:
```env
# Attendance Portal Credentials
ATTENDANCE_USERNAME=attendance
ATTENDANCE_PASSWORD=attend123

# Spot Registration Portal Credentials
SPOT_REGISTRATION_USERNAME=spot
SPOT_REGISTRATION_PASSWORD=spot123
```

### 2. Install Dependencies
No additional dependencies needed - uses existing packages.

### 3. Start Server
```bash
npm start
```

---

## Usage Guide

### For Attendance Staff:

1. **Login**: Navigate to `/attendance-login.html`
2. **Select Workshop**: Choose the workshop from dropdown
3. **Display QR**: Show the QR code on screen (auto-refreshes every 5 seconds)
4. **Monitor**: Watch real-time attendance count and recent attendees
5. **Stats**: View total registrations, present count, and percentage

### For Spot Registration Staff:

1. **Admin First**: Admin must enable spot registration for the workshop
2. **Login**: Navigate to `/spot-login.html`
3. **Select Workshop**: Choose workshop with spot registration enabled
4. **Display QR**: Show the QR code for participants to scan
5. **Monitor**: Watch remaining spots in real-time
6. **Full Banner**: System shows warning when spots are full

### For Students (Attendance):

1. **Scan QR Code**: Use mobile device to scan the displayed QR
2. **Enter MNC Number**: Input your MNC Registration Number (e.g., XII-12345)
3. **Submit**: Click "Mark My Attendance"
4. **Confirmation**: See success message with your name and timestamp

### For Walk-in Participants (Spot Registration):

1. **Scan QR Code**: Scan the spot registration QR code
2. **Fill Form**: Complete all required fields:
   - Full Name
   - MNC Registration Number
   - Mobile Number (10 digits)
   - Payment UTR/Reference
   - Upload Payment Screenshot
3. **Submit**: Complete registration
4. **Receive Form Number**: Get confirmation with form number and MNC UID

### For Admin:

1. **Workshop Management**: Enable/disable spot registration per workshop
2. **Set Limits**: Configure spot registration limits
3. **View Stats**: Monitor attendance and spot registration in real-time
4. **Dashboard**: See color-coded badges for registration status:
   - **Green** = Present (attended)
   - **Orange** = Applied only
   - **Blue** = Online registration
   - **Purple** = Spot registration

---

## Security Features

### Attendance System:
- ✅ QR tokens expire every 5 seconds
- ✅ One attendance per student per workshop
- ✅ Device fingerprinting for audit
- ✅ Session-based authentication
- ✅ IP address logging

### Spot Registration:
- ✅ Token-based access (24-hour validity)
- ✅ Limit enforcement (cannot exceed spot limit)
- ✅ Duplicate prevention (one registration per MNC UID per workshop)
- ✅ File upload validation (5MB limit, image/PDF only)
- ✅ Session-based admin portal

---

## Troubleshooting

### QR Code Not Refreshing:
- Check browser console for errors
- Ensure JavaScript is enabled
- Verify network connectivity

### Attendance Not Marking:
- Ensure QR code is current (refreshed within 5 seconds)
- Verify MNC Registration Number is exact match
- Check student is registered for the workshop

### Spot Registration Full:
- Admin can increase spot limit in admin panel
- Or disable spot registration to prevent further submissions

### Stats Not Showing:
- Select a workshop from the dropdown
- Ensure workshop has registrations
- Check API endpoints are accessible

---

## File Structure

```
saicaregroup_CNE/
├── models/
│   ├── Attendance.js           (NEW - Attendance tracking)
│   ├── Workshop.js             (UPDATED - Spot registration fields)
│   └── Registration.js         (UPDATED - Type & status fields)
├── routes/
│   ├── attendance.js           (NEW - Attendance system)
│   ├── spotRegistration.js     (NEW - Spot registration)
│   └── adminWorkshop.js        (UPDATED - Spot settings endpoint)
├── public/
│   ├── attendance-login.html   (NEW - Attendance login)
│   ├── attendance-portal.html  (NEW - Attendance portal)
│   ├── attendance-scan.html    (NEW - Student scan page)
│   ├── spot-login.html         (NEW - Spot login)
│   ├── spot-portal.html        (NEW - Spot portal)
│   ├── spot-register.html      (NEW - Spot registration form)
│   ├── admin-dashboard.html    (UPDATED - Added stats & badges)
│   └── js/
│       ├── attendance-portal.js  (NEW - Attendance portal logic)
│       ├── spot-portal.js        (NEW - Spot portal logic)
│       └── admin.js              (UPDATED - Display badges)
└── server.js                   (UPDATED - New routes registered)
```

---

## Default Credentials Summary

### Admin Portal
- URL: `/admin-login.html`
- Username: `admin`
- Password: `admin123`

### Attendance Portal
- URL: `/attendance-login.html`
- Username: `attendance`
- Password: `attend123`

### Spot Registration Portal
- URL: `/spot-login.html`
- Username: `spot`
- Password: `spot123`

**⚠️ IMPORTANT**: Change all default passwords in production!

---

## Support

For issues or questions, refer to:
- Main README.md
- DEPLOYMENT_GUIDE.md
- Check browser console for error messages
- Verify MongoDB connection
- Ensure all dependencies are installed

---

## Version

**Version**: 2.0.0  
**Date**: January 2026  
**Features**: QR-Based Attendance + Spot Registration System
