#!/bin/bash
# 🚀 DEPLOY ON EC2 - RUN THIS ON YOUR EC2 INSTANCE

echo ""
echo "=== DEPLOYING CNE APPLICATION ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if deployment zip exists
if [ ! -f ~/cne-deployment.zip ]; then
    echo "❌ Deployment package not found!"
    echo "Please run 02-upload-to-ec2.ps1 first"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x if not installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Install MongoDB if not installed
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}Installing MongoDB...${NC}"
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi

echo -e "${GREEN}✅ MongoDB is running${NC}"

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing Nginx...${NC}"
    sudo apt install -y nginx
fi

# Create app directory
echo -e "${YELLOW}Setting up application...${NC}"
if [ -d ~/cne-app ]; then
    echo "Backing up old version..."
    mv ~/cne-app ~/cne-app-backup-$(date +%Y%m%d-%H%M%S)
fi

mkdir -p ~/cne-app
cd ~/cne-app

# Extract deployment package
echo -e "${YELLOW}Extracting application files...${NC}"
unzip -q ~/cne-deployment.zip

# Create uploads directory
mkdir -p uploads/payments
chmod 755 uploads/payments

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --production

# Generate session secret
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Create .env file
echo -e "${YELLOW}Creating environment configuration...${NC}"
cat > .env << EOF
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/saicaregroup_cne
SESSION_SECRET=$SESSION_SECRET
ADMIN_USERNAME=saicaregroupofinstitues
ADMIN_PASSWORD=bHAGIRATH@2025?.
MAX_REGISTRATIONS=500
MAX_DOWNLOADS_PER_USER=2
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads/payments
EOF

echo -e "${GREEN}✅ Environment configured${NC}"

# Stop existing PM2 process if running
pm2 stop cne-app 2>/dev/null || true
pm2 delete cne-app 2>/dev/null || true

# Start application with PM2
echo -e "${YELLOW}Starting application...${NC}"
pm2 start server.js --name cne-app
pm2 save
pm2 startup | grep "sudo" | bash

echo -e "${GREEN}✅ Application started${NC}"

# Configure Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/cne-app > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads {
        alias /home/ubuntu/cne-app/uploads;
    }

    location /assest {
        alias /home/ubuntu/cne-app/assest;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/cne-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
echo "y" | sudo ufw enable

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your application is now running!"
echo ""
echo "🌐 Access your site at:"
echo "   http://$(curl -s ifconfig.me)"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status          - Check app status"
echo "   pm2 logs cne-app    - View logs"
echo "   pm2 restart cne-app - Restart app"
echo "   pm2 stop cne-app    - Stop app"
echo ""
echo "🗄️  MongoDB:"
echo "   sudo systemctl status mongod"
echo "   mongosh"
echo ""
