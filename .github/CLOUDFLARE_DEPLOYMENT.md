# Cloudflare Pages Deployment Guide

## Overview

This guide explains how to configure and use the Cloudflare Pages deployment pipeline for the StravaGoals application.

## ⚠️ Important: First-Time Setup

**Before running the deployment workflow, you must create the Cloudflare Pages project first!**

If you see this error:

```
✘ [ERROR] Project not found. The specified project name does not match any of your existing projects.
```

Jump to the [Create Cloudflare Pages Project](#3-create-cloudflare-pages-project) section below.

## Prerequisites

Before deploying to Cloudflare Pages, ensure you have:

1. A Cloudflare account
2. A Cloudflare Pages project named "stravagoals" (see setup instructions below)
3. GitHub repository with the code
4. Supabase project for production

## Cloudflare Setup

### 1. Create Cloudflare API Token

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **My Profile > API Tokens**
3. Click **Create Token**
4. Use the **Edit Cloudflare Workers** template or create a custom token with:
   - **Permissions:**
     - Account - Cloudflare Pages - Edit
   - **Account Resources:**
     - Include - Your Account
5. Click **Continue to summary** and **Create Token**
6. **Copy the token** (you won't be able to see it again)

### 2. Get Account ID

1. In Cloudflare Dashboard, navigate to any domain or Workers & Pages
2. Your Account ID is displayed in the right sidebar
3. Or find it in the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/...`

### 3. Create Cloudflare Pages Project

**IMPORTANT:** The project must be created before running the deployment workflow.

#### Option 1: Create via Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages**
3. Click **Create application**
4. Select **Pages** tab
5. Click **Connect to Git** or **Direct Upload**

**For Direct Upload:**

- Click **Direct Upload**
- Name your project: **stravagoals** (must match `wrangler.json`)
- You'll see "No deployments yet" - this is expected
- The GitHub Actions workflow will handle deployments

**For Connect to Git (alternative):**

- Connect your GitHub repository
- Select the repository
- Configure build settings:
  - Framework preset: **Astro**
  - Build command: **npm run build**
  - Build output directory: **dist**
- Name: **stravagoals**
- Click **Save and Deploy** (first deployment)
- After initial setup, GitHub Actions will handle future deployments

#### Option 2: Create via Wrangler CLI (Recommended for CI/CD)

If you want to create the project via command line:

```bash
# Install wrangler globally (if not already installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create the Pages project
wrangler pages project create stravagoals

# Verify project was created
wrangler pages project list
```

This will create an empty project that the GitHub Actions workflow can deploy to.

## GitHub Repository Setup

### Configure GitHub Secrets

Navigate to your GitHub repository:
**Settings > Secrets and variables > Actions > Environments**

#### Create "production" Environment

1. Click **New environment**
2. Name it: `production`
3. Add the following secrets:

**Cloudflare Secrets:**

- `CLOUDFLARE_API_TOKEN` - The API token created in step 1
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID from step 2

**Supabase Secrets:**

- `PUBLIC_SUPABASE_URL` - Your production Supabase project URL
  - Format: `https://xxxxxxxxxxxxxxxxxxxxxxxxx.supabase.co`
  - Find in: Supabase Dashboard > Project Settings > API
- `PUBLIC_SUPABASE_KEY` - Your production Supabase anon/public key
  - Find in: Supabase Dashboard > Project Settings > API > Project API keys > anon public

### Environment Protection (Optional)

You can add protection rules to the production environment:

1. In the environment settings, enable **Required reviewers**
2. Add team members who must approve deployments
3. Configure **Wait timer** if you want a delay before deployment
4. Set **Deployment branches** to restrict which branches can deploy

## Deployment Workflow

### Automatic Deployment

The deployment happens manually when:

1. Code is pushed to the `main` branch
2. All linting checks pass
3. All unit tests pass
4. Production build completes successfully

### Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Cloudflare Pages** workflow
3. Click **Run workflow**
4. Choose the branch (default: main)
5. Click **Run workflow**

## Workflow Structure

The deployment workflow (`.github/workflows/master.yml`) consists of 4 jobs:

### 1. Lint Job

- Runs code quality checks (oxlint, eslint)
- Fails if code quality issues are found
- Duration: ~2-3 minutes

### 2. Test Job

- Runs unit tests with Vitest
- Generates code coverage report
- Skips E2E tests for faster deployment
- Duration: ~5-7 minutes

### 3. Build Job

- Compiles the Astro application
- Creates production-ready build
- Uploads build artifacts
- Requires: Lint and Test jobs to pass
- Duration: ~2-3 minutes

### 4. Deploy Job

- Downloads build artifacts
- Deploys to Cloudflare Pages using Wrangler
- Sets up environment variables
- Updates deployment URL
- Requires: Build job to complete
- Duration: ~2-3 minutes

**Total Pipeline Duration:** ~10-15 minutes

## Verifying Deployment

### Check GitHub Actions

1. Go to **Actions** tab in your repository
2. Find the latest "Deploy to Cloudflare Pages" workflow run
3. Verify all jobs completed successfully (green checkmarks)
4. Click on **Deploy to Cloudflare Pages** job to see deployment URL

### Check Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages > stravagoals**
3. View deployment history and status
4. Click on the latest deployment to see:
   - Build logs
   - Deployment URL
   - Environment variables
   - Custom domains (if configured)

### Access Your Application

After successful deployment, your application is available at:

**Default URL:** `https://stravagoals.pages.dev`

You can also configure a custom domain in Cloudflare Pages settings.

## Troubleshooting

### Deployment Fails with "Unauthorized"

**Cause:** Invalid or missing `CLOUDFLARE_API_TOKEN`

**Solution:**

1. Verify the token is correctly set in GitHub Secrets
2. Check if the token has expired
3. Ensure the token has "Cloudflare Pages - Edit" permission
4. Create a new token if necessary

### Deployment Fails with "Project not found" (Error Code: 8000007)

**Error Message:**

```
✘ [ERROR] A request to the Cloudflare API (/accounts/***/pages/projects/stravagoals) failed.
Project not found. The specified project name does not match any of your existing projects.
```

**Cause:** The Cloudflare Pages project "stravagoals" hasn't been created yet.

**Solution:**

**Option A: Create via Wrangler CLI (Fastest)**

```bash
# Install wrangler if needed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create the project
wrangler pages project create stravagoals

# Verify it was created
wrangler pages project list
```

**Option B: Create via Cloudflare Dashboard**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click **Create application > Pages**
4. Choose **Direct Upload**
5. Name the project: **stravagoals**
6. Click **Create project**

**Option C: Verify Existing Project**

1. Check if project exists in Cloudflare Dashboard
2. Verify project name matches exactly: "stravagoals" (case-sensitive)
3. Ensure `wrangler.json` has correct project name
4. Verify `CLOUDFLARE_ACCOUNT_ID` secret is correct

After creating the project, re-run the GitHub Actions workflow.

### Build Succeeds but Application Errors

**Cause:** Missing or incorrect environment variables

**Solution:**

1. Check `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_KEY` in GitHub Secrets
2. Verify Supabase project is accessible
3. Check Cloudflare Pages deployment logs for runtime errors
4. Ensure all required environment variables are set in production environment

### Slow Deployment Times

**Cause:** GitHub Actions or Cloudflare processing delays

**Solution:**

1. Check GitHub Actions status page for incidents
2. Verify Cloudflare status page
3. Consider using GitHub Actions caching (already implemented)
4. E2E tests are already skipped in deployment workflow

## Local Testing Before Deployment

Before pushing to `main`, test your changes locally:

```bash
# Run linting
npm run lint

# Run unit tests
npm run test:unit

# Build production version
npm run build

# Preview production build
npm run preview

# Optional: Test E2E locally
npm run test:e2e
```

## Rollback Strategy

If a deployment causes issues:

### Option 1: Deploy Previous Commit

```bash
# Find the previous working commit
git log

# Push that commit to main (or create a PR)
git checkout <commit-hash>
git checkout -b rollback
git push origin rollback
# Then merge to main via PR
```

### Option 2: Use Cloudflare Rollback

1. Go to Cloudflare Dashboard > Workers & Pages > stravagoals
2. Find the previous successful deployment
3. Click **...** menu > **Rollback to this deployment**
4. Confirm the rollback

## Monitoring

### GitHub Actions Notifications

Configure GitHub notifications for workflow failures:

1. Go to **Settings > Notifications**
2. Enable **Actions** under "Email notifications"
3. You'll receive emails when workflows fail

### Cloudflare Pages Notifications

Configure Cloudflare notifications:

1. Go to **Notifications** in Cloudflare Dashboard
2. Create a new notification
3. Choose **Pages** events
4. Configure delivery method (email, webhook, PagerDuty, etc.)

## Custom Domain Setup (Optional)

To use a custom domain:

1. Go to Cloudflare Dashboard > Workers & Pages > stravagoals
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `app.yourdomain.com`)
5. Follow DNS configuration instructions
6. Cloudflare will automatically provision SSL certificate

## Environment Variables in Cloudflare

If you need to set additional environment variables directly in Cloudflare:

1. Go to Cloudflare Dashboard > Workers & Pages > stravagoals
2. Click **Settings** tab
3. Scroll to **Environment variables**
4. Click **Add variables**
5. Add key-value pairs
6. Deploy again for changes to take effect

**Note:** Variables set in GitHub Secrets take precedence over Cloudflare settings.

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate API tokens** regularly (every 90 days recommended)
3. **Use environment protection rules** to require approval for production deployments
4. **Enable branch protection** on the `main` branch
5. **Monitor deployment logs** for suspicious activity
6. **Use production-specific** Supabase project, not development/test

## Related Documentation

- [docs/36_cloudflare_deployment_setup.md](../docs/36_cloudflare_deployment_setup.md) - Detailed technical setup
- [docs/35_ci_cd_configuration.md](../docs/35_ci_cd_configuration.md) - Testing pipeline configuration
- [Astro Cloudflare Docs](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

## Support

If you encounter issues:

1. Check [Cloudflare Status](https://www.cloudflarestatus.com/)
2. Check [GitHub Status](https://www.githubstatus.com/)
3. Review workflow logs in GitHub Actions
4. Review deployment logs in Cloudflare Dashboard
5. Consult the troubleshooting section above
