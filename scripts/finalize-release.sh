#!/bin/bash

################################################################################
# Claude Owl Release Finalization Script
#
# This script finalizes a release by:
# 1. Merging release branch to main
# 2. Tagging the release
# 3. Pushing tag (triggers GitHub Actions build)
# 4. Merging release branch back to develop
# 5. Cleaning up release branch
#
# Usage:
#   ./scripts/finalize-release.sh
#
# IMPORTANT: Run this from the release branch
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Claude Owl Release Finalization${NC}"
echo -e "${BLUE}===================================${NC}\n"

# Step 1: Check we're on a release branch
echo -e "${YELLOW}📍 Checking current branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [[ ! "$CURRENT_BRANCH" =~ ^release/v ]]; then
  echo -e "${RED}❌ Must be on a release branch (release/vX.Y.x)${NC}"
  echo -e "Current branch: $CURRENT_BRANCH"
  exit 1
fi
echo -e "${GREEN}✓ On release branch: ${CURRENT_BRANCH}${NC}\n"

# Step 2: Get version from package.json
VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"
echo -e "${BLUE}Version to release: ${VERSION}${NC}"
echo -e "${BLUE}Git tag: ${TAG}${NC}\n"

# Step 3: Confirm with user
echo -e "${YELLOW}⚠️  This will:${NC}"
echo -e "  1. Merge ${CURRENT_BRANCH} → main"
echo -e "  2. Tag main with ${TAG}"
echo -e "  3. Push tag to GitHub (triggers release build)"
echo -e "  4. Merge ${CURRENT_BRANCH} → develop"
echo -e "  5. Delete ${CURRENT_BRANCH}\n"

read -p "Continue with release? (yes/no) " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
  echo -e "${YELLOW}Release cancelled${NC}"
  exit 0
fi

# Step 4: Check for uncommitted changes
echo -e "${YELLOW}🔍 Checking for uncommitted changes...${NC}"
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}❌ You have uncommitted changes. Please commit or stash them first.${NC}"
  git status -s
  exit 1
fi
echo -e "${GREEN}✓ Working directory clean${NC}\n"

# Step 5: Pull latest changes from release branch
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git pull origin "${CURRENT_BRANCH}"
echo -e "${GREEN}✓ Up to date${NC}\n"

# Step 6: Checkout main and merge release branch
echo -e "${YELLOW}🔀 Merging ${CURRENT_BRANCH} → main...${NC}"
git checkout main
git pull origin main
git merge "${CURRENT_BRANCH}" --no-ff -m "chore(release): merge ${CURRENT_BRANCH} into main"
echo -e "${GREEN}✓ Merged to main${NC}\n"

# Step 7: Tag the release
echo -e "${YELLOW}🏷️  Creating tag ${TAG}...${NC}"
git tag -a "${TAG}" -m "Release ${VERSION}"
echo -e "${GREEN}✓ Tag created${NC}\n"

# Step 8: Push main and tag to trigger build
echo -e "${YELLOW}📤 Pushing main and tag to origin...${NC}"
echo -e "${BLUE}  → This will trigger GitHub Actions multi-platform build${NC}\n"

# Retry logic for network resilience
MAX_RETRIES=4
RETRY_DELAY=2

for i in $(seq 1 $MAX_RETRIES); do
  echo -e "${BLUE}Attempt $i/$MAX_RETRIES: Pushing to origin...${NC}"

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
      echo -e "${YELLOW}You can manually push with:${NC}"
      echo -e "  git push origin main"
      echo -e "  git push origin ${TAG}"
      exit 1
    fi
  fi
done

# Step 9: Merge release branch back to develop
echo -e "${YELLOW}🔀 Merging ${CURRENT_BRANCH} → develop...${NC}"
git checkout develop
git pull origin develop
git merge "${CURRENT_BRANCH}" --no-ff -m "chore(release): merge ${CURRENT_BRANCH} back into develop"
git push origin develop
echo -e "${GREEN}✓ Merged to develop${NC}\n"

# Step 10: Delete release branch (optional, commented out for safety)
echo -e "${YELLOW}🗑️  Deleting release branch...${NC}"
# Uncomment these lines if you want automatic branch deletion:
# git branch -d "${CURRENT_BRANCH}"
# git push origin --delete "${CURRENT_BRANCH}"
echo -e "${BLUE}  → Skipped (branch kept for reference)${NC}"
echo -e "${BLUE}  → To delete manually:${NC}"
echo -e "    git branch -D ${CURRENT_BRANCH}"
echo -e "    git push origin --delete ${CURRENT_BRANCH}\n"

# Step 11: Show GitHub Actions status
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Release Finalized!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Version:${NC}     ${VERSION}"
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
echo -e "  2. Review draft release and edit if needed"
echo -e "  3. Publish release to make it public"
echo -e "  4. Announce on Discord, Twitter, etc.\n"
