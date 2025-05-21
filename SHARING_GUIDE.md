# External User Guide for Property Management App

This guide will walk you through how to set up and run the Property Management App with UAE Pass integration on your local machine.

## Prerequisites

1. **Node.js and npm**: Install Node.js (v14 or later) from [nodejs.org](https://nodejs.org/)
2. **Expo CLI**: Install Expo CLI globally
   ```bash
   npm install -g expo-cli
   ```
3. **Expo Go app**: Install on your physical device from [App Store](https://apps.apple.com/app/apple-store/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
4. **ngrok account**: Create a free account at [ngrok.com](https://ngrok.com/signup)

## Step 1: Clone the Repository

```bash
git clone https://github.com/Abuzaid911/PropertyApp.git
cd PropertyApp
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up ngrok

1. Install ngrok globally:
   ```bash
   npm install -g ngrok
   ```

2. Authenticate ngrok with your authtoken (found in your ngrok dashboard):
   ```bash
   ngrok authtoken YOUR_NGROK_AUTHTOKEN
   ```

## Step 4: Configure the App

Create a `.env` file in the project root with your ngrok URL (you'll get this after step 5):

```
NGROK_URL=https://your-ngrok-url.ngrok-free.app
```

Note: The script will update this for you once ngrok is running.

## Step 5: Run the App with ngrok Integration

1. Make the setup script executable:
   ```bash
   chmod +x setup-ngrok.sh
   ```

2. Run the setup script:
   ```bash
   ./setup-ngrok.sh
   ```

   This will:
   - Start the Expo development server
   - Start the proxy server for UAE Pass callback
   - Launch ngrok to create a public URL
   - Update the .env file with your unique ngrok URL

3. Once running, you'll see a QR code in the terminal. Scan it with the Expo Go app on your mobile device.

## Running on a Simulator/Emulator

If you prefer running on a simulator instead of a physical device:

- For iOS Simulator (Mac only):
  ```bash
  npx expo start --ios
  ```

- For Android Emulator:
  ```bash
  npx expo start --android
  ```

## Building for Distribution

To create a standalone version of the app that can be shared with others without requiring them to set up the development environment:

### Prerequisites for Building

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account (create one at [expo.dev](https://expo.dev/signup) if you don't have one):
   ```bash
   npx eas login
   ```

3. Configure EAS with your project ID:
   ```bash
   npx eas init
   ```
   
   Note: This step is already done for the project (with ID: bb665593-48c8-4113-a06a-8a5618e2680b)

### Build for Android

To create an APK that can be installed directly on Android devices:

```bash
npx eas build -p android --profile preview
```

This will:
1. Build your app on Expo's build service
2. Provide a download link for the APK
3. Allow you to share the APK file directly with others

### Build for iOS (Requires Apple Developer Account)

For iOS simulator builds:

```bash
npx eas build -p ios --profile preview
```

For TestFlight distribution:

```bash
npx eas build -p ios --profile production
```

Note: iOS builds require an Apple Developer account ($99/year). Make sure your Apple Developer account is properly configured in your Expo account before building for iOS.

### Using EAS Update

EAS Update allows you to push JavaScript and asset updates to your app without going through the app store review process or requiring users to download a new version.

#### Configuring EAS Update

The app is already configured for EAS Update in the app.config.js file with:

```javascript
{
  "updates": {
    "url": "https://u.expo.dev/bb665593-48c8-4113-a06a-8a5618e2680b"
  },
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

#### Publishing Updates

After making changes to your app, you can publish updates to all users with:

```bash
npx eas update --auto
```

Or to a specific channel (like "preview" or "production"):

```bash
npx eas update --channel preview --message "Bug fixes and performance improvements"
```

#### Testing Updates

Users with the app installed will receive updates automatically when they open the app (if they're connected to the internet). To test this:

1. Build and install the app on a device
2. Make changes to the app
3. Publish an update
4. Open the app on the device to receive the update

### Customizing Build Configurations

The build configurations are defined in the `eas.json` file. You can modify these configurations based on your needs:

- **development**: For development builds that include the Expo development client
- **preview**: For testing builds that can be shared with teammates (APK for Android, simulator builds for iOS)
- **production**: For final builds to be published to the App Store or Google Play

### Sharing Built Apps

1. **Android**: 
   - Share the APK file directly with your users
   - Users can install it by opening the file on their device

2. **iOS**: 
   - Invite users to TestFlight through App Store Connect
   - Users will need to install TestFlight before they can install your app

### Note on Built Applications

The built applications will use the default redirectUri configured in app.config.js (`propertymanagement://callback`). For production builds, you should:

1. Deploy the proxy server to a stable server with a fixed domain instead of using ngrok
2. Update the app.config.js with your production redirect URI before building

## Testing UAE Pass Integration

### Standard Authentication

1. Launch the app and go to the login screen
2. Select "Standard" authentication method
3. Press "Login with UAE Pass"
4. If UAE Pass app is installed, it will open for authentication
5. If not installed, a browser will open for username/password login
6. After successful authentication, the app will receive the token and log you in

### Push Notification Authentication

1. Launch the app and go to the login screen
2. Select "Push Notification" authentication method
3. Enter your UAE Pass identifier (email, mobile, or Emirates ID)
4. Press "Send Push Notification"
5. Check your other device with UAE Pass app installed
6. Confirm the authentication request
7. The app will automatically log you in after confirmation

### Visitor Authentication

1. Launch the app and go to the login screen
2. Select "Visitor" authentication method
3. Press "Login as Visitor"
4. Complete the UAE Pass visitor authentication flow
5. The app will display your visitor profile information
6. You'll be redirected to the home screen

## Troubleshooting

### New ngrok URL Each Session

Note that the free ngrok plan generates a new URL each time you start it. You'll need to:
1. Let the setup script update the .env file
2. Restart the app if it was already running

### UAE Pass Authentication Issues

- Make sure your mobile device can access the internet
- Ensure the ngrok session is active and the URL is correctly configured
- For testing, use the UAE Pass staging environment credentials

### Build Issues

1. **EAS build fails for Android**:
   - Make sure all required assets exist:
     ```bash
     ls -la assets/
     # Verify icon.png, adaptive-icon.png, and splash.png exist
     ```
   - If any assets are missing, fix them:
     ```bash
     # Example: If splash.png is missing but splash-icon.png exists
     cp assets/splash-icon.png assets/splash.png
     ```
   - Ensure Android SDK configuration is correct in app.config.js:
     ```javascript
     plugins: [
       [
         "expo-build-properties",
         {
           "android": {
             "compileSdkVersion": 35, // Must be at least 35 for latest dependencies
             "targetSdkVersion": 35,
             "buildToolsVersion": "35.0.0"
           }
         }
       ]
     ]
     ```
   - If you encounter "checkAarMetadata" errors, it means your Android SDK version is too low
   - Clear the build cache and try again:
     ```bash
     npx eas build --clear-cache -p android --profile preview
     ```
   - Update your EAS CLI:
     ```bash
     npm install -g eas-cli@latest
     ```
   - You can also perform a local build to debug issues:
     ```bash
     npx expo prebuild --platform android
     cd android
     ./gradlew assembleDebug
     ```

2. **EAS build fails for iOS**:
   - Make sure you're logged in with `npx eas login`
   - Verify your Expo account has the correct Apple/Google credentials
   - Check that the bundle identifier/package name is not already in use
   - iOS builds require a paid Apple Developer account ($99/year)
   - Ensure iOS deployment target is at least 15.1 in app.config.js:
     ```javascript
     plugins: [
       [
         "expo-build-properties",
         {
           "ios": {
             "deploymentTarget": "15.1" // This is the minimum required version
           }
         }
       ]
     ]
     ```
   - If you encounter other iOS build errors, try running:
     ```bash
     npx eas build --clear-cache -p ios --profile preview
     ```

3. **EAS Update issues**:
   - Make sure expo-updates is installed:
     ```bash
     npx expo install expo-updates
     ```
   - Verify your app.config.js has the correct updates configuration:
     ```javascript
     updates: {
       url: "https://u.expo.dev/YOUR_PROJECT_ID",
       fallbackToCacheTimeout: 0
     },
     runtimeVersion: {
       policy: "appVersion"
     }
     ```
   - If you get "Invalid EAS Update" errors, make sure you're logged in with the correct Expo account

4. **Android installation issues**:
   - If the APK fails to install, make sure "Install from unknown sources" is enabled on the device
   - Some devices may require you to uninstall previous versions first
   - Verify the APK is built for the correct Android SDK version

### Common Problems

1. **"Metro bundler not running"**:
   - Stop all running processes and restart the setup script

2. **"Cannot connect to Expo server"**:
   - Ensure your mobile device is on the same network as your computer

3. **"UAE Pass callback not working"**:
   - Check that the ngrok URL is correctly configured in the .env file
   - Verify the proxy server is running

4. **"Plugin errors during build"**:
   - Ensure all required plugins are installed:
     ```bash
     npm install expo-secure-store expo-web-browser expo-build-properties expo-updates
     ```
   - Make sure app.config.js correctly references all plugins

5. **"iOS deployment target" errors**:
   - Expo and EAS Build may require specific minimum iOS versions
   - The current minimum is iOS 15.1
   - If you encounter deployment target errors, update the configuration in app.config.js

6. **"Channel configuration" errors**:
   - These are related to EAS Update. Make sure your app.config.js includes the required configuration
   - If you get this error during build, add the updates and runtimeVersion fields as shown in the EAS Update section

7. **"Android SDK version" errors**:
   - The error "Execution failed for task ':app:checkReleaseAarMetadata'" indicates SDK version mismatch
   - Some dependencies require compileSdk version 35 or higher
   - Update the Android SDK configuration in app.config.js as shown in the build issues section

## Additional Resources

- [UAE Pass Developer Documentation](https://docs.uaepass.ae/)
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [ngrok Documentation](https://ngrok.com/docs)
- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/) 