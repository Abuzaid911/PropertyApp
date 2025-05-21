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
    return new Promise<string>((resolve, reject) => {
      this.authCodeResolve = resolve;
      this.authCodeReject = reject;
      
      // Set a timeout to reject the promise after 5 minutes
      setTimeout(() => {
        if (this.authCodeReject) {
          this.authCodeReject(new Error('Authentication timeout'));
          this.authCodeResolve = null;
          this.authCodeReject = null;
        }
      }, 5 * 60 * 1000);
    });
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
      // Create a promise that will be resolved when we receive the auth code
      this.authCodePromise = this.createAuthCodePromise();
      
      // Get authorization code through browser or redirects
      const authCode = await this.authCodePromise;
      
      // Exchange code for access token
      const token = await this.getAccessToken(authCode);

      // Get user information using the access token
      const userInfo = await this.getUserInfo(token);

      this.accessToken = token;
      // Store the token securely for later use
      await SecureStore.setItemAsync('uaepass_token', token);
      
      return this.mapUserInfo(userInfo);
    } catch (error) {
      console.error('UAE Pass login error:', error);
      throw new Error('Failed to authenticate with UAE Pass');
    } finally {
      // Clean up
      this.authCodePromise = null;
      this.authCodeResolve = null;
      this.authCodeReject = null;
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
    // Validate state to prevent CSRF attacks
    if (state !== UAE_PASS_CONFIG.state) {
      if (this.authCodeReject) {
        this.authCodeReject(new Error('Invalid state parameter'));
      }
      return;
    }
    
    if (this.authCodeResolve) {
      this.authCodeResolve(code);
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
      
      // Exchange the authorization code for an access token
      const response = await fetch(UAE_PASS_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      
      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  private async getUserInfo(token: string): Promise<any> {
    try {
      // Get user information using the access token
      const response = await fetch(UAE_PASS_CONFIG.userInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`User info request failed: ${response.status}`);
      }
      
      return await response.json();
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
}

export const uaePassService = UaePassService.getInstance(); 