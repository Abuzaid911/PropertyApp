import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, TextInput, ActivityIndicator, HelperText } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import { uaePassService, AuthMethod } from '../services/UaePassService';

interface PushNotificationAuthProps {
  onSuccess: (userInfo: any) => void;
  onFailure: (error: Error) => void;
}

export const PushNotificationAuth: React.FC<PushNotificationAuthProps> = ({ onSuccess, onFailure }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<'email' | 'mobile' | 'eid'>('email');
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  
  const validateUserIdentifier = (): boolean => {
    if (!userIdentifier.trim()) {
      setError('Please enter your UAE Pass identifier');
      return false;
    }
    
    // Email validation
    if (identifierType === 'email') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(userIdentifier)) {
        setError('Please enter a valid email address');
        return false;
      }
    }
    
    // Mobile validation (UAE format)
    if (identifierType === 'mobile') {
      const mobileRegex = /^(050|055|056|052|054|058)\d{7}$/;
      if (!mobileRegex.test(userIdentifier)) {
        setError('Please enter a valid UAE mobile number (e.g., 0501234567)');
        return false;
      }
    }
    
    // Emirates ID validation
    if (identifierType === 'eid') {
      const eidRegex = /^\d{3}-\d{4}-\d{7}-\d{1}$/;
      if (!eidRegex.test(userIdentifier)) {
        setError('Please enter a valid Emirates ID (e.g., 784-1234-1234567-1)');
        return false;
      }
    }
    
    return true;
  };
  
  const handleLogin = async () => {
    setError(null);
    
    // Validate the user identifier
    if (!validateUserIdentifier()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Set authentication method to push notification
      uaePassService.setAuthMethod(AuthMethod.PUSH_NOTIFICATION);
      
      // Force create a new auth code promise
      await uaePassService.prepareForAuthentication();
      
      // Get authorization URL with user identifier as login hint
      const url = uaePassService.getAuthorizationUrl(userIdentifier);
      console.log('Push notification auth URL:', url);
      
      // Set the auth URL and show the WebView
      setAuthUrl(url);
      setShowWebView(true);
      
    } catch (error) {
      console.error('Error starting push notification auth:', error);
      setError(`Failed to start authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleWebViewNavigationStateChange = (navState: any) => {
    console.log('WebView navigation state:', navState.url);
    
    // Get the redirect URI
    const redirectUri = uaePassService.getRedirectUri();
    
    // Check if the URL is the redirect URI
    if (navState.url.startsWith(redirectUri)) {
      console.log('WebView detected redirect URI:', navState.url);
      
      // Hide WebView immediately to prevent further navigation
      setShowWebView(false);
      setIsLoading(true);
      
      // Process authentication
      handleAuthSuccess(navState.url);
    }
  };
  
  const handleAuthSuccess = async (url: string) => {
    try {
      console.log('Processing push notification auth success URL:', url);
      
      // Parse the URL to extract code and state
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      
      if (code && state) {
        // Process login with the code and state
        const userInfo = await uaePassService.processAuthentication(code, state);
        
        console.log('Push notification auth successful', userInfo);
        onSuccess(userInfo);
      } else {
        throw new Error('Invalid response from UAE Pass: missing code or state');
      }
    } catch (error) {
      console.error('Push notification auth error:', error);
      onFailure(error instanceof Error ? error : new Error('Push notification authentication failed'));
      setError(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };
  
  // If WebView is shown, render only it
  if (showWebView) {
    return (
      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: authUrl }}
          style={styles.webView}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          incognito={true}
          cacheEnabled={false}
          onError={(e) => {
            console.error('WebView error:', e.nativeEvent);
            setShowWebView(false);
            setError(`WebView error: ${e.nativeEvent.description}`);
          }}
        />
        <Button 
          mode="outlined" 
          onPress={() => {
            setShowWebView(false);
            setIsLoading(false);
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
      <Text style={styles.title}>Push Notification Authentication</Text>
      <Text style={styles.description}>
        Enter your UAE Pass identifier to receive a push notification on your device with the UAE Pass app installed.
      </Text>
      
      <View style={styles.optionsContainer}>
        <Button 
          mode={identifierType === 'email' ? 'contained' : 'outlined'} 
          onPress={() => setIdentifierType('email')}
          style={styles.optionButton}
        >
          Email
        </Button>
        <Button 
          mode={identifierType === 'mobile' ? 'contained' : 'outlined'} 
          onPress={() => setIdentifierType('mobile')}
          style={styles.optionButton}
        >
          Mobile
        </Button>
        <Button 
          mode={identifierType === 'eid' ? 'contained' : 'outlined'} 
          onPress={() => setIdentifierType('eid')}
          style={styles.optionButton}
        >
          Emirates ID
        </Button>
      </View>
      
      <TextInput
        label={
          identifierType === 'email' ? 'Email Address' : 
          identifierType === 'mobile' ? 'Mobile Number' : 
          'Emirates ID'
        }
        value={userIdentifier}
        onChangeText={setUserIdentifier}
        mode="outlined"
        style={styles.input}
        placeholder={
          identifierType === 'email' ? 'example@domain.com' : 
          identifierType === 'mobile' ? '0501234567' : 
          '784-1234-1234567-1'
        }
        keyboardType={
          identifierType === 'email' ? 'email-address' : 
          identifierType === 'mobile' ? 'phone-pad' : 
          'default'
        }
        autoCapitalize="none"
        autoCorrect={false}
        disabled={isLoading}
      />
      
      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}
      
      <Button
        mode="contained"
        onPress={handleLogin}
        disabled={isLoading || !userIdentifier.trim()}
        style={styles.button}
        loading={isLoading}
      >
        Send Push Notification
      </Button>
      
      <Text style={styles.note}>
        You will receive a push notification on your device with UAE Pass app installed.
        Confirm the authentication request on that device to login.
      </Text>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    color: '#666',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 16,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
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