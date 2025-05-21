import { Platform, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

// Get UAE Pass configuration from app.config.js
const UAE_PASS_CONFIG = {
  clientId: Constants.expoConfig?.extra?.uaePass?.clientId || 'sandbox_stage',
  clientSecret: Constants.expoConfig?.extra?.uaePass?.clientSecret || 'sandbox_stage_secret',
  redirectUri: Constants.expoConfig?.extra?.uaePass?.redirectUri || 'propertymanagement://callback',
  // Extended scope for visitor integration
  scope: 'urn:uae:digitalid:profile:general urn:uae:digitalid:profile:general:profileType urn:uae:digitalid:profile:general:unifiedId',
  responseType: 'code',
  // ACR values - different for different flows
  acrValuesAppInstalled: 'urn:digitalid:authentication:flow:mobileondevice',
  acrValuesAppNotInstalled: 'urn:safelayer:tws:policies:authentication:level:low',
  // For push notification flow
  acrValuesPushNotification: 'urn:digitalid:authentication:flow:pushnotification',
  state: '', // Will be generated dynamically
  // API endpoints
  authorizationUrl: Constants.expoConfig?.extra?.uaePass?.authorizationUrl || 'https://stg-id.uaepass.ae/idshub/authorize',
  tokenUrl: Constants.expoConfig?.extra?.uaePass?.tokenUrl || 'https://stg-id.uaepass.ae/idshub/token',
  userInfoUrl: Constants.expoConfig?.extra?.uaePass?.userInfoUrl || 'https://stg-id.uaepass.ae/idshub/userinfo',
  logoutUrl: Constants.expoConfig?.extra?.uaePass?.logoutUrl || 'https://stg-id.uaepass.ae/idshub/logout',
  // UAE Pass app package and scheme
  androidPackage: 'ae.uaepass.mainapp.stg',
  iosScheme: Platform.OS === 'ios' ? 'uaepassstg://' : '',
};

export interface UaePassUserInfo {
  id: string;
  name: string;
  email: string;
  uaePassId: string;
  unifiedId?: string; // For visitor integration
  profileType?: string; // For visitor integration
  // Add other fields as needed based on the scope
}

// Authentication Method Enum
export enum AuthMethod {
  STANDARD = 'standard',
  PUSH_NOTIFICATION = 'push_notification',
  VISITOR = 'visitor',
}

class UaePassService {
  private static instance: UaePassService;
  private accessToken: string | null = null;
  private initialized: boolean = false;
  private authCodePromise: Promise<string> | null = null;
  private authCodeResolve: ((code: string) => void) | null = null;
  private authCodeReject: ((error: Error) => void) | null = null;
  private isUaePassAppInstalled: boolean = false;
  private currentAuthMethod: AuthMethod = AuthMethod.STANDARD;

  private constructor() {}

  static getInstance(): UaePassService {
    if (!UaePassService.instance) {
      UaePassService.instance = new UaePassService();
    }
    return UaePassService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Generate a random state value
      const state = await this.generateRandomState();
      UAE_PASS_CONFIG.state = state;
      
      // Check if UAE Pass app is installed
      await this.checkUaePassAppInstalled();
      
      this.initialized = true;
    } catch (error) {
      console.error('UAE Pass initialization error:', error);
      throw new Error('Failed to initialize UAE Pass');
    }
  }

  private async checkUaePassAppInstalled(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // For Android: Check by package name
        // Note: This is not fully implementable in JS - usually done with native modules
        // For the demo, we'll assume it's not installed
        this.isUaePassAppInstalled = false;
      } else if (Platform.OS === 'ios') {
        // For iOS: Check by URL scheme
        const canOpen = await Linking.canOpenURL(UAE_PASS_CONFIG.iosScheme);
        this.isUaePassAppInstalled = canOpen;
      } else {
        this.isUaePassAppInstalled = false;
      }
      console.log(`UAE Pass app installed: ${this.isUaePassAppInstalled}`);
    } catch (error) {
      console.error('Error checking UAE Pass app installation:', error);
      this.isUaePassAppInstalled = false;
    }
  }
  
  isAppInstalled(): boolean {
    return this.isUaePassAppInstalled;
  }
  
  private extractCodeFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('code');
    } catch (error) {
      console.error('Error extracting code from URL:', error);
      return null;
    }
  }
  
  private extractStateFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('state');
    } catch (error) {
      console.error('Error extracting state from URL:', error);
      return null;
    }
  }
  
  private createAuthCodePromise(): Promise<string> {
    // Reset any existing promise
    this.resetAuthState();
    
    return new Promise<string>((resolve, reject) => {
      this.authCodeResolve = resolve;
      this.authCodeReject = reject;
      
      // Set a timeout to reject the promise after 5 minutes
      setTimeout(() => {
        if (this.authCodeReject) {
          console.log('Auth code promise timed out');
          this.authCodeReject(new Error('Authentication timed out'));
          this.resetAuthState();
        }
      }, 5 * 60 * 1000); // 5 minutes
    });
  }
  
  private resetAuthState(): void {
    console.log('Resetting auth state');
    this.authCodePromise = null;
    this.authCodeResolve = null;
    this.authCodeReject = null;
  }

  private async generateRandomState(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    const state = Array.from(randomBytes)
      .map((byte: number) => byte.toString(16).padStart(2, '0'))
      .join('');
    return state;
  }

  setAuthMethod(method: AuthMethod): void {
    this.currentAuthMethod = method;
  }

  getAuthMethod(): AuthMethod {
    return this.currentAuthMethod;
  }

  async login(userIdentifier?: string): Promise<UaePassUserInfo> {
    try {
      console.log('Starting UAE Pass login process...');
      
      // Create a promise that will be resolved when we receive the auth code
      this.authCodePromise = this.createAuthCodePromise();
      console.log('Auth code promise created');
      
      // Get authorization code through browser or redirects
      console.log('Waiting for auth code...');
      const authCode = await this.authCodePromise;
      console.log('Auth code received:', authCode ? 'success' : 'null');
      
      if (!authCode) {
        throw new Error('Failed to obtain authorization code');
      }
      
      // Exchange code for access token
      console.log('Exchanging auth code for access token...');
      const token = await this.getAccessToken(authCode);
      console.log('Access token received:', token ? 'success' : 'null');

      // Get user information using the access token
      console.log('Fetching user information...');
      const userInfo = await this.getUserInfo(token);
      console.log('User info received:', userInfo ? 'success' : 'null');

      this.accessToken = token;
      // Store the token securely for later use
      await SecureStore.setItemAsync('uaepass_token', token);
      
      const mappedUserInfo = this.mapUserInfo(userInfo);
      console.log('Login process completed successfully');
      return mappedUserInfo;
    } catch (error) {
      console.error('UAE Pass login error:', error);
      throw new Error(error instanceof Error 
        ? `Failed to authenticate with UAE Pass: ${error.message}` 
        : 'Failed to authenticate with UAE Pass');
    } finally {
      // Clean up
      this.resetAuthState();
    }
  }

  getAuthorizationUrl(userIdentifier?: string): string {
    // Construct the authorization URL
    const authUrl = new URL(UAE_PASS_CONFIG.authorizationUrl);
    authUrl.searchParams.append('client_id', UAE_PASS_CONFIG.clientId);
    authUrl.searchParams.append('response_type', UAE_PASS_CONFIG.responseType);
    authUrl.searchParams.append('redirect_uri', UAE_PASS_CONFIG.redirectUri);
    authUrl.searchParams.append('scope', UAE_PASS_CONFIG.scope);
    authUrl.searchParams.append('state', UAE_PASS_CONFIG.state);
    
    // Add prompt=login to force authentication every time and ensure OTP flow
    authUrl.searchParams.append('prompt', 'login');
    
    // Use different ACR values based on authentication method
    let acrValue = UAE_PASS_CONFIG.acrValuesAppNotInstalled;
    
    if (this.currentAuthMethod === AuthMethod.PUSH_NOTIFICATION) {
      // For push notification flow
      acrValue = UAE_PASS_CONFIG.acrValuesPushNotification;
      
      // If user identifier is provided (email, mobile, or Emirates ID)
      if (userIdentifier) {
        authUrl.searchParams.append('login_hint', userIdentifier);
      }
    } else if (this.currentAuthMethod === AuthMethod.VISITOR) {
      // For visitor integration, use standard ACR values
      // But keep the extended scope for visitor attributes
      acrValue = this.isUaePassAppInstalled
        ? UAE_PASS_CONFIG.acrValuesAppInstalled
        : UAE_PASS_CONFIG.acrValuesAppNotInstalled;
    } else {
      // Standard authentication
      acrValue = this.isUaePassAppInstalled
        ? UAE_PASS_CONFIG.acrValuesAppInstalled
        : UAE_PASS_CONFIG.acrValuesAppNotInstalled;
    }
    
    authUrl.searchParams.append('acr_values', acrValue);
    
    return authUrl.toString();
  }

  getRedirectUri(): string {
    return UAE_PASS_CONFIG.redirectUri;
  }

  setAuthCode(code: string, state: string): void {
    console.log('Received auth code callback:', { codeExists: !!code, stateExists: !!state });
    
    // Validate state to prevent CSRF attacks
    if (state !== UAE_PASS_CONFIG.state) {
      console.error('State validation failed', { receivedState: state, expectedState: UAE_PASS_CONFIG.state });
      if (this.authCodeReject) {
        this.authCodeReject(new Error('Invalid state parameter'));
      }
      return;
    }
    
    if (this.authCodeResolve) {
      console.log('Resolving auth code promise');
      this.authCodeResolve(code);
    } else {
      console.error('Auth code resolver not available');
    }
  }

  private async getAccessToken(authCode: string): Promise<string> {
    try {
      // Prepare the request body
      const body = new URLSearchParams();
      body.append('grant_type', 'authorization_code');
      body.append('code', authCode);
      body.append('redirect_uri', UAE_PASS_CONFIG.redirectUri);
      body.append('client_id', UAE_PASS_CONFIG.clientId);
      body.append('client_secret', UAE_PASS_CONFIG.clientSecret);
      
      console.log('Requesting access token from:', UAE_PASS_CONFIG.tokenUrl);
      console.log('Request body:', {
        code: authCode.substring(0, 5) + '...',
        redirect_uri: UAE_PASS_CONFIG.redirectUri,
        client_id: UAE_PASS_CONFIG.clientId
      });
      
      // Exchange the authorization code for an access token
      let response;
      try {
        response = await fetch(UAE_PASS_CONFIG.tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: body.toString(),
        });
      } catch (networkError) {
        console.error('Network error during token request:', networkError);
        throw new Error(`Network error during token request: ${networkError instanceof Error ? networkError.message : 'Connection failed'}`);
      }
      
      console.log('Response status from token endpoint:', response.status);
      
      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        
        console.error('Token request failed:', { 
          status: response.status, 
          response: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        throw new Error(`Token request failed (${response.status}): ${errorText}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse token response as JSON:', jsonError);
        const responseText = await response.text();
        console.error('Raw response:', responseText.substring(0, 200));
        throw new Error('Invalid JSON response from token endpoint');
      }
      
      if (!data || !data.access_token) {
        console.error('No access token in response:', data);
        throw new Error('No access token found in response');
      }
      
      console.log('Successfully received access token');
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  private async getUserInfo(token: string): Promise<any> {
    try {
      console.log('Requesting user info from:', UAE_PASS_CONFIG.userInfoUrl);
      
      // Get user information using the access token
      let response;
      try {
        response = await fetch(UAE_PASS_CONFIG.userInfoUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
        });
      } catch (networkError) {
        console.error('Network error during user info request:', networkError);
        throw new Error(`Network error during user info request: ${networkError instanceof Error ? networkError.message : 'Connection failed'}`);
      }
      
      console.log('Response status from user info endpoint:', response.status);
      
      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        
        console.error('User info request failed:', { 
          status: response.status, 
          response: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        throw new Error(`User info request failed (${response.status}): ${errorText}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse user info response as JSON:', jsonError);
        const responseText = await response.text();
        console.error('Raw response:', responseText.substring(0, 200));
        throw new Error('Invalid JSON response from user info endpoint');
      }
      
      if (!data) {
        console.error('Empty user info response');
        throw new Error('Empty user info response from UAE Pass');
      }
      
      console.log('Successfully received user info data', { 
        hasEmail: !!data.email,
        hasName: !!(data.firstnameEN || data.lastnameEN),
        userIdPresent: !!(data.sub || data.uuid || data.idn)
      });
      
      return data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  private mapUserInfo(uaePassUserInfo: any): UaePassUserInfo {
    // Map UAE Pass user info to our app's user model
    const userInfo: UaePassUserInfo = {
      id: uaePassUserInfo.sub || uaePassUserInfo.uuid || '',
      name: `${uaePassUserInfo.firstnameEN || ''} ${uaePassUserInfo.lastnameEN || ''}`.trim(),
      email: uaePassUserInfo.email || '',
      uaePassId: uaePassUserInfo.idn || uaePassUserInfo.uuid || '',
    };
    
    // Add visitor-specific fields if available
    if (uaePassUserInfo.unifiedId) {
      userInfo.unifiedId = uaePassUserInfo.unifiedId;
    }
    
    if (uaePassUserInfo.profileType) {
      userInfo.profileType = uaePassUserInfo.profileType;
    }
    
    return userInfo;
  }

  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        // Construct the logout URL
        const logoutUrl = new URL(UAE_PASS_CONFIG.logoutUrl);
        logoutUrl.searchParams.append('client_id', UAE_PASS_CONFIG.clientId);
        logoutUrl.searchParams.append('redirect_uri', UAE_PASS_CONFIG.redirectUri);
        
        // Call the UAE Pass logout endpoint
        await Linking.openURL(logoutUrl.toString());
      }
      
      // Clear the local token
      this.accessToken = null;
      await SecureStore.deleteItemAsync('uaepass_token');
    } catch (error) {
      console.error('UAE Pass logout error:', error);
      throw new Error('Failed to logout from UAE Pass');
    }
  }

  // For digital signature integration (unchanged as per requirements)
  // This would typically involve additional API calls to the document signing endpoints
  // To be implemented based on specific requirements

  // Force create a new auth code promise to prepare for authentication
  async prepareForAuthentication(): Promise<void> {
    // Reset any existing auth state and create a new promise
    this.resetAuthState();
    this.authCodePromise = this.createAuthCodePromise();
    console.log('Authentication preparation complete with new promise');
  }

  // Process authentication directly with code and state, bypassing the promise mechanism
  async processAuthentication(code: string, state: string): Promise<UaePassUserInfo> {
    console.log('Processing authentication directly with code and state');
    
    try {
      // Validate state to prevent CSRF attacks
      if (state !== UAE_PASS_CONFIG.state) {
        console.error('Invalid state parameter', { received: state, expected: UAE_PASS_CONFIG.state });
        throw new Error('Invalid state parameter. Authentication failed.');
      }
      
      console.log('State validation successful');
      
      // Exchange code for access token without going through the promise mechanism
      console.log('Exchanging code for access token...');
      let token;
      
      try {
        token = await this.getAccessToken(code);
        console.log('Access token received successfully:', token ? 'success' : 'null');
      } catch (tokenError) {
        console.error('Failed to get access token:', tokenError);
        throw new Error(`Access token request failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
      }
      
      if (!token) {
        console.error('Received null or empty access token');
        throw new Error('Authentication failed: Received empty token from UAE Pass');
      }
      
      // Get user information
      console.log('Fetching user information...');
      let userInfo;
      
      try {
        userInfo = await this.getUserInfo(token);
        console.log('User information fetched successfully:', JSON.stringify(userInfo).substring(0, 100) + '...');
      } catch (userInfoError) {
        console.error('Failed to get user info:', userInfoError);
        throw new Error(`User info request failed: ${userInfoError instanceof Error ? userInfoError.message : 'Unknown error'}`);
      }
      
      if (!userInfo) {
        console.error('Received null or empty user info');
        throw new Error('Authentication failed: Received empty user info from UAE Pass');
      }
      
      // Store the token
      this.accessToken = token;
      await SecureStore.setItemAsync('uaepass_token', token);
      
      // Map and return user info
      const mappedUserInfo = this.mapUserInfo(userInfo);
      console.log('Authentication process completed successfully with user data');
      return mappedUserInfo;
    } catch (error) {
      console.error('Error processing authentication:', error);
      throw error instanceof Error 
        ? new Error(`Authentication processing failed: ${error.message}`)
        : new Error('Authentication processing failed with unknown error');
    } finally {
      // Clean up auth state
      this.resetAuthState();
    }
  }
}

export const uaePassService = UaePassService.getInstance(); 