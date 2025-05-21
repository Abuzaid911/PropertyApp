import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { uaePassService, AuthMethod } from '../services/UaePassService';
import { PushNotificationAuth } from './PushNotificationAuth';
import { VisitorAuth } from './VisitorAuth';

interface UaePassAuthProps {
  onSuccess: (userInfo: any) => void;
  onFailure: (error: Error) => void;
}

export const UaePassAuth: React.FC<UaePassAuthProps> = ({ onSuccess, onFailure }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<string>(AuthMethod.STANDARD);

  // Set up linking listener for UAE Pass redirects
  useEffect(() => {
    // Initialize UAE Pass
    initializeUaePass();
    
    // Handle deep linking from UAE Pass
    const subscription = Linking.addEventListener('url', handleRedirectUrl);
    
    return () => {
      // Clean up the subscription
      subscription.remove();
    };
  }, []);

  const initializeUaePass = async () => {
    try {
      await uaePassService.initialize();
    } catch (error) {
      console.error('Failed to initialize UAE Pass:', error);
      setError('Failed to initialize UAE Pass. Please try again later.');
    }
  };

  const handleStandardLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Set authentication method to standard
      uaePassService.setAuthMethod(AuthMethod.STANDARD);
      
      // Get the authorization URL
      const authUrl = uaePassService.getAuthorizationUrl();
      
      // Open the authorization URL in browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        uaePassService.getRedirectUri()
      );
      
      // Handle the result
      if (result.type === 'cancel') {
        setError('Authentication was cancelled');
        setIsLoading(false);
      } else if (result.type !== 'success') {
        setError('Authentication failed. Please try again.');
        setIsLoading(false);
      }
      // If successful, the handleRedirectUrl function will be called through the Linking listener
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to start login with UAE Pass. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRedirectUrl = async (event: { url: string }) => {
    try {
      const { url } = event;
      if (url.startsWith(uaePassService.getRedirectUri())) {
        // Parse the URL to extract code and state
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const state = urlObj.searchParams.get('state');

        if (code && state) {
          // Process the authentication with UAE Pass
          setIsLoading(true);
          uaePassService.setAuthCode(code, state);
          const userInfo = await uaePassService.login();
          onSuccess(userInfo);
        } else {
          throw new Error('Invalid response from UAE Pass');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      onFailure(error instanceof Error ? error : new Error('Authentication failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Choose Authentication Method</Text>
      
      <SegmentedButtons
        value={authMethod}
        onValueChange={setAuthMethod}
        buttons={[
          {
            value: AuthMethod.STANDARD,
            label: 'Standard',
            icon: 'login',
          },
          {
            value: AuthMethod.PUSH_NOTIFICATION,
            label: 'Push Notification',
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
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              'Login with UAE Pass'
            )}
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
          onSuccess={onSuccess}
          onFailure={onFailure}
        />
      )}
      
      {authMethod === AuthMethod.VISITOR && (
        <VisitorAuth 
          onSuccess={onSuccess}
          onFailure={onFailure}
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
}); 