# Deploying Cortex on Azure Ubuntu VM

This guide walks you through deploying Cortex on an Azure Ubuntu VM with Docker and CI/CD via GitHub Actions.

**Two deployment paths:**
- **Quick Start**: HTTP-only deployment (no domain needed) - recommended to start
- **Production**: Add SSL certificate and custom domain

---

## Table of Contents

### Quick Start (HTTP Only)
1. [Prerequisites](#prerequisites)
2. [Create Azure VM](#create-azure-vm)
3. [Configure Networking](#configure-networking)
4. [Connect to VM](#connect-to-vm)
5. [Install Dependencies](#install-dependencies)
6. [Clone and Configure Project](#clone-and-configure-project)
7. [Deploy the Application](#deploy-the-application)
8. [Create Admin User](#create-admin-user)
9. [Set Up CI/CD](#set-up-cicd)

### Production Setup
10. [Adding SSL and Custom Domain](#adding-ssl-and-custom-domain)

### Operations
11. [Maintenance](#maintenance)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Azure account with an active subscription
- GitHub repository with your code
- Azure CLI installed locally (optional, for command-line setup)
- **For SSL setup later**: A domain name you own

---

## Create Azure VM

### Option A: Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** → **Virtual Machine**
3. Configure:
   - **Resource group**: Create new (e.g., `cortex-rg`)
   - **VM name**: `cortex-vm`
   - **Region**: Choose closest to your users
   - **Image**: Ubuntu Server 22.04 LTS
   - **Size**: Standard_B2s (2 vCPU, 4 GB RAM) minimum
   - **Authentication**: Password or SSH key
   - **Username**: `azureuser`
4. Click **Review + Create** → **Create**

### Option B: Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name cortex-rg --location eastus

# Create VM
az vm create \
  --resource-group cortex-rg \
  --name cortex-vm \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --authentication-type password \
  --admin-password 'YourSecurePassword123!'
```

---

## Configure Networking

Open required ports for HTTP, HTTPS, and SSH.

### Azure Portal

1. Go to your VM → **Networking** → **Add inbound port rule**
2. Add rules for:
   - Port 80 (HTTP)
   - Port 22 (SSH) — restrict to your IP for security

### Azure CLI

```bash
# Open HTTP port
az vm open-port --port 80 --resource-group cortex-rg --name cortex-vm --priority 1001
```

### Get Your VM's Public IP

You'll need this to access your application:

```bash
# From Azure Portal: VM → Overview → Public IP address

# Or using Azure CLI:
az vm show -d -g cortex-rg -n cortex-vm --query publicIps -o tsv
```

Save this IP - you'll use it to access your application at `http://<VM_IP>`

---

## Connect to VM

```bash
ssh azureuser@<VM_PUBLIC_IP>
# or
ssh azureuser@yourdomain.com
```

---

## Install Dependencies

Run these commands on the VM:

### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add user to docker group (avoids sudo for docker commands)
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify installation
docker --version
```

### Install Docker Compose

```bash
sudo apt install -y docker-compose-plugin

# Verify installation
docker compose version
```

### Install Git

```bash
sudo apt install -y git
```

---

## Clone and Configure Project

### Clone Repository

```bash
cd ~
git clone https://github.com/yourusername/cortex.git
cd cortex
```

### Configure Environment Variables

```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit with your values
nano backend/.env
```

**Required environment variables:**

```env
# Application
APP_NAME=Cortex API
JWT_SECRET_KEY=generate-a-secure-random-string-at-least-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database (keep as-is for Docker setup)
DATABASE_URL=postgresql://cortex:cortex@db:5432/cortex

# CORS - allow access from VM IP (update with your VM's public IP)
CORS_ORIGINS=http://<YOUR_VM_IP>

# LLM Settings
EMBEDDINGS_API_KEY=your-embeddings-api-key
EMBEDDINGS_MODEL=text-embedding-3-small
EMBEDDINGS_BASE_URL=https://models.inference.ai.azure.com
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1
```

**Generate a secure JWT secret:**

```bash
openssl rand -hex 32
```

Copy the output and paste it as your `JWT_SECRET_KEY` value.

### Verify Nginx Configuration

The nginx configuration should already be set for HTTP-only access:

```bash
cat nginx/nginx.conf
```

Should show:

```nginx
events { worker_connections 1024; }

http {
    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

✅ This configuration accepts connections on any IP address (perfect for testing with VM IP)

---

## Deploy the Application

### Build and Start Services

```bash
cd ~/cortex
docker compose up -d --build
```

### Verify Deployment

```bash
# Check all containers are running
docker compose ps

# Should see all services as "Up":
# - nginx
# - frontend
# - backend
# - db
```

**Check logs if any service is down:**

```bash
docker compose logs -f
```

### Access Your Application

Open your browser and go to:

```
http://<YOUR_VM_IP>
```

Replace `<YOUR_VM_IP>` with your actual VM public IP address.

You should see the Cortex homepage! 🎉

---

## Create Admin User

After the application is running, create the first admin user:

```bash
docker compose exec backend uv run python main.py create-admin \
  --name "Admin" \
  --email admin@yourdomain.com \
  --password "your-secure-password"
```

**Note**: The backend uses `uv` for dependency management, so commands must be run with `uv run`.

---

## Set Up CI/CD (Optional)

Automated deployments via GitHub Actions on push to `main`.

### Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name   | Value                        |
| ------------- | ---------------------------- |
| `VM_HOST`     | Your VM's public IP or domain |
| `VM_USER`     | `azureuser`                  |
| `VM_PASSWORD` | Your VM password             |

### Workflow File

The workflow file is already at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure VM

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to VM
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USER }}
          password: ${{ secrets.VM_PASSWORD }}
          script: |
            cd ~/cortex
            git pull origin main
            docker compose down
            docker compose up -d --build
```

### Test CI/CD

Push a commit to `main` and verify:

1. Go to **Actions** tab in GitHub
2. Watch the workflow run
3. Verify the changes are deployed on your VM

---

## Adding SSL and Custom Domain

Once you have a domain name and want to enable HTTPS, follow these steps.

### Prerequisites

- A domain name you own (e.g., `cortex.yourdomain.com`)
- Domain DNS pointing to your VM's public IP

### Step 1: Configure DNS

Add an **A record** in your DNS provider:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `@` or `cortex` | Your VM's Public IP | 300 |

Wait a few minutes for DNS propagation. Verify with:

```bash
nslookup yourdomain.com
```

### Step 2: Open HTTPS Port

```bash
# Azure CLI
az vm open-port --port 443 --resource-group cortex-rg --name cortex-vm --priority 1003

# Or in Azure Portal:
# VM → Networking → Add inbound port rule → Port 443
```

### Step 3: Install Certbot

On your VM:

```bash
sudo apt install -y certbot
```

### Step 4: Obtain SSL Certificate

Stop the nginx container first (certbot needs port 80):

```bash
cd ~/cortex
docker compose stop nginx
```

Get the certificate:

```bash
sudo certbot certonly --standalone -d yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Certificate will be saved to /etc/letsencrypt/live/yourdomain.com/
```

### Step 5: Update Nginx Configuration

```bash
nano ~/cortex/nginx/nginx.conf
```

Replace the contents with:

```nginx
events { worker_connections 1024; }

http {
    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl;
        server_name yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

        # Modern SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

**Important**: Replace `yourdomain.com` with your actual domain in 3 places.

### Step 6: Update docker-compose.yml

Add the SSL certificates volume:

```bash
nano ~/cortex/docker-compose.yml
```

Update the nginx service:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro  # Add this line
    depends_on:
      - frontend
    restart: unless-stopped
```

### Step 7: Update CORS Settings

Update backend environment to allow your domain:

```bash
nano ~/cortex/backend/.env
```

Change:

```env
CORS_ORIGINS=https://yourdomain.com
```

### Step 8: Restart Services

```bash
docker compose up -d --build
```

### Step 9: Verify HTTPS

Visit your site:

```
https://yourdomain.com
```

You should see a secure padlock 🔒 in the browser!

### Step 10: Set Up Auto-Renewal

Certbot automatically installs a renewal timer. Verify:

```bash
sudo certbot renew --dry-run
```

To manually renew when needed:

```bash
sudo certbot renew
docker compose restart nginx
```

### Troubleshooting SSL

**Certificate not found:**
```bash
# Check certificate exists
sudo ls /etc/letsencrypt/live/yourdomain.com/
```

**DNS not resolving:**
```bash
# Test DNS
nslookup yourdomain.com

# Ensure it points to your VM IP
```

**Port 80/443 not accessible:**
```bash
# Check Azure NSG rules
az vm show -d -g cortex-rg -n cortex-vm

# Or in Portal: VM → Networking
```

---

## Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
```

### Update Application

```bash
cd ~/cortex
git pull origin main
docker compose down
docker compose up -d --build
```

### Database Backup

```bash
# Backup
docker compose exec db pg_dump -U cortex cortex > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20240101.sql | docker compose exec -T db psql -U cortex cortex
```

### Renew SSL Certificate (if using SSL)

Certificates auto-renew, but to force renewal:

```bash
sudo certbot renew
docker compose restart nginx
```

### Monitor Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker resources
docker system prune -af
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Check container status
docker compose ps -a
```

### Database Connection Issues

```bash
# Verify database is healthy
docker compose exec db pg_isready -U cortex -d cortex

# Check database logs
docker compose logs db
```

### SSL Certificate Issues (if using SSL)

```bash
# Verify certificate exists
sudo ls -la /etc/letsencrypt/live/yourdomain.com/

# Check certificate expiry
sudo certbot certificates

# Re-obtain certificate (stop nginx first)
docker compose stop nginx
sudo certbot certonly --standalone -d yourdomain.com --force-renewal
docker compose start nginx
```

### 502 Bad Gateway

Usually means backend isn't running:

```bash
# Check backend status
docker compose ps backend
docker compose logs backend

# Restart backend
docker compose restart backend
```

### Permission Denied for Docker

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply changes (or logout/login)
newgrp docker
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443

# Stop the process or change the port in docker-compose.yml
```

---

## Security Recommendations

1. **Restrict SSH Access**: In Azure NSG, limit port 22 to your IP only
2. **Use SSH Keys**: More secure than passwords
3. **Change Default DB Password**: Update `POSTGRES_PASSWORD` in docker-compose.yml
4. **Enable Firewall**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```
5. **Install Fail2ban**:
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   ```
6. **Regular Updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Azure VM (Ubuntu)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Nginx (SSL Termination)               │  │
│  │                   Ports 80, 443                       │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Frontend (React + Nginx)                 │  │
│  │                Internal Port 80                       │  │
│  │         Proxies /api requests to Backend             │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Backend (FastAPI)                     │  │
│  │                 Internal Port 8000                    │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              PostgreSQL + pgvector                    │  │
│  │                 Internal Port 5432                    │  │
│  │              Volume: db_data (persistent)            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Task                    | Command                                      |
| ----------------------- | -------------------------------------------- |
| Start services          | `docker compose up -d`                       |
| Stop services           | `docker compose down`                        |
| Rebuild and start       | `docker compose up -d --build`               |
| View logs               | `docker compose logs -f`                     |
| Check status            | `docker compose ps`                          |
| Restart service         | `docker compose restart <service>`           |
| Enter container         | `docker compose exec <service> sh`           |
| Database backup         | `docker compose exec db pg_dump -U cortex cortex > backup.sql` |
| Renew SSL               | `sudo certbot renew`                         |
| Update code             | `git pull && docker compose up -d --build`   |
