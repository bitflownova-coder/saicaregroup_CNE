# 🚀 Start Application Files

## Quick Start Options

I've created **TWO** startup files for your convenience:

### Option 1: START.bat (Recommended - Easiest)
**📁 File:** `START.bat`

**How to use:**
1. **Double-click** `START.bat` file
2. That's it! Everything starts automatically

**What it does:**
- ✅ Checks and starts MongoDB service
- ✅ Starts Node.js server in new window
- ✅ Waits 5 seconds for server initialization
- ✅ Opens website in your default browser
- ✅ Shows all URLs and admin credentials
- ✅ Keep window open to keep server running

**To stop:**
- Press any key in the START.bat window, or
- Close the "CNE Server" window, or
- Press `Ctrl+C` in server window

---

### Option 2: START.ps1 (PowerShell)
**📁 File:** `START.ps1`

**How to use:**
1. Right-click `START.ps1`
2. Select "Run with PowerShell"

**What it does:**
- Same as START.bat but with colored output
- More detailed status messages
- Better error handling

**To stop:**
- Close the server window that opens

---

## 🎯 What Happens When You Start

1. **MongoDB Check** - Verifies MongoDB is running
2. **Server Start** - Launches Node.js/Express server
3. **Auto-Open Browser** - Opens http://localhost:3000
4. **Display Info** - Shows all URLs and credentials

---

## 📱 URLs Available After Starting

| Page | URL |
|------|-----|
| 🏠 Registration Form | http://localhost:3000 |
| 👁️ View Registration | http://localhost:3000/view-registration |
| 🔐 Admin Login | http://localhost:3000/admin-login |

---

## 🔑 Admin Credentials (Shown on Start)

- **Username:** `saicaregroupofinstitues`
- **Password:** `bHAGIRATH@2025?.`

---

## ⚠️ Troubleshooting

### If MongoDB doesn't start:
```powershell
# Start MongoDB manually
net start MongoDB
```

### If port 3000 is already in use:
```powershell
# Kill process using port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### If PowerShell script won't run:
```powershell
# Enable script execution (run PowerShell as Administrator)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 💡 Tips

1. **Keep the server window open** while using the website
2. **Bookmark the URLs** for easy access
3. **Check the server window** for error messages if something doesn't work
4. **Use START.bat** - it's the easiest option!

---

## 🎉 Ready to Go!

Just **double-click START.bat** and you're ready to start registering students!

The website will automatically open in your browser at:
**http://localhost:3000**

---

**Need help?** Check the [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md)
