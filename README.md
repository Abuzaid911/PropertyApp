# Property Management App

A mobile application for managing property rentals and leases in the UAE, with integrated UAE Pass authentication.

## Features

- UAE Pass Authentication with Browser Integration
  - Standard Authentication
  - Push Notification Authentication
  - Visitor Authentication
- Property browsing and searching
- Virtual property tours
- Document and lease management
- Digital signatures with UAE Pass
- Tenant management
- Maintenance requests

## UAE Pass Integration

The application integrates with UAE Pass to provide a secure and simplified authentication experience for UAE residents and visitors.

### Authentication Methods

#### 1. Standard Authentication
- Offers standard UAE Pass login through a browser-based flow
- Handles both scenarios where the UAE Pass app is installed or not installed on the user's device
- Uses `expo-web-browser` for a secure authentication experience
- Automatically redirects back to the application after authentication

#### 2. Push Notification Authentication
- Allows users to provide their UAE Pass identifier (email, mobile, or Emirates ID)
- Sends a push notification to the user's registered UAE Pass device
- User confirms authentication on their other device
- Provides an alternative to the standard authentication flow

#### 3. Visitor Authentication
- Special authentication flow for visitors
- Captures visitor-specific information from UAE Pass
- Uses the visitor integration scope (`urn:uae:digitalid:profile:general:profileType urn:uae:digitalid:profile:general:unifiedId`)
- Particularly useful for temporary users or visitors to the UAE

### Implementation Details

The application uses the following approach:

1. **Browser-Based Authentication**: Utilizes `expo-web-browser` to open the UAE Pass authentication page outside the app for enhanced security.

2. **URL Scheme Handling**: Registers a custom URL scheme to handle callbacks from UAE Pass after authentication.

3. **Deep Link Handling**: Processes callback URLs to extract the authorization code.

4. **Token Exchange**: Exchanges the authorization code for an access token.

5. **User Information Retrieval**: Fetches user information using the access token.

## Prerequisites

- Node.js 14.x or later
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/property-management-app.git
cd property-management-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure UAE Pass credentials:
Create a `.env` file with your UAE Pass credentials:
```
UAE_PASS_CLIENT_ID=your_client_id
UAE_PASS_CLIENT_SECRET=your_client_secret
UAE_PASS_REDIRECT_URI=propertymanagement://callback
```

## Configuration

### URL Scheme Configuration

To handle callbacks from UAE Pass, you must configure a custom URL scheme:

1. In `app.json`, ensure the `scheme` field is set to `propertymanagement`:
```json
{
  "expo": {
    "scheme": "propertymanagement",
    ...
  }
}
```

2. The application automatically listens for deep links with this scheme and handles the OAuth redirects.

## Running the App

```bash
npm start
```

Then select your preferred platform (iOS, Android) from the Expo terminal options.

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

## Digital Signatures (Unchanged)

The digital signature functionality remains unchanged as per the UAE Pass Team's documentation. Document signing is available for authenticated users.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 