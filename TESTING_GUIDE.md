# 🧪 Testing Guide - CNE Registration System

## ✅ Quick Testing Checklist

### 1. Registration Form Testing

**URL:** http://localhost:3000

**Test Cases:**

✅ **TC1: View Registration Counter**
- Should show "Registrations Remaining: 490/500"
- Counter updates after each registration

✅ **TC2: Form Validation**
- Try submitting empty form → Should show validation errors
- Enter invalid mobile (9 digits) → Should show error
- Try uploading > 5MB file → Should show error
- Try uploading .txt file → Should reject

✅ **TC3: Successful Registration**
- Fill all fields:
  - Full Name: Test User
  - MNC Registration Number: REG/TEST/001
  - MNC UID: MNCTEST001
  - Mobile: 8888888888
  - Payment UTR: TESTUTר234567
- Upload payment screenshot (< 5MB, JPG/PNG)
- Click Submit
- Review popup appears with disclaimer
- Click "Confirm & Submit"
- Success message appears
- Redirects to view page

✅ **TC4: Duplicate Registration**
- Try registering with same MNC UID again
- Should show error: "This MNC UID is already registered"

---

### 2. View Registration Testing

**URL:** http://localhost:3000/view-registration

**Test Users Available:**

| MNC UID | Mobile | Downloads Left |
|---------|--------|----------------|
| MNC2024001 | 9876543210 | 2/2 |
| MNC2024002 | 9876543211 | 1/2 |
| MNC2024003 | 9876543212 | 0/2 (Full) |

✅ **TC5: View Registration**
- Enter MNC UID: `MNC2024001`
- Enter Mobile: `9876543210`
- Click "View Registration"
- Should display all details
- Should show "Downloads remaining: 2/2"

✅ **TC6: Download PDF**
- Use MNC2024001 credentials
- Click "Download PDF"
- PDF should download
- Counter updates to "Downloads remaining: 1/2"
- Download again → Counter shows "0/2"
- Try downloading 3rd time → Should show error

✅ **TC7: Download Limit Reached**
- Use MNC UID: `MNC2024003`
- Mobile: `9876543212`
- Should show "Download limit reached"
- Download button should be disabled
- Can still view details

✅ **TC8: Invalid Lookup**
- Enter wrong MNC UID or Mobile
- Should show "No registration found"

---

### 3. Admin Panel Testing

**URL:** http://localhost:3000/admin-login

**Credentials:**
- **Username:** `saicaregroupofinstitues`
- **Password:** `bHAGIRATH@2025?.`

✅ **TC9: Admin Login**
- Try wrong password → Should show "Invalid credentials"
- Enter correct credentials
- Should redirect to dashboard

✅ **TC10: Dashboard Statistics**
- Should show:
  - Total Registrations: 10
  - Remaining Slots: 490
  - Capacity Filled: 2.00%

✅ **TC11: View All Registrations**
- Should display table with 10 mock registrations
- Columns: S.No, Name, MNC UID, Mobile, etc.

✅ **TC12: Search Functionality**
- Search for "Priya" → Should filter results
- Search for "MNC2024001" → Should show matching record
- Search for "9876543210" → Should show matching record

✅ **TC13: View Individual Details**
- Click "View" button on any registration
- Modal should open with full details
- Should show payment screenshot
- Click "Close" to dismiss

✅ **TC14: Excel Download**
- Click "Download Excel" button
- Excel file should download
- Open file and verify:
  - All 10 registrations present
  - All columns properly formatted
  - Payment screenshot filenames included

✅ **TC15: Admin Logout**
- Click "Logout" button
- Should redirect to login page
- Try accessing `/admin-dashboard` without login
- Should redirect back to login

---

### 4. Registration Limit Testing

**Test when approaching 500 registrations:**

✅ **TC16: Registration Full**
- Manually update limit in `.env`:
  ```
  MAX_REGISTRATIONS=10
  ```
- Restart server
- Try new registration
- Should show "Registration Closed - All 500 seats filled"
- Form should be disabled

---

### 5. Security Testing

✅ **TC17: File Upload Security**
- Try uploading .exe file → Should reject
- Try uploading > 5MB image → Should reject
- Upload valid image → Should accept

✅ **TC18: Session Security**
- Login to admin panel
- Wait 30 minutes (or change session timeout)
- Try accessing admin routes
- Should require re-login

✅ **TC19: API Rate Limiting**
- Make > 100 requests in 15 minutes
- Should get rate limit error

---

### 6. Mobile Responsiveness Testing

✅ **TC20: Mobile View**
- Open in mobile browser (or Chrome DevTools mobile mode)
- Test registration form on mobile
- Test view page on mobile
- Test admin panel on mobile
- All should be fully responsive

---

### 7. PDF Generation Testing

✅ **TC21: PDF Content**
- Download PDF for any user
- Verify PDF contains:
  - Institute header
  - Full Name
  - MNC UID
  - MNC Registration Number
  - Mobile Number
  - Payment UTR
  - Submitted timestamp
  - Payment screenshot
  - Disclaimer at bottom

---

## 🔧 Testing Tools

### Browser DevTools
- Press F12 to open
- Check Console for errors
- Check Network tab for API calls

### MongoDB Compass (Optional)
- Connect to: `mongodb://localhost:27017`
- Database: `saicare_cne_registration`
- Collection: `registrations`
- View/modify data directly

---

## 🐛 Common Issues & Solutions

### Issue: MongoDB connection error
**Solution:**
```powershell
# Check if MongoDB is running
mongod --version

# Start MongoDB service
net start MongoDB
```

### Issue: Port 3000 already in use
**Solution:**
```powershell
# Change PORT in .env
PORT=3001
```

### Issue: Payment screenshots not showing
**Solution:**
- Check `uploads/payments/` folder exists
- Run mock data script again to create sample

### Issue: Admin can't login
**Solution:**
- Verify credentials exactly:
  - Username: `saicaregroupofinstitues`
  - Password: `bHAGIRATH@2025?.`
- Check caps lock
- Clear browser cache/cookies

---

## 📊 Expected Results Summary

### Working Features:
1. ✅ Registration form with validation
2. ✅ Payment QR code display
3. ✅ File upload (payment screenshot)
4. ✅ Confirmation popup with disclaimer
5. ✅ Registration counter (500 limit)
6. ✅ View registration (MNC UID + Mobile)
7. ✅ PDF download (2 times limit)
8. ✅ Admin authentication
9. ✅ Admin dashboard with stats
10. ✅ Search/filter registrations
11. ✅ Excel bulk export
12. ✅ Responsive design
13. ✅ Security features

---

## 🎯 Performance Metrics

- Page load: < 2 seconds
- Form submission: < 3 seconds
- PDF generation: < 5 seconds
- Excel export: < 10 seconds (for 500 records)
- Database queries: < 500ms

---

## 📝 Test Report Template

```
Testing Date: _____________
Tester Name: _____________

Test Cases Passed: ___/21
Test Cases Failed: ___/21

Issues Found:
1. ______________________
2. ______________________

Notes:
_________________________
_________________________
```

---

**Happy Testing! 🚀**
