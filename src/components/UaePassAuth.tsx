import React, { useState, useEffect, useRef, useReducer } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, SegmentedButtons } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview'; 
import { uaePassService, AuthMethod } from '../services/UaePassService';
import { PushNotificationAuth } from './PushNotificationAuth';
import { VisitorAuth } from './VisitorAuth';

interface UaePassAuthProps {
  onSuccess: (userInfo: any) => void;
  onFailure: (error: Error) => void;
}

// Dummy reducer to force render update
const forceUpdateReducer = (state: number): number => state + 1;

export const UaePassAuth: React.FC<UaePassAuthProps> = ({ onSuccess, onFailure }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<string>(AuthMethod.STANDARD);
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const processingAuth = useRef(false);
  const unmounted = useRef(false);
  const webViewRef = useRef<WebView>(null);
  
  // Force update hook
  const [, forceUpdate] = useReducer(forceUpdateReducer, 0);

  // Set up linking listener for UAE Pass redirects
  useEffect(() => {
    // Initialize UAE Pass
    initializeUaePass();
    
    // Handle deep linking from UAE Pass
    const subscription = Linking.addEventListener('url', handleRedirectUrl);
    
    // Get the initial URL that opened the app (if any)
    Linking.getInitialURL().then(url => {
      if (url && !unmounted.current) {
        console.log('App opened with URL:', url);
        handleRedirectUrl({ url });
      }
    });
    
    return () => {
      // Clean up the subscription
      subscription.remove();
      unmounted.current = true;
    };
  }, []);

  // Effect to handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Ensure we clean up resources even if component unmounts during auth
      processingAuth.current = false;
      unmounted.current = true;
      
      // This is extreme but needed in some cases
      setIsLoading(false);
      setShowWebView(false);
      forceUpdate();
    };
  }, []);

  const initializeUaePass = async () => {
    try {
      await uaePassService.initialize();
      console.log('UAE Pass initialized successfully');
    } catch (error) {
      console.error('Failed to initialize UAE Pass:', error);
      if (!unmounted.current) {
        setError('Failed to initialize UAE Pass. Please try again later.');
      }
    }
  };

  // Reset all states to initial values
  const resetState = () => {
    if (unmounted.current) return;
    setIsLoading(false);
    setError(null);
    setShowWebView(false);
    processingAuth.current = false;
    forceUpdate();
  };

  const handleStandardLogin = async () => {
    if (unmounted.current) return;
    setIsLoading(true);
    setError(null);
    processingAuth.current = false;
    forceUpdate();

    try {
      // Set authentication method to standard
      console.log('Setting auth method to standard');
      uaePassService.setAuthMethod(AuthMethod.STANDARD);
      
      // Force create a new auth code promise before opening the browser
      console.log('Creating fresh auth code promise');
      await uaePassService.prepareForAuthentication();
      
      // Get the authorization URL
      const url = uaePassService.getAuthorizationUrl();
      console.log('Authorization URL:', url);
      
      // Check if UAE Pass app is installed
      const isAppInstalled = uaePassService.isAppInstalled();
      
      if (isAppInstalled) {
        // Use browser-based flow if app is installed
        console.log('UAE Pass app is installed, using browser flow');
        Alert.alert(
          "UAE Pass Authentication",
          "You will be redirected to UAE Pass for authentication. Please complete the verification before returning to the app.",
          [{ text: "Continue", onPress: () => startBrowserAuthentication(url) }],
          { cancelable: true, onDismiss: () => {
            setIsLoading(false);
            forceUpdate();
          }}
        );
      } else {
        // Use WebView-based flow if app is not installed
        console.log('UAE Pass app is not installed, using WebView flow');
        setAuthUrl(url);
        setShowWebView(true);
        setIsLoading(false);
        forceUpdate();
      }
    } catch (error) {
      console.error('Login error:', error);
      if (unmounted.current) return;
      
      setError(`Failed to start login with UAE Pass: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      processingAuth.current = false;
      forceUpdate();
    }
  };
  
  const startBrowserAuthentication = async (url: string) => {
    try {
      // Get the redirect URI
      const redirectUri = uaePassService.getRedirectUri();
      console.log('Redirect URI:', redirectUri);
      
      // Open the authorization URL in browser
      console.log('Opening auth session in browser');
      
      // Open the browser with appropriate options
      const result = await WebBrowser.openAuthSessionAsync(
        url,
        redirectUri,
        { 
          showInRecents: true,
          createTask: true
        }
      );
      
      console.log('Browser auth session result:', result);
      
      // Handle the result
      if (unmounted.current) {
        console.log('Component unmounted, ignoring result');
        return;
      }
      
      if (result.type === 'cancel') {
        console.log('Auth was cancelled by user');
        setError('Authentication was cancelled');
        setIsLoading(false);
        forceUpdate();
      } else if (result.type === 'success' && !processingAuth.current) {
        console.log('Auth success, URL:', result.url);
        // Handle success directly if WebBrowser returns the URL
        processingAuth.current = true;
        forceUpdate();
        await handleAuthSuccess(result.url);
      } else {
        console.log('Auth failed or already being processed');
        if (!processingAuth.current) {
          setError('Authentication failed. Please try again.');
          setIsLoading(false);
          forceUpdate();
        }
      }
    } catch (error) {
      console.error('Authentication start error:', error);
      if (unmounted.current) return;
      
      setError(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      processingAuth.current = false;
      forceUpdate();
    }
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    console.log('WebView navigation state:', navState.url);
    
    // Get the redirect URI
    const redirectUri = uaePassService.getRedirectUri();
    
    // Check if the URL is the redirect URI
    if (navState.url.startsWith(redirectUri) && !processingAuth.current) {
      console.log('WebView detected redirect URI:', navState.url);
      processingAuth.current = true;
      
      // Hide WebView immediately to prevent further navigation
      setShowWebView(false);
      setIsLoading(true);
      forceUpdate();
      
      // Process authentication
      handleAuthSuccess(navState.url);
    }
  };

  const handleAuthSuccess = async (url: string) => {
    if (processingAuth.current && unmounted.current) {
      console.log('Component unmounted or auth already being processed, ignoring');
      return;
    }
    
    processingAuth.current = true;
    
    if (!unmounted.current) {
      setIsLoading(true);
      forceUpdate();
    }
    
    try {
      console.log('Processing auth success URL:', url);
      
      // Parse the URL to extract code and state
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      
      console.log('Extracted code and state:', { codeExists: !!code, stateExists: !!state });

      if (code && state) {
        try {
          // Process login directly with the code and state
          console.log('Processing login directly with code and state');
          const userInfo = await uaePassService.processAuthentication(code, state);
          
          console.log('Login successful, user info:', userInfo);
          
          // Important: Set unmounted ref before calling onSuccess
          // This prevents any state updates after the component should be gone
          unmounted.current = true;
          
          // Also reset the loading state to be double sure
          if (!unmounted.current) {
            setIsLoading(false);
            processingAuth.current = false;
            forceUpdate();
          }
          
          // Call the success callback with the user info
          onSuccess(userInfo);
          return;
        } catch (error) {
          console.error('Error during login process:', error);
          if (!unmounted.current) {
            onFailure(error instanceof Error ? error : new Error('Authentication processing failed'));
          }
        }
      } else {
        console.error('Missing code or state in redirect URL');
        throw new Error('Invalid response from UAE Pass: missing code or state');
      }
    } catch (error) {
      console.error('Auth success handling error:', error);
      if (!unmounted.current) {
        onFailure(error instanceof Error ? error : new Error('Failed to process authentication response'));
      }
    } finally {
      // Ensure we reset states here as a fallback
      if (!unmounted.current) {
        setIsLoading(false);
        processingAuth.current = false;
        forceUpdate();
      }
    }
  };

  const handleRedirectUrl = async (event: { url: string }) => {
    try {
      const { url } = event;
      console.log('Received redirect URL:', url);
      
      if (unmounted.current) {
        console.log('Component unmounted, ignoring redirect');
        return;
      }
      
      // Check if the URL matches our redirect URI
      const redirectUri = uaePassService.getRedirectUri();
      if (url.startsWith(redirectUri) && !processingAuth.current) {
        console.log('URL matches redirect URI, processing auth...');
        await handleAuthSuccess(url);
      } else {
        console.log('URL does not match redirect URI or auth already in progress, ignoring');
      }
    } catch (error) {
      console.error('Redirect URL handling error:', error);
      if (!unmounted.current) {
        onFailure(error instanceof Error ? error : new Error('Authentication failed'));
        setIsLoading(false);
        processingAuth.current = false;
        forceUpdate();
      }
    }
  };

  // If unmounted, don't render anything
  if (unmounted.current) {
    return null;
  }

  // If webview is shown, render only it
  if (showWebView) {
    return (
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: authUrl }}
          style={styles.webView}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          incognito={true} // Use incognito mode to avoid cookie/session issues
          cacheEnabled={false}
          onError={(e) => {
            console.error('WebView error:', e.nativeEvent);
            setShowWebView(false);
            setError(`WebView error: ${e.nativeEvent.description}`);
            forceUpdate();
          }}
        />
        <Button 
          mode="outlined" 
          onPress={() => {
            setShowWebView(false);
            resetState();
          }}
          style={styles.closeButton}
        >
          Cancel
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Choose Authentication Method</Text>
      
      <SegmentedButtons
        value={authMethod}
        onValueChange={value => {
          setAuthMethod(value);
          forceUpdate();
        }}
        buttons={[
          {
            value: AuthMethod.STANDARD,
            label: 'Standard',
            icon: 'login',
          },
          {
            value: AuthMethod.PUSH_NOTIFICATION,
            label: 'Push Not...',
            icon: 'cellphone-arrow-down',
          },
          {
            value: AuthMethod.VISITOR,
            label: 'Visitor',
            icon: 'account-key',
          },
        ]}
        style={styles.segmentedButtons}
      />
      
      {authMethod === AuthMethod.STANDARD && (
        <View style={styles.methodContainer}>
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <Button
            mode="contained"
            onPress={handleStandardLogin}
            disabled={isLoading}
            style={styles.button}
            icon="login"
            loading={isLoading}
          >
            Login with UAE Pass
          </Button>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              UAE Pass App Status: {uaePassService.isAppInstalled() ? 'Installed' : 'Not Installed'}
            </Text>
            <Text style={styles.statusDescription}>
              {uaePassService.isAppInstalled() 
                ? 'Authentication will open UAE Pass app for verification.' 
                : 'Authentication will use username and password.'}
            </Text>
          </View>
        </View>
      )}
      
      {authMethod === AuthMethod.PUSH_NOTIFICATION && (
        <PushNotificationAuth 
          onSuccess={(userInfo) => {
            // Important: Set unmounted ref before calling onSuccess
            unmounted.current = true;
            
            // Reset loading state before calling success callback
            if (!unmounted.current) {
              setIsLoading(false);
              processingAuth.current = false;
              forceUpdate();
            }
            
            onSuccess(userInfo);
          }}
          onFailure={(error) => {
            // Reset loading state before calling failure callback
            if (!unmounted.current) {
              setIsLoading(false);
              processingAuth.current = false;
              forceUpdate();
              onFailure(error);
            }
          }}
        />
      )}
      
      {authMethod === AuthMethod.VISITOR && (
        <VisitorAuth 
          onSuccess={(userInfo) => {
            // Important: Set unmounted ref before calling onSuccess
            unmounted.current = true;
            
            // Reset loading state before calling success callback
            if (!unmounted.current) {
              setIsLoading(false);
              processingAuth.current = false;
              forceUpdate();
            }
            
            onSuccess(userInfo);
          }}
          onFailure={(error) => {
            // Reset loading state before calling failure callback
            if (!unmounted.current) {
              setIsLoading(false);
              processingAuth.current = false;
              forceUpdate();
              onFailure(error);
            }
          }}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  methodContainer: {
    paddingTop: 8,
  },
  button: {
    width: '100%',
    paddingVertical: 8,
  },
  errorText: {
    color: '#B00020',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '100%',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  webViewContainer: {
    width: '100%',
    height: 480,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  }
}); 