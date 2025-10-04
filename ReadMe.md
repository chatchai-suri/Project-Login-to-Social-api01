# Server

## Step 1 create package
```bash
npm init -y
```
### Step 2 install package (dependencies)
```bash
npm install express cors helmet cookie-parser dotenv argon2 jsonwebtoken node-cron passport passport-facebook passport-github2 passport-google-oauth20 zod uuid
```
### Step 3 install package (devDependencies)
```bash
npm install -D prisma nodemon
```
### Step 4 npx prisma init to obtain file .gitignore, .env and folder prisma 
```bash
npx prisma init
```
### Step 5 push to github
create repo at github.com
```bash
git init
git add README.md
git commit -m "Project setup"
git branch -M main
git remote add origin https://github.com/chatchai-suri/Project-Login-to-Social-api01.git
git push -u origin main
```