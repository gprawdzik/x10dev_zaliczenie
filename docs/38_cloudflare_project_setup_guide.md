# Quick Fix: Cloudflare Project Not Found Error

## Error You're Seeing

```
✘ [ERROR] A request to the Cloudflare API (/accounts/***/pages/projects/stravagoals) failed.
Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
```

## What This Means

The Cloudflare Pages project "stravagoals" doesn't exist yet. You need to create it before the GitHub Actions deployment can work.

## How to Fix (Choose One Method)

### Method 1: Using Wrangler CLI (Fastest) ⚡

This is the quickest way to create the project:

```bash
# 1. Install wrangler globally (if not already installed)
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login
# This will open a browser window for authentication

# 3. Create the Pages project
wrangler pages project create stravagoals

# 4. Verify the project was created
wrangler pages project list
# You should see "stravagoals" in the list
```

**Expected output after creation:**
```
✨ Successfully created the 'stravagoals' project.
```

### Method 2: Using Cloudflare Dashboard

If you prefer using the web interface:

1. **Login to Cloudflare**
   - Go to https://dash.cloudflare.com/
   - Sign in with your credentials

2. **Navigate to Pages**
   - Click on **Workers & Pages** in the left sidebar
   - Or go directly to: `https://dash.cloudflare.com/<YOUR_ACCOUNT_ID>/pages`

3. **Create New Project**
   - Click the **Create application** button
   - Select the **Pages** tab
   - Click **Direct Upload**

4. **Name Your Project**
   - Project name: `stravagoals` (must be exactly this - it's case-sensitive)
   - Click **Create project**

5. **Verify Creation**
   - You should see the project listed in your Pages dashboard
   - It will show "No deployments yet" - this is normal
   - GitHub Actions will handle all deployments

## After Creating the Project

Once the project exists, re-run your GitHub Actions workflow:

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Find the **Deploy to Cloudflare Pages** workflow
4. Click **Run workflow**
5. Select the **main** branch
6. Click **Run workflow** button

The deployment should now succeed!

## Verifying Your Setup

To confirm everything is configured correctly:

### Check via Wrangler CLI:
```bash
wrangler pages project list
```

You should see `stravagoals` in the output.

### Check via Dashboard:
1. Go to https://dash.cloudflare.com/
2. Navigate to Workers & Pages
3. You should see "stravagoals" in your projects list

## Common Issues

### "wrangler: command not found"

Install wrangler globally:
```bash
npm install -g wrangler
```

Or use it via npx:
```bash
npx wrangler pages project create stravagoals
```

### "Authentication error"

Run the login command again:
```bash
wrangler login
```

This will open a browser window. Make sure to allow the authentication.

### Project name already exists but you still get the error

1. **Check the exact name:**
   - Project names are case-sensitive
   - Must be exactly: `stravagoals` (all lowercase, no spaces)

2. **Verify the account:**
   - Make sure `CLOUDFLARE_ACCOUNT_ID` in GitHub Secrets matches the account where you created the project
   - You can find your Account ID in the Cloudflare Dashboard URL

3. **Check API token permissions:**
   - Your `CLOUDFLARE_API_TOKEN` must have "Cloudflare Pages - Edit" permission
   - Recreate the token if needed

### Wrong account ID

If you have multiple Cloudflare accounts:

1. Check which account the project was created in:
   ```bash
   wrangler pages project list
   ```

2. Get the correct Account ID from Cloudflare Dashboard:
   - The ID is in the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/...`
   - Or visible in the sidebar

3. Update the `CLOUDFLARE_ACCOUNT_ID` secret in GitHub:
   - Go to: Settings > Secrets and variables > Actions > Environments > production
   - Update the `CLOUDFLARE_ACCOUNT_ID` value

## What Happens After the Fix

Once the project is created and the workflow runs successfully:

1. ✅ Build artifacts will be uploaded to Cloudflare Pages
2. ✅ Your application will be deployed
3. ✅ You'll get a deployment URL: `https://stravagoals.pages.dev`
4. ✅ Future deployments will work without this error

## Need More Help?

See the complete setup guide:
- [.github/CLOUDFLARE_DEPLOYMENT.md](../.github/CLOUDFLARE_DEPLOYMENT.md) - Full deployment guide
- [36_cloudflare_deployment_setup.md](36_cloudflare_deployment_setup.md) - Technical documentation

## Quick Reference

**Project name:** `stravagoals`  
**Create command:** `wrangler pages project create stravagoals`  
**List projects:** `wrangler pages project list`  
**Login:** `wrangler login`  

**Cloudflare Dashboard:** https://dash.cloudflare.com/  
**Pages section:** Workers & Pages > Create application > Pages > Direct Upload

