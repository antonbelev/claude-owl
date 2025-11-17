#!/bin/bash

################################################################################
# Claude Owl Hotfix Script
#
# This script handles emergency hotfixes by:
# 1. Ensuring you're on a hotfix branch (hotfix/vX.Y.Z-description)
# 2. Bumping patch version and updating changelog
# 3. Merging to both main and develop
# 4. Tagging and pushing (triggers release build)
#
# Usage:
#   # First, create hotfix branch from main:
#   git checkout main
#   git checkout -b hotfix/v0.2.1-security-fix
#
#   # Make your fixes, commit them
#   git commit -m "fix(security): sanitize user inputs"
#
#   # Run this script to finalize the hotfix
#   ./scripts/hotfix.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚨 Claude Owl Hotfix Release${NC}"
echo -e "${BLUE}=============================${NC}\n"

# Step 1: Check we're on a hotfix branch
echo -e "${YELLOW}📍 Checking current branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [[ ! "$CURRENT_BRANCH" =~ ^hotfix/v ]]; then
  echo -e "${RED}❌ Must be on a hotfix branch (hotfix/vX.Y.Z-description)${NC}"
  echo -e "Current branch: $CURRENT_BRANCH"
  echo -e "\nTo create a hotfix branch:"
  echo -e "  git checkout main"
  echo -e "  git checkout -b hotfix/v0.2.1-description"
  exit 1
fi
echo -e "${GREEN}✓ On hotfix branch: ${CURRENT_BRANCH}${NC}\n"

# Step 2: Check for uncommitted changes
echo -e "${YELLOW}🔍 Checking for uncommitted changes...${NC}"
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}❌ You have uncommitted changes. Please commit them first.${NC}"
  git status -s
  exit 1
fi
echo -e "${GREEN}✓ Working directory clean${NC}\n"

# Step 3: Run CI checks
echo -e "${YELLOW}🔧 Running CI checks...${NC}"
echo -e "${BLUE}  → npm run lint${NC}"
npm run lint

echo -e "${BLUE}  → npm run typecheck${NC}"
npm run typecheck

echo -e "${BLUE}  → npm run test:unit${NC}"
npm run test:unit

echo -e "${BLUE}  → npm run build${NC}"
npm run build

echo -e "${GREEN}✓ All CI checks passed${NC}\n"

# Step 4: Bump patch version and update changelog
echo -e "${YELLOW}📝 Bumping patch version and updating CHANGELOG...${NC}"
npm run release:patch
echo -e "${GREEN}✓ Version bumped${NC}\n"

# Step 5: Get new version
VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"
echo -e "${BLUE}Hotfix version: ${VERSION}${NC}"
echo -e "${BLUE}Git tag: ${TAG}${NC}\n"

# Step 6: Confirm with user
echo -e "${YELLOW}⚠️  This will:${NC}"
echo -e "  1. Merge ${CURRENT_BRANCH} → main"
echo -e "  2. Tag main with ${TAG}"
echo -e "  3. Push tag (triggers release build)"
echo -e "  4. Merge ${CURRENT_BRANCH} → develop"
echo -e "  5. Delete ${CURRENT_BRANCH}\n"

read -p "Continue with hotfix release? (yes/no) " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
  echo -e "${YELLOW}Hotfix cancelled${NC}"
  exit 0
fi

# Step 7: Merge to main
echo -e "${YELLOW}🔀 Merging ${CURRENT_BRANCH} → main...${NC}"
git checkout main
git pull origin main
git merge "${CURRENT_BRANCH}" --no-ff -m "chore(hotfix): merge ${CURRENT_BRANCH} into main"
echo -e "${GREEN}✓ Merged to main${NC}\n"

# Step 8: Tag the hotfix
echo -e "${YELLOW}🏷️  Creating tag ${TAG}...${NC}"
git tag -a "${TAG}" -m "Hotfix ${VERSION}"
echo -e "${GREEN}✓ Tag created${NC}\n"

# Step 9: Push main and tag with retry logic
echo -e "${YELLOW}📤 Pushing main and tag to origin...${NC}"
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
      RETRY_DELAY=$((RETRY_DELAY * 2))
    else
      echo -e "${RED}❌ Failed to push after $MAX_RETRIES attempts${NC}"
      exit 1
    fi
  fi
done

# Step 10: Merge to develop
echo -e "${YELLOW}🔀 Merging ${CURRENT_BRANCH} → develop...${NC}"
git checkout develop
git pull origin develop
git merge "${CURRENT_BRANCH}" --no-ff -m "chore(hotfix): merge ${CURRENT_BRANCH} back into develop"
git push origin develop
echo -e "${GREEN}✓ Merged to develop${NC}\n"

# Step 11: Delete hotfix branch
echo -e "${YELLOW}🗑️  Deleting hotfix branch...${NC}"
git branch -d "${CURRENT_BRANCH}"
git push origin --delete "${CURRENT_BRANCH}" || echo -e "${YELLOW}⚠️  Remote branch already deleted${NC}"
echo -e "${GREEN}✓ Branch deleted${NC}\n"

# Step 12: Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Hotfix Released!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Version:${NC}     ${VERSION}"
echo -e "${BLUE}Tag:${NC}         ${TAG}\n"

GITHUB_REPO="antonbelev/claude-owl"
echo -e "${BLUE}View build progress:${NC}"
echo -e "  https://github.com/${GITHUB_REPO}/actions\n"

echo -e "${BLUE}Release will be published at:${NC}"
echo -e "  https://github.com/${GITHUB_REPO}/releases/tag/${TAG}\n"
