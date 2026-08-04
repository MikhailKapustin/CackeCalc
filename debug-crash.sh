#!/bin/bash
# CakeCost Crash Diagnostic Script
# This script helps diagnose why the app crashes in emulator

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================"
echo "CakeCost Crash Diagnostic Tool"
echo "================================"
echo ""

# Check if device is connected
echo -e "${BLUE}[1/7]${NC} Checking connected devices..."
DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo -e "${RED}✗ No devices connected${NC}"
    echo ""
    echo "Please:"
    echo "1. Start Android Studio emulator, or"
    echo "2. Connect a physical device with USB debugging enabled"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Found $DEVICES device(s)${NC}"
adb devices
echo ""

# Check Android version
echo -e "${BLUE}[2/7]${NC} Checking Android version..."
API_LEVEL=$(adb shell getprop ro.build.version.sdk)
ANDROID_VERSION=$(adb shell getprop ro.build.version.release)

echo "API Level: $API_LEVEL"
echo "Android Version: $ANDROID_VERSION"

if [ "$API_LEVEL" -lt 24 ]; then
    echo -e "${YELLOW}⚠ Warning: API level is below 24 (Android 7.0)${NC}"
    echo "  CakeCost requires Android 7.0 (API 24) or higher"
fi
echo ""

# Check if app is installed
echo -e "${BLUE}[3/7]${NC} Checking if app is installed..."
APP_INSTALLED=$(adb shell pm list packages | grep "com.gliderk.cakecalc" | wc -l)

if [ "$APP_INSTALLED" -eq 0 ]; then
    echo -e "${YELLOW}⚠ App not installed${NC}"
    echo ""
    echo -e "${BLUE}Installing app...${NC}"
    adb install -r CakeCost-release.apk
    echo -e "${GREEN}✓ App installed${NC}"
else
    echo -e "${GREEN}✓ App already installed${NC}"
    echo ""
    echo "Reinstalling to ensure latest version..."
    adb install -r CakeCost-release.apk
    echo -e "${GREEN}✓ App reinstalled${NC}"
fi
echo ""

# Get app version
echo -e "${BLUE}[4/7]${NC} Getting app info..."
adb shell dumpsys package com.gliderk.cakecalc | grep "versionName" | head -1
echo ""

# Clear old logs
echo -e "${BLUE}[5/7]${NC} Clearing old logs..."
adb logcat -c
echo -e "${GREEN}✓ Logs cleared${NC}"
echo ""

# Start app and capture logs
echo -e "${BLUE}[6/7]${NC} Starting app and capturing logs..."
echo ""
echo "Press Ctrl+C to stop log capture"
echo "================================"
echo ""

# Start the app
adb shell am start -n com.gliderk.cakecalc/.MainActivity

# Create logs directory
mkdir -p logs
LOG_FILE="logs/crash-log-$(date +%Y%m%d-%H%M%S).txt"

echo "Capturing logs to: $LOG_FILE"
echo ""

# Capture logs in background and also display them
adb logcat | tee "$LOG_FILE" | grep --line-buffered -i \
    -e "cakecost" \
    -e "🚀" \
    -e "📦" \
    -e "🗄️" \
    -e "✓" \
    -e "✅" \
    -e "❌" \
    -e "⚠️" \
    -e "ℹ️" \
    -e "FATAL" \
    -e "AndroidRuntime" \
    -e "chromium"

# This line is reached when user presses Ctrl+C
echo ""
echo "================================"
echo -e "${GREEN}✓ Logs saved to: $LOG_FILE${NC}"
echo ""
echo -e "${BLUE}[7/7]${NC} Log analysis:"
echo ""

# Analyze logs
if grep -q "Database initialization failed" "$LOG_FILE"; then
    echo -e "${RED}✗ SQLite initialization failed${NC}"
    echo "  Solution: Check DEBUG_EMULATOR_CRASH.md - SQLite section"
fi

if grep -q "AdMob: Initialization failed" "$LOG_FILE"; then
    echo -e "${YELLOW}⚠ AdMob failed to initialize${NC}"
    echo "  Solution: This is expected without google-services.json"
    echo "  See ADMOB_SETUP.md for full setup"
fi

if grep -q "✅ App initialization complete" "$LOG_FILE"; then
    echo -e "${GREEN}✓ App initialized successfully!${NC}"
    echo "  The app should be working now."
else
    echo -e "${RED}✗ App did not complete initialization${NC}"
    echo "  Check the log file: $LOG_FILE"
    echo "  See DEBUG_EMULATOR_CRASH.md for solutions"
fi

echo ""
echo "Full logs saved to: $LOG_FILE"
echo ""
