#!/bin/bash

# CakeCost Android Release Build Script
# This script automates the process of building a signed release for Play Store

set -e  # Exit on error

echo "🍰 CakeCost Release Build Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if key.properties exists
if [ ! -f "android/key.properties" ]; then
    echo -e "${RED}❌ Error: android/key.properties not found${NC}"
    echo ""
    echo "Please create it first:"
    echo "  cp android/key.properties.example android/key.properties"
    echo "  # Then edit it with your keystore credentials"
    echo ""
    exit 1
fi

# Check if keystore file exists
KEYSTORE_PATH=$(grep "storeFile=" android/key.properties | cut -d'=' -f2)
# storeFile may be absolute or relative to android/
case "$KEYSTORE_PATH" in
    /*) KEYSTORE_FULL_PATH="$KEYSTORE_PATH" ;;
    *)  KEYSTORE_FULL_PATH="android/$KEYSTORE_PATH" ;;
esac

if [ ! -f "$KEYSTORE_FULL_PATH" ]; then
    echo -e "${RED}❌ Error: Keystore file not found at $KEYSTORE_FULL_PATH${NC}"
    echo ""
    echo "Please check the storeFile path in android/key.properties"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Configuration files found${NC}"
echo ""

# Step 1: Build web app
echo "📦 Step 1: Building web application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Web build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Web build completed${NC}"
echo ""

# Step 2: Sync with Capacitor
echo "🔄 Step 2: Syncing with Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Capacitor sync failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Capacitor sync completed${NC}"
echo ""

# Step 3: Build AAB and APK
echo "🏗️  Step 3: Building Android App Bundle (AAB) and APK..."
cd android
./gradlew bundleRelease assembleRelease

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Android build failed${NC}"
    cd ..
    exit 1
fi

cd ..

echo -e "${GREEN}✓ Android build completed${NC}"
echo ""

# Step 4: Sign APK
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    echo "🔐 Step 4: Signing APK..."

    # Check if apksigner is available
    APKSIGNER="$HOME/Android/Sdk/build-tools/35.0.0/apksigner"

    if [ ! -f "$APKSIGNER" ]; then
        echo -e "${YELLOW}⚠ apksigner not found, trying to find another version...${NC}"
        # Find any apksigner
        APKSIGNER=$(find "$HOME/Android/Sdk/build-tools" -name "apksigner" | head -1)

        if [ -z "$APKSIGNER" ]; then
            echo -e "${YELLOW}⚠ Could not find apksigner, APK will not be signed${NC}"
            echo "  Install Android SDK build-tools to sign APK"
        fi
    fi

    if [ -n "$APKSIGNER" ] && [ -f "$APKSIGNER" ]; then
        KEYSTORE_FILE=$(grep "storeFile=" android/key.properties | cut -d'=' -f2)
        KEY_ALIAS=$(grep "keyAlias=" android/key.properties | cut -d'=' -f2)
        STORE_PASS=$(grep "storePassword=" android/key.properties | cut -d'=' -f2)
        KEY_PASS=$(grep "keyPassword=" android/key.properties | cut -d'=' -f2)

        "$APKSIGNER" sign \
            --ks "$KEYSTORE_FILE" \
            --ks-key-alias "$KEY_ALIAS" \
            --ks-pass "pass:$STORE_PASS" \
            --key-pass "pass:$KEY_PASS" \
            "$APK_PATH"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ APK signed successfully${NC}"
        else
            echo -e "${RED}❌ APK signing failed${NC}"
        fi
    fi
    echo ""
fi

# Step 5: Copy files to project root
echo "📋 Copying release files to project root..."
cp android/app/build/outputs/bundle/release/app-release.aab CakeCost-release.aab 2>/dev/null || true
cp android/app/build/outputs/apk/release/app-release.apk CakeCost-release.apk 2>/dev/null || true
echo -e "${GREEN}✓ Files copied${NC}"
echo ""

# Step 6: Verify output
AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

echo "📋 Build Summary:"
echo "----------------"

if [ -f "$AAB_PATH" ]; then
    AAB_SIZE=$(du -h "$AAB_PATH" | cut -f1)
    echo -e "${GREEN}✓ AAB (for Play Store): $AAB_PATH${NC}"
    echo "  Size: $AAB_SIZE"

    # Verify AAB signature
    jarsigner -verify "$AAB_PATH" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Signed${NC}"
    else
        echo -e "  ${RED}✗ Not signed${NC}"
    fi
else
    echo -e "${RED}✗ AAB not found${NC}"
fi

echo ""

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo -e "${GREEN}✓ APK (for testing): $APK_PATH${NC}"
    echo "  Size: $APK_SIZE"

    # Verify APK signature
    APKSIGNER="$HOME/Android/Sdk/build-tools/35.0.0/apksigner"
    if [ -f "$APKSIGNER" ]; then
        "$APKSIGNER" verify "$APK_PATH" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✓ Signed${NC}"
        else
            echo -e "  ${RED}✗ Not signed${NC}"
        fi
    fi
else
    echo -e "${RED}✗ APK not found${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 BUILD SUCCESSFUL!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1. 📱 Test APK on device:"
echo "   adb install -r $APK_PATH"
echo ""
echo "2. 📤 Upload AAB to Play Store:"
echo "   https://play.google.com/console"
echo ""
echo "3. 📢 For AdMob setup (if ads crash):"
echo "   See ADMOB_SETUP.md"
echo ""
