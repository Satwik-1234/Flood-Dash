# Ultimate Deployment Guide 🚀
*How to host Pravhatattva v3.0 globally for exactly $0.00.*

To deploy this application, you **DO NOT** need Vercel, Netlify, Heroku, or AWS. Because we built the groundbreaking "Zero-Server" architecture, Microsoft GitHub will host both your scraping backend AND your React frontend entirely for free.

## The One Master Step: GitHub Pages Cloud Execution

I have already programmed `.github/workflows/deploy.yml` for you. This file tells GitHub's huge server farms to turn your React code into a live website automatically. 

All you have to do is turn the switch ON:

1. **Go to your GitHub Repository:** Open your browser and navigate to `https://github.com/Satwik-1234/Flood-Dash`
2. **Access Settings:** Click the gear icon (`⚙️ Settings`) at the top right of your repository.
3. **Navigate to Pages:** On the left sidebar menu, scroll down and click on **Pages**.
4. **Change "Source" to "GitHub Actions":** 
   - You will see a dropdown labeled "Source" (it usually says *Deploy from a branch*).
   - Click it and change it to **GitHub Actions**.
5. **Wait 2 Minutes!**
   - That is literally it. By selecting GitHub Actions, you gave the `deploy.yml` file permission to run.
   - Click on the **Actions** tab at the top of your GitHub repo to watch the deployment bar turn Green.
   - GitHub will officially provide you a live URL (e.g., `https://satwik-1234.github.io/Flood-Dash/`).

## How the Database (Data Scraper) Works
I also wrote `.github/workflows/telemetry_sync.yml`. 
* This is a Cron Job. Every 15 minutes, forever, GitHub will fire up a virtual python server in the cloud, download the latest Central Water Commission (CWC) API warnings, and silently "commit" those JSON updates to your website.
* Whenever the JSON updates, the `deploy.yml` script notices, rebuilds the site, and updates the live URL automatically without you lifting a finger!

**You just built a global disaster management portal that requires $0 in server-maintenance.**
