import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, ActivityIndicator, Card } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { uaePassService, AuthMethod } from '../services/UaePassService';

interface VisitorAuthProps {
  onSuccess: (userInfo: any) => void;
  onFailure: (error: Error) => void;
}

export const VisitorAuth: React.FC<VisitorAuthProps> = ({ onSuccess, onFailure }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Set authentication method to visitor
      uaePassService.setAuthMethod(AuthMethod.VISITOR);
      
      // Get the authorization URL with visitor scope
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
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>UAE Pass Visitor Authentication</Text>
          
          <Text style={styles.description}>
            This authentication method retrieves additional visitor profile attributes 
            including UnifiedID and ProfileType.
          </Text>
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <Button
            mode="contained"
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.button}
            icon="account-key"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              'Login as Visitor'
            )}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    marginVertical: 16,
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
    lineHeight: 20,
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
}); 