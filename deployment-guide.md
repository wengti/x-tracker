# X-Tracker EC2 Deployment Guide

## Instance Specs

| Setting | Value | Reason |
|---|---|---|
| AMI | Ubuntu 26.04 LTS | Latest LTS |
| Instance type | **t3.medium** (2 vCPU, 4GB RAM) | CGO compilation needs 4GB or it hangs |
| Storage | **24GB** | Frontend `npm run build` exhausts 8GB default |
| Key pair | `x_tracker_key.pem` | Your key |

> **Free tier alternative:** `c7i-flex.large` (2 vCPU, 4GB RAM) is also free-tier-eligible on some accounts. Check **Billing → Free Tier** in your AWS console to confirm before using it — if not covered, it costs ~$0.088/hr.

**Security group inbound rules:**

| Type | Port | Source |
|---|---|---|
| SSH | 22 | My IP |
| HTTP | 80 | Anywhere (0.0.0.0/0) |

## Architecture

```
Internet :80
    └── Nginx
         ├── /auth/, /parts, /matches/, /profile/bey, /stats/, /ping
         │       └── Go/Gin backend :8080
         └── everything else
                 └── Next.js frontend :3000

Redis :6379  (local only, not exposed externally)
SQLite       (auto-created at backend/x-tracker.sql on first run)
```

---

## PART 1: Launch EC2 Instance

1. Go to EC2 → Launch Instance
2. Name: `x-tracker`
3. AMI: Ubuntu Server 26.04 LTS
4. Instance type: `t3.medium`
5. Key pair: select or create `x_tracker_key.pem`
6. Storage: change to **24 GB** (gp3)
7. Security group: add rules from the table above
8. Launch

---

## PART 2: SSH Into the Instance

```bash
# On your local machine (adjust path to your .pem file)
chmod 400 x_tracker_key.pem
ssh -i x_tracker_key.pem ubuntu@<your-ec2-public-ip>
```

---

## PART 3: Install All Dependencies

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Build tools (GCC is required for CGO / go-sqlite3)
sudo apt install -y build-essential gcc

# Go 1.26.3 (matches go.mod requirement)
wget https://go.dev/dl/go1.26.3.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.26.3.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
go version   # should print go1.26.3

# Redis
sudo apt install -y redis-server

# Nginx, git, PM2
sudo apt install -y nginx git
sudo npm install -g pm2

# Verify versions
node -v && npm -v && go version && nginx -v
```

---

## PART 4: Configure Redis

```bash
sudo nano /etc/redis/redis.conf
```

Find and update this line (the bind is already localhost-only by default — no change needed there):

```conf
# Remove the # and set your password:
requirepass your-redis-password-here
```

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Verify it works
redis-cli -a your-redis-password-here ping   # should return PONG
```

---

## PART 5: Clone the Repository

```bash
git clone https://github.com/wengti/x-tracker.git
cd x-tracker
```

---

## PART 6: Backend Setup

```bash
cd backend

nano .env
```

Paste and fill in your values:

```env
JWT_SECRET=your-jwt-secret-here
COOKIE_SECURE=false
REDIS_URL=redis://:your-redis-password-here@localhost:6379
```

> `COOKIE_SECURE=false` because you are on HTTP. Set to `true` only after adding HTTPS.

```bash
# Build the binary — CGO_ENABLED=1 is mandatory for go-sqlite3
CGO_ENABLED=1 go build -o x-tracker .

# Start with PM2 (--cwd ensures .env and SQLite load from correct directory)
pm2 start "./x-tracker" --name backend --cwd /home/ubuntu/x-tracker/backend
```

**Verify:**

```bash
pm2 logs backend --lines 20
# out.log: all routes registered, "Listening and serving HTTP on :8080"
# error.log: seed messages like "121 inserted, 0 already existed" — these are normal.
#            Go's log package writes to stderr; PM2 captures stderr as error.log.
```

---

## PART 7: Frontend Setup

```bash
cd /home/ubuntu/x-tracker/frontend

# NEXT_PUBLIC_API_URL must NOT be set in production.
# The app uses relative URLs in production, which nginx routes to the backend.
# (proxy.ts checks the httpOnly token cookie when this env var is unset)
touch .env.local   # leave empty

npm install
npm run build
pm2 start "npm start" --name frontend --cwd /home/ubuntu/x-tracker/frontend
```

**Verify:**

```bash
pm2 logs frontend --lines 20
# Should see: Ready on http://localhost:3000
```

---

## PART 8: PM2 Persistence (Survive Reboots)

```bash
pm2 save
pm2 startup
# Copy and run the command it prints, e.g.:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## PART 9: Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/x-tracker
```

Paste:

```nginx
server {
    listen 80;
    server_name <your-ec2-public-ip>;

    # Backend routes — Go/Gin on port 8080
    location = /ping       { proxy_pass http://localhost:8080; }
    location = /parts      { proxy_pass http://localhost:8080; }
    location /auth/        { proxy_pass http://localhost:8080; }
    location /matches/     { proxy_pass http://localhost:8080; }
    location /profile/bey  { proxy_pass http://localhost:8080; }
    location /stats/       { proxy_pass http://localhost:8080; }

    # Frontend — Next.js on port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/x-tracker /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t          # must say: test is successful
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## PART 10: Verification

```bash
pm2 status             # both 'backend' and 'frontend' show 'online'
sudo systemctl status nginx

# Quick smoke test
curl http://localhost:8080/ping           # {"message":"hello world"}
curl http://<your-ec2-public-ip>/ping     # same, through nginx
```

Visit `http://<your-ec2-public-ip>` in your browser.

---

## PART 11: Deploying Updates

```bash
cd /home/ubuntu/x-tracker
git pull

# If backend changed:
cd backend
CGO_ENABLED=1 go build -o x-tracker .
pm2 restart backend

# If frontend changed:
cd ../frontend
npm install
npm run build
pm2 restart frontend
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `pm2 logs backend` shows Redis connection error | Verify password in `.env` matches `requirepass` in `/etc/redis/redis.conf`; run `redis-cli -a <pass> ping` |
| `pm2 logs backend` shows database error | Confirm PM2 started backend with `--cwd /home/ubuntu/x-tracker/backend` |
| `pm2 logs frontend` shows port 3000 already in use | `pm2 delete frontend` then start again |
| Nginx 502 Bad Gateway | Check `pm2 status` — process may have crashed; check `pm2 logs` |
| Go build hangs or runs out of memory | Free RAM first: `pm2 stop all`, build, then `pm2 start all` |
| `go: go.mod requires go >= 1.26.3` | Install the correct version: `wget https://go.dev/dl/go1.26.3.linux-amd64.tar.gz && sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.26.3.linux-amd64.tar.gz` |
| Login not persisting | Confirm `COOKIE_SECURE=false` in backend `.env` (required for HTTP) |
| Seed messages in PM2 error.log | Not a real error — Go's `log` package writes to stderr, PM2 labels stderr as error.log |
