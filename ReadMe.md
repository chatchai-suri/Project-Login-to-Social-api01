# Server

## Step 1 create package
```bash
npm init -y
```
### Step 2 install package (dependencies), make essential folder and file & update package.json
#### step 2.1 install package
```bash
npm install express cors helmet cookie-parser dotenv argon2 jsonwebtoken node-cron passport passport-facebook passport-github2 passport-google-oauth20 zod uuid
```
### step 2.2 make essencial folder files
 src, src/add.js, src/server.js
### step 2.3 package.json add statement to run code at "scripts" follow path from 2.2
```json
 "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon src/server.js" <-- add this line, don't forget to install nodemon at step 3 (or add nodemon after step 3)
  },
```
### step 2.4 make common folders under src
 src/config
 src/controllers
 src/middlewars
 src/routes
 src/services
 src/utils
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