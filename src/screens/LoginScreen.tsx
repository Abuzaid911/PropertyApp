import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { Card, Title, Paragraph, Text, Button } from 'react-native-paper';
import { UaePassAuth } from '../components/UaePassAuth';
import { NavigationProp, useFocusEffect } from '@react-navigation/native';

interface LoginScreenProps {
  navigation: NavigationProp<any>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showAuth, setShowAuth] = useState(true);

  // Force immediate re-render when navigation starts
  useEffect(() => {
    if (isNavigating) {
      // Immediately hide the auth component when navigation starts
      setShowAuth(false);
    }
  }, [isNavigating]);

  // Handle back button to prevent going back during navigation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isNavigating) {
          // Prevent going back during navigation
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isNavigating])
  );

  const handleAuthSuccess = async (userInfoData: any) => {
    console.log('Authentication successful, navigating to Home:', userInfoData);
    
    // First hide the auth component
    setShowAuth(false);
    
    // Set navigation flag and user info
    if (isNavigating) return;
    setIsNavigating(true);
    setUserInfo(userInfoData);
    setError(null);
    
    // Add a tiny delay to ensure state updates before navigation
    setTimeout(() => {
      // Navigate to home screen after ensuring component has unmounted
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home', params: { userInfo: userInfoData } }],
      });
    }, 50);
  };

  const handleAuthFailure = (error: Error) => {
    console.error('Authentication failed:', error);
    setError(error.message);
    setUserInfo(null);
    setIsNavigating(false);
    setShowAuth(true);
  };

  const renderUserInfo = () => {
    if (!userInfo) return null;

    const isVisitor = userInfo.profileType === 'VISITOR';

    return (
      <Card style={styles.userInfoCard}>
        <Card.Content>
          <Title>User Information</Title>
          {isVisitor ? (
            <>
              <Paragraph>Visitor ID: {userInfo.unifiedId || 'N/A'}</Paragraph>
              <Paragraph>Profile Type: {userInfo.profileType || 'N/A'}</Paragraph>
            </>
          ) : (
            <>
              <Paragraph>Name: {userInfo.fullnameEN || 'N/A'}</Paragraph>
              <Paragraph>Email: {userInfo.email || 'N/A'}</Paragraph>
              <Paragraph>Mobile: {userInfo.mobile || 'N/A'}</Paragraph>
              <Paragraph>Gender: {userInfo.gender || 'N/A'}</Paragraph>
              <Paragraph>Emirates ID: {userInfo.idn || 'N/A'}</Paragraph>
              <Paragraph>UUID: {userInfo.uuid || 'N/A'}</Paragraph>
            </>
          )}

          <Button 
            mode="contained" 
            onPress={() => {
              setIsNavigating(true);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home', params: { userInfo } }],
              });
            }}
            style={styles.continueButton}
            disabled={isNavigating}
          >
            Continue to App
          </Button>
        </Card.Content>
      </Card>
    );
  };

  if (isNavigating) {
    // Show a blank screen while navigating
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Title>Redirecting to Home...</Title>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.title}>Property Management App</Title>
            <Paragraph style={styles.subtitle}>
              Login with UAE Pass to access your property information
            </Paragraph>
          </Card.Content>
        </Card>

        {error && (
          <Card style={[styles.errorCard]}>
            <Card.Content>
              <Text style={styles.errorText}>
                Authentication Error: {error}
              </Text>
            </Card.Content>
          </Card>
        )}

        {showAuth && !userInfo && !isNavigating && (
          <Card style={styles.authCard}>
            <Card.Content>
              <UaePassAuth
                onSuccess={handleAuthSuccess}
                onFailure={handleAuthFailure}
              />
            </Card.Content>
          </Card>
        )}

        {userInfo && renderUserInfo()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
  },
  authCard: {
    marginBottom: 16,
    elevation: 2,
  },
  userInfoCard: {
    marginTop: 16,
    elevation: 2,
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#ffebee',
    elevation: 2,
  },
  errorText: {
    color: '#b00020',
  },
  continueButton: {
    marginTop: 16,
  },
}); 