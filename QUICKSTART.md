# 🚀 Quick Start Guide

## Start the Application

### Step 1: Start the Server
```powershell
npm start
```

The server will start on: **http://localhost:3000**

### Step 2: Access the Website

**📝 Registration Form:**
http://localhost:3000

**👀 View Registration:**
http://localhost:3000/view-registration

**🔐 Admin Panel:**
http://localhost:3000/admin-login

---

## 🧪 Test Accounts

### Test User 1 (Fresh - Can download 2 times)
- **MNC UID:** MNC2024001
- **Mobile:** 9876543210

### Test User 2 (Downloaded once - 1 download left)
- **MNC UID:** MNC2024002
- **Mobile:** 9876543211

### Test User 3 (Download limit reached)
- **MNC UID:** MNC2024003
- **Mobile:** 9876543212

### Admin Login
- **Username:** saicaregroupofinstitues
- **Password:** bHAGIRATH@2025?.

---

## 📊 What's Included

✅ **10 Mock Registrations** pre-populated
✅ **Registration Counter** showing 490/500 remaining
✅ **Sample Payment Screenshot** (uses PhonePe QR)
✅ **All Features Working** and ready to test

---

## 🎯 Quick Test Flow

1. **View Registration Form**
   - Check registration counter
   - See PhonePe QR code

2. **Test Registration**
   - Fill form with new data
   - Upload payment screenshot
   - Review confirmation popup
   - Submit

3. **Test View Page**
   - Use test credentials above
   - View details
   - Download PDF

4. **Test Admin**
   - Login with admin credentials
   - View dashboard stats
   - Search registrations
   - Download Excel

---

## 🛠️ Useful Commands

### Restart Server (if needed)
```powershell
# Stop server: Ctrl+C in terminal
npm start
```

### Repopulate Mock Data
```powershell
node populate-mock-data.js
```

### Check MongoDB
```powershell
# Connect to MongoDB
mongosh
use saicare_cne_registration
db.registrations.countDocuments()
```

---

## 📱 URLs at a Glance

| Page | URL |
|------|-----|
| Home (Registration) | http://localhost:3000 |
| View Registration | http://localhost:3000/view-registration |
| Admin Login | http://localhost:3000/admin-login |
| Admin Dashboard | http://localhost:3000/admin-dashboard |

---

**🎉 Everything is ready! Start testing!**
