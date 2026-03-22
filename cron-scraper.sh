#!/bin/bash
# Mise Scraper Cron — runs every 5 minutes
# Add to crontab: */5 * * * * /root/.openclaw/workspace/Mise/cron-scraper.sh

cd /root/.openclaw/workspace/Mise

# Load environment variables from .env.local
set -o allexport
# shellcheck disable=SC1091
source .env.local
set +o allexport

npx tsx scraper/index.ts >> /var/log/mise-scraper.log 2>&1
