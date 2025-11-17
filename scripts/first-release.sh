#!/bin/bash

################################################################################
# Claude Owl First Release Script (v0.1.0)
#
# Simplified script for cutting the very first release without GitFlow setup.
# This ensures version in package.json and git tag are always in sync.
#
# Usage:
#   ./scripts/first-release.sh
#
# What it does:
# 1. Ensures we're on a clean main branch
# 2. Runs CI checks (lint, typecheck, tests, build)
# 3. Uses standard-version to bump version and update changelog
# 4. Creates and pushes tag (triggers GitHub Actions build)
#
# After the first release, use the regular prepare/finalize scripts.
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🦉 Claude Owl First Release (v0.1.0)${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# Step 1: Check we're on main branch
echo -e "${YELLOW}📍 Checking current branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${RED}❌ Must be on 'main' branch${NC}"
  echo -e "Current branch: $CURRENT_BRANCH"
  echo -e "\nRun: git checkout main"
  exit 1
fi
echo -e "${GREEN}✓ On main branch${NC}\n"

# Step 2: Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git pull origin main
echo -e "${GREEN}✓ Up to date${NC}\n"

# Step 3: Check for uncommitted changes
echo -e "${YELLOW}🔍 Checking for uncommitted changes...${NC}"
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}❌ You have uncommitted changes. Please commit or stash them first.${NC}"
  git status -s
  exit 1
fi
echo -e "${GREEN}✓ Working directory clean${NC}\n"

# Step 4: Run CI checks
echo -e "${YELLOW}🔧 Running CI checks...${NC}"
echo -e "${BLUE}  → npm run format${NC}"
npm run format

echo -e "${BLUE}  → npm run lint${NC}"
npm run lint

echo -e "${BLUE}  → npm run typecheck${NC}"
npm run typecheck

echo -e "${BLUE}  → npm run test:unit${NC}"
npm run test:unit

echo -e "${BLUE}  → npm run build${NC}"
npm run build

echo -e "${GREEN}✓ All CI checks passed${NC}\n"

# Step 5: Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}Current version: ${CURRENT_VERSION}${NC}\n"

# Step 6: Preview what standard-version will do
echo -e "${YELLOW}📊 Previewing release...${NC}"
echo -e "${BLUE}This will create version ${CURRENT_VERSION} (or bump if commits found)${NC}\n"

# Step 7: Confirm with user
echo -e "${YELLOW}⚠️  This will:${NC}"
echo -e "  1. Update package.json version"
echo -e "  2. Generate CHANGELOG.md from commits"
echo -e "  3. Create git tag matching package.json version"
echo -e "  4. Push tag to GitHub (triggers build)\n"

read -p "Continue? (yes/no) " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
  echo -e "${YELLOW}Release cancelled${NC}"
  exit 0
fi

# Step 8: Run standard-version (handles version bump + changelog)
echo -e "${YELLOW}📝 Running standard-version...${NC}"
npm run release
echo -e "${GREEN}✓ Version bumped and CHANGELOG.md updated${NC}\n"

# Step 9: Get the new version (from package.json)
NEW_VERSION=$(node -p "require('./package.json').version")
TAG="v${NEW_VERSION}"

echo -e "${BLUE}New version: ${NEW_VERSION}${NC}"
echo -e "${BLUE}Git tag: ${TAG}${NC}\n"

# Step 10: Push to origin with retry logic
echo -e "${YELLOW}📤 Pushing to origin...${NC}"

MAX_RETRIES=4
RETRY_DELAY=2

for i in $(seq 1 $MAX_RETRIES); do
  echo -e "${BLUE}Attempt $i/$MAX_RETRIES: Pushing main + tag...${NC}"

  if git push origin main && git push origin "${TAG}"; then
    echo -e "${GREEN}✓ Pushed successfully${NC}\n"
    break
  else
    if [ $i -lt $MAX_RETRIES ]; then
      echo -e "${YELLOW}⚠️  Push failed, retrying in ${RETRY_DELAY}s...${NC}"
      sleep $RETRY_DELAY
      RETRY_DELAY=$((RETRY_DELAY * 2))  # Exponential backoff
    else
      echo -e "${RED}❌ Failed to push after $MAX_RETRIES attempts${NC}"
      echo -e "${YELLOW}Manually push with:${NC}"
      echo -e "  git push origin main"
      echo -e "  git push origin ${TAG}"
      exit 1
    fi
  fi
done

# Step 11: Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 First Release Created!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Version:${NC}     ${NEW_VERSION}"
echo -e "${BLUE}Tag:${NC}         ${TAG}"
echo -e "${BLUE}Branch:${NC}      main\n"

echo -e "${YELLOW}GitHub Actions is now building:${NC}"
echo -e "  • macOS (.dmg for Intel + Apple Silicon)"
echo -e "  • Windows (.exe installer)"
echo -e "  • Linux (.AppImage)\n"

GITHUB_REPO="antonbelev/claude-owl"
echo -e "${BLUE}View build progress:${NC}"
echo -e "  https://github.com/${GITHUB_REPO}/actions\n"

echo -e "${BLUE}Release will be published at:${NC}"
echo -e "  https://github.com/${GITHUB_REPO}/releases/tag/${TAG}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Monitor GitHub Actions build (~15-20 minutes)"
echo -e "  2. Review draft release at the URL above"
echo -e "  3. Publish release to make it public"
echo -e "  4. Downloads will auto-update on GitHub Pages\n"

echo -e "${BLUE}For future releases, use:${NC}"
echo -e "  ./scripts/prepare-release.sh [major|minor|patch]"
echo -e "  ./scripts/finalize-release.sh\n"
