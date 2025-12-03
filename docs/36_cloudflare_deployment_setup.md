# Cloudflare Pages Deployment Setup

## Overview

This document describes the complete setup for deploying the StravaGoals application to Cloudflare Pages using GitHub Actions CI/CD pipeline.

## Project Configuration

### 1. Astro Configuration

The project is configured with the Cloudflare adapter in `astro.config.mjs`:

```javascript
import cloudflare from '@astrojs/cloudflare'

export default defineConfig({
  adapter: cloudflare(),
  output: 'server',
  // ... other configuration
})
```

### 2. Wrangler Configuration

The project includes `wrangler.json` with the following configuration:

```json
{
  "$schema": "https://raw.githubusercontent.com/cloudflare/wrangler/main/wrangler-schema.json",
  "name": "stravagoals",
  "compatibility_date": "2025-12-03",
  "pages_build_output_dir": "dist"
}
```

### 3. Dependencies

The following packages are required for Cloudflare deployment:

- `@astrojs/cloudflare`: ^12.6.12 (Astro adapter for Cloudflare)
- Wrangler CLI is available via npx for deployment

## GitHub Actions Workflow

### Workflow File: `.github/workflows/master.yml`

The deployment workflow consists of four jobs:

#### Job 1: Lint
- Runs code quality checks using ESLint and oxlint
- Validates code standards before deployment

#### Job 2: Unit Tests
- Executes unit tests with Vitest
- Generates and uploads coverage reports
- Ensures code functionality is maintained

#### Job 3: Build Production
- Builds the Astro application for production
- Uploads build artifacts for deployment
- Depends on successful completion of lint and test jobs

#### Job 4: Deploy to Cloudflare Pages
- Downloads build artifacts from the build job
- Deploys to Cloudflare Pages using Wrangler
- Sets environment variables for Supabase connection

### Workflow Triggers

The workflow is triggered on:
- Push to `main` branch
- Manual workflow dispatch via GitHub Actions UI

### Required GitHub Secrets

The following secrets must be configured in the GitHub repository under **Settings > Secrets and variables > Actions > Environment secrets** for the `production` environment:

#### Cloudflare Secrets
- `CLOUDFLARE_API_TOKEN`: API token with Cloudflare Pages edit permissions
  - Create at: https://dash.cloudflare.com/profile/api-tokens
  - Required permissions: "Cloudflare Pages - Edit"
  
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
  - Find at: https://dash.cloudflare.com/ (in the URL or account settings)

#### Supabase Secrets
- `PUBLIC_SUPABASE_URL`: Supabase project URL
- `PUBLIC_SUPABASE_KEY`: Supabase anonymous/public API key

### Environment Configuration

The deployment job uses the `production` environment which:
- Provides environment protection rules
- Contains deployment-specific secrets
- Tracks deployment history and status

## Deployment Process

### Manual Deployment

To deploy manually using npm script:

```bash
npm run deploy
```

This command:
1. Builds the Astro project (`astro build`)
2. Deploys to Cloudflare Pages using Wrangler (`wrangler pages deploy dist --project-name=stravagoals`)

### CI/CD Deployment

Automatic deployment happens when:
1. Code is pushed to the `main` branch
2. All lint checks pass
3. All unit tests pass
4. Production build completes successfully
5. Wrangler deploys the built application to Cloudflare Pages

### Deployment URL

After successful deployment, the application will be available at:
- Production: `https://stravagoals.pages.dev`
- Or custom domain if configured in Cloudflare Pages

## GitHub Actions Best Practices Applied

The workflow follows best practices from `.cursor/rules/github-action.mdc`:

1. ✅ Uses `npm ci` for consistent dependency installation
2. ✅ Environment variables attached to specific jobs, not globally
3. ✅ Uses `main` branch (verified with `git branch -a`)
4. ✅ Actions use major version tags (v3, v4)
5. ✅ Composite steps organized into separate jobs
6. ✅ Proper permissions defined at workflow level

### GitHub Actions Versions Used

- `actions/checkout@v4` - Latest stable version for code checkout
- `actions/setup-node@v4` - Latest stable version for Node.js setup
- `actions/upload-artifact@v4` - Latest stable version for artifact uploads
- `actions/download-artifact@v4` - Latest stable version for artifact downloads
- `cloudflare/wrangler-action@v3` - Latest stable version for Cloudflare deployment

## Differences from Test Workflow

The deployment workflow (`master.yml`) differs from the test workflow (`test.yml`):

### Removed Components
- ❌ E2E tests with Playwright (not needed for deployment)
- ❌ Playwright browser installation
- ❌ Playwright report uploads
- ❌ Test environment secrets (E2E_USERNAME, E2E_PASSWORD, etc.)

### Added Components
- ✅ Deploy job with Cloudflare Pages deployment
- ✅ Production environment configuration
- ✅ Artifact download from build job
- ✅ Wrangler action for deployment

### Modified Components
- Test job renamed from "Test (Unit + E2E)" to "Unit Tests"
- Build job now uploads artifacts for deployment
- Added deployment URL tracking via environment outputs

## Troubleshooting

### Common Issues

1. **Deployment fails with "Unauthorized"**
   - Verify `CLOUDFLARE_API_TOKEN` is correctly set
   - Ensure API token has "Cloudflare Pages - Edit" permissions

2. **Build fails during deployment**
   - Check that build completes successfully locally
   - Verify all dependencies are listed in `package.json`
   - Ensure `astro check` passes

3. **Application errors after deployment**
   - Verify Supabase secrets are correctly configured
   - Check Cloudflare Pages logs in dashboard
   - Ensure environment variables are set in production environment

4. **Project not found error**
   - Verify project name matches in wrangler.json and workflow
   - Ensure Cloudflare Pages project "stravagoals" exists

## Cloudflare Pages Project Setup

Before first deployment, ensure the Cloudflare Pages project exists:

1. Log in to Cloudflare Dashboard
2. Navigate to Pages
3. Create a new project named "stravagoals" (or use existing)
4. No additional configuration needed - deployment handled by GitHub Actions

## Monitoring and Logs

### Deployment Status
- View deployment status in GitHub Actions tab
- Check Cloudflare Pages dashboard for deployment history

### Application Logs
- Access logs via Cloudflare Dashboard > Pages > stravagoals > Deployment logs
- Use Wrangler CLI for local log streaming: `wrangler pages deployment tail`

## Security Considerations

1. **API Tokens**: Store all sensitive tokens as GitHub Secrets
2. **Environment Variables**: Use environment-specific secrets for production
3. **Permissions**: Workflow has minimal required permissions (read contents, write deployments)
4. **Branch Protection**: Consider enabling branch protection rules for `main` branch

## Next Steps

1. Configure GitHub Secrets in repository settings
2. Ensure Cloudflare Pages project "stravagoals" exists
3. Test deployment by pushing to `main` branch
4. Monitor first deployment in GitHub Actions and Cloudflare Dashboard
5. Configure custom domain (optional) in Cloudflare Pages settings

## References

- [Astro Cloudflare Deployment Guide](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

