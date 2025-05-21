import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Linking, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, Text } from 'react-native-paper';

interface UaePassWebViewProps {
  authUrl: string;
  redirectUri: string;
  onSuccess: (code: string) => void;
  onFailure: (error: Error) => void;
  onClose: () => void;
  isUaePassAppInstalled: boolean;
}

export const UaePassWebView = ({
  authUrl,
  redirectUri,
  onSuccess,
  onFailure,
  onClose,
  isUaePassAppInstalled,
}: UaePassWebViewProps) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [failureUrl, setFailureUrl] = useState<string | null>(null);

  useEffect(() => {
    // Handle back button press
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    // Listen for deep link events
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      
      if (url.startsWith('propertymanagement:///resume_authn')) {
        // Extract the original callback URL
        const originalUrl = extractOriginalUrl(url);
        if (originalUrl) {
          // Load the original URL in the WebView
          webViewRef.current?.injectJavaScript(`window.location.href = '${originalUrl}';`);
        }
      }
    };

    // Set up deep link listener
    Linking.addEventListener('url', handleDeepLink);

    return () => {
      backHandler.remove();
      // Remove the listener
    };
  }, []);

  const extractOriginalUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('url');
    } catch (error) {
      console.error('Error extracting original URL:', error);
      return null;
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    // Handle loading state
    setLoading(navState.loading);

    // Check if navigation reached the redirect URI (authentication complete)
    if (url.startsWith(redirectUri)) {
      try {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');
        
        if (code) {
          onSuccess(code);
        } else if (error) {
          onFailure(new Error(`Authentication failed: ${error}`));
        }
      } catch (error) {
        console.error('Error parsing redirect URL:', error);
        onFailure(new Error('Failed to parse authentication response'));
      }
      return;
    }

    // For UAE Pass app installed scenario, intercept the UAE Pass deep linking URL
    if (isUaePassAppInstalled && url.startsWith('uaepassstg://')) {
      try {
        const urlObj = new URL(url);
        
        // Store original success and failure URLs
        const originalSuccessUrl = urlObj.searchParams.get('successURL');
        const originalFailureUrl = urlObj.searchParams.get('failureURL');
        
        if (originalSuccessUrl) {
          setSuccessUrl(originalSuccessUrl);
        }
        
        if (originalFailureUrl) {
          setFailureUrl(originalFailureUrl);
        }
        
        // Rewrite the URL with our app scheme
        let modifiedUrl = url;
        if (originalSuccessUrl) {
          modifiedUrl = modifiedUrl.replace(
            `successURL=${encodeURIComponent(originalSuccessUrl)}`,
            `successURL=${encodeURIComponent(`propertymanagement:///resume_authn?url=${encodeURIComponent(originalSuccessUrl)}`)}`
          );
        }
        
        if (originalFailureUrl) {
          modifiedUrl = modifiedUrl.replace(
            `failureURL=${encodeURIComponent(originalFailureUrl)}`,
            `failureURL=${encodeURIComponent(`propertymanagement:///resume_authn?url=${encodeURIComponent(originalFailureUrl)}`)}`
          );
        }
        
        // Open the modified URL to launch UAE Pass app
        Linking.openURL(modifiedUrl);
        
        return;
      } catch (error) {
        console.error('Error processing UAE Pass URL:', error);
        onFailure(new Error('Failed to process UAE Pass authentication URL'));
      }
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: authUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Loading UAE Pass...</Text>
          </View>
        )}
      />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 