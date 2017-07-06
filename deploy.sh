#!/usr/bin/env bash

PULL_REQUEST_NUMBER=$(git show HEAD --format=format:%s | sed -nE 's/Merge pull request #([0-9]+).*/\1/p')

if [ -z "$PULL_REQUEST_NUMBER" ]; then
    echo "No pull request number found; aborting publish."
    exit 0
fi

echo "Detected pull request #$PULL_REQUEST_NUMBER."
SEMVER_CHANGE=$(curl "https://maintainerd.divmain.com/api/semver?repoPath=FormidableLabs/rapscallion&installationId=37499&prNumber=$PULL_REQUEST_NUMBER")
if [ -z "$SEMVER_CHANGE" ]; then
    echo "No semver selection found; aborting publish."
    exit 0
fi

echo "Detected semantic version change of $SEMVER_CHANGE."

# CI might leave the working directory in an unclean state.
git reset --hard

git config --global user.name "Dale Bustad (bot)"
git config --global user.email "dale@divmain.com"

eval npm version "$SEMVER_CHANGE"
npm publish

git remote add origin-deploy https://${GH_TOKEN}@github.com/FormidableLabs/rapscallion.git > /dev/null 2>&1
git push --quiet --tags origin-deploy master

echo "Done!"
