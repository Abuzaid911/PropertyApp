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

1. **EAS build fails**:
   - Make sure you're logged in with `npx eas login`
   - Verify your Expo account has the correct Apple/Google credentials
   - Check that the bundle identifier/package name is not already in use

2. **iOS build requires a paid Apple Developer account**:
   - iOS builds for real devices (not simulator) require an Apple Developer membership ($99/year)
   - Android builds can be created with a free Google Play Developer account

### Common Problems

1. **"Metro bundler not running"**:
   - Stop all running processes and restart the setup script

2. **"Cannot connect to Expo server"**:
   - Ensure your mobile device is on the same network as your computer

3. **"UAE Pass callback not working"**:
   - Check that the ngrok URL is correctly configured in the .env file
   - Verify the proxy server is running

## Additional Resources

- [UAE Pass Developer Documentation](https://docs.uaepass.ae/)
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [ngrok Documentation](https://ngrok.com/docs) 