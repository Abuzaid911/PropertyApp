import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, ActivityIndicator, TextInput } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { uaePassService, AuthMethod } from '../services/UaePassService';

interface PushNotificationAuthProps {
  onSuccess: (userInfo: any) => void;
  onFailure: (error: Error) => void;
}

export const PushNotificationAuth: React.FC<PushNotificationAuthProps> = ({ onSuccess, onFailure }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!userIdentifier) {
      setError('Please enter your UAE Pass identifier (Email, Mobile, or Emirates ID)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Set authentication method to push notification
      uaePassService.setAuthMethod(AuthMethod.PUSH_NOTIFICATION);
      
      // Get the authorization URL with the user identifier
      const authUrl = uaePassService.getAuthorizationUrl(userIdentifier);
      
      // Set up event listener for redirect
      const subscription = Linking.addEventListener('url', handleRedirectUrl);
      
      // Open the authorization URL in browser
      await WebBrowser.openAuthSessionAsync(
        authUrl,
        uaePassService.getRedirectUri()
      );
      
      // Display instructions about the push notification
      // This is just UI feedback - the actual auth will happen via the redirect
      
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
          const userInfo = await uaePassService.login(userIdentifier);
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
    <View style={styles.container}>
      <Text style={styles.title}>Login with UAE Pass Push Notification</Text>
      
      <Text style={styles.description}>
        Enter your UAE Pass identifier (Email, Mobile, or Emirates ID)
        to receive a push notification on your device with UAE Pass app installed.
      </Text>
      
      <TextInput
        label="UAE Pass Identifier"
        value={userIdentifier}
        onChangeText={setUserIdentifier}
        style={styles.input}
        placeholder="Enter Email, Mobile, or Emirates ID"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <Button
        mode="contained"
        onPress={handleLogin}
        disabled={isLoading}
        style={styles.button}
        icon="cellphone-arrow-down"
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          'Send Push Notification'
        )}
      </Button>
      
      {isLoading && (
        <View style={styles.loadingInfo}>
          <Text style={styles.loadingText}>
            Check your device with UAE Pass app for a push notification.
            Approve the login request to continue.
          </Text>
          <ActivityIndicator style={styles.loadingIndicator} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    marginBottom: 20,
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
  loadingInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingIndicator: {
    marginTop: 10,
  },
}); 