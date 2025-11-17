#!/bin/bash

################################################################################
# Claude Owl Release Preparation Script
#
# This script prepares a new release by:
# 1. Running CI checks locally
# 2. Creating a release branch
# 3. Bumping version and generating changelog
# 4. Pushing to GitHub
#
# Usage:
#   ./scripts/prepare-release.sh [major|minor|patch]
#
# Example:
#   ./scripts/prepare-release.sh minor  # 0.1.0 -> 0.2.0
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Determine release type
RELEASE_TYPE=${1:-minor}

if [[ ! "$RELEASE_TYPE" =~ ^(major|minor|patch)$ ]]; then
  echo -e "${RED}❌ Invalid release type: $RELEASE_TYPE${NC}"
  echo "Usage: ./scripts/prepare-release.sh [major|minor|patch]"
  exit 1
fi

echo -e "${BLUE}🚀 Claude Owl Release Preparation${NC}"
echo -e "${BLUE}================================${NC}\n"

# Step 1: Check we're on develop branch
echo -e "${YELLOW}📍 Checking current branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo -e "${RED}❌ Must be on 'develop' branch to prepare a release${NC}"
  echo -e "Current branch: $CURRENT_BRANCH"
  exit 1
fi
echo -e "${GREEN}✓ On develop branch${NC}\n"

# Step 2: Pull latest changes
echo -e "${YELLOW}📥 Pulling latest changes from origin/develop...${NC}"
git pull origin develop
echo -e "${GREEN}✓ Up to date with origin${NC}\n"

# Step 3: Check for uncommitted changes
echo -e "${YELLOW}🔍 Checking for uncommitted changes...${NC}"
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}❌ You have uncommitted changes. Please commit or stash them first.${NC}"
  git status -s
  exit 1
fi
echo -e "${GREEN}✓ Working directory clean${NC}\n"

# Step 4: Run CI checks locally
echo -e "${YELLOW}🔧 Running CI checks locally...${NC}"
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

# Step 6: Calculate next version (dry-run to preview)
echo -e "${YELLOW}📊 Calculating next version (${RELEASE_TYPE})...${NC}"
NEXT_VERSION=$(npm run release:${RELEASE_TYPE} -- --dry-run --silent 2>&1 | grep -oP 'tagging release v\K[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "")

if [ -z "$NEXT_VERSION" ]; then
  # Fallback: manual calculation
  IFS='.' read -ra VER <<< "$CURRENT_VERSION"
  MAJOR="${VER[0]}"
  MINOR="${VER[1]}"
  PATCH="${VER[2]}"

  case "$RELEASE_TYPE" in
    major)
      NEXT_VERSION="$((MAJOR + 1)).0.0"
      ;;
    minor)
      NEXT_VERSION="${MAJOR}.$((MINOR + 1)).0"
      ;;
    patch)
      NEXT_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
      ;;
  esac
fi

echo -e "${GREEN}✓ Next version will be: ${NEXT_VERSION}${NC}\n"

# Step 7: Create release branch
RELEASE_BRANCH="release/v${NEXT_VERSION%.*}.x"  # e.g., release/v0.2.x
echo -e "${YELLOW}🌳 Creating release branch: ${RELEASE_BRANCH}${NC}"

# Check if branch already exists locally
if git show-ref --verify --quiet "refs/heads/${RELEASE_BRANCH}"; then
  echo -e "${YELLOW}⚠️  Branch ${RELEASE_BRANCH} already exists locally${NC}"
  read -p "Continue with existing branch? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
  git checkout "${RELEASE_BRANCH}"
  git merge develop --no-edit
else
  git checkout -b "${RELEASE_BRANCH}"
fi

echo -e "${GREEN}✓ On release branch: ${RELEASE_BRANCH}${NC}\n"

# Step 8: Run standard-version to bump version and generate changelog
echo -e "${YELLOW}📝 Running standard-version...${NC}"
npm run release:${RELEASE_TYPE}
echo -e "${GREEN}✓ Version bumped and CHANGELOG.md updated${NC}\n"

# Step 9: Push release branch to GitHub
echo -e "${YELLOW}📤 Pushing ${RELEASE_BRANCH} to origin...${NC}"
git push -u origin "${RELEASE_BRANCH}"
echo -e "${GREEN}✓ Release branch pushed${NC}\n"

# Step 10: Show summary and next steps
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Release Preparation Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Branch:${NC}      ${RELEASE_BRANCH}"
echo -e "${BLUE}Version:${NC}     ${CURRENT_VERSION} → ${NEXT_VERSION}"
echo -e "${BLUE}Changelog:${NC}   Updated with latest commits\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Review CHANGELOG.md for accuracy"
echo -e "  2. Test the release candidate (optional)"
echo -e "  3. Make any final bug fixes on this branch if needed"
echo -e "  4. Run ${GREEN}./scripts/finalize-release.sh${NC} when ready to publish\n"

echo -e "${BLUE}To make additional changes:${NC}"
echo -e "  git checkout ${RELEASE_BRANCH}"
echo -e "  # Make your changes and commit"
echo -e "  git push origin ${RELEASE_BRANCH}\n"
