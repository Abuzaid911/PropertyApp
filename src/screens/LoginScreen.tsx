import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Title } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { UaePassAuth } from '../components/UaePassAuth';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuthSuccess = (userData: any) => {
    console.log('Authentication successful:', userData);
    setUserInfo(userData);
    
    // Navigate to home screen after successful login
    setTimeout(() => {
      navigation.replace('Home');
    }, 2000);
  };

  const handleAuthFailure = (error: Error) => {
    console.error('Authentication failed:', error);
    setAuthError(error.message);
  };

  const renderUserInfo = () => {
    if (!userInfo) return null;

    // Check if it's a visitor account
    const isVisitor = userInfo.profileType === 'VISITOR';

    return (
      <Card style={styles.userInfoCard}>
        <Card.Content>
          <Title>Authentication Successful</Title>
          
          <Text style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name: </Text>
            {userInfo.fullnameEN || '(Not provided)'}
          </Text>
          
          {!isVisitor && (
            <>
              <Text style={styles.infoItem}>
                <Text style={styles.infoLabel}>Emirates ID: </Text>
                {userInfo.idn || '(Not provided)'}
              </Text>
              
              <Text style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email: </Text>
                {userInfo.email || '(Not provided)'}
              </Text>
              
              <Text style={styles.infoItem}>
                <Text style={styles.infoLabel}>Mobile: </Text>
                {userInfo.mobile || '(Not provided)'}
              </Text>
            </>
          )}
          
          {isVisitor && (
            <>
              <Text style={styles.infoItem}>
                <Text style={styles.infoLabel}>Profile Type: </Text>
                {userInfo.profileType}
              </Text>
              
              <Text style={styles.infoItem}>
                <Text style={styles.infoLabel}>Unified ID: </Text>
                {userInfo.unifiedId || '(Not provided)'}
              </Text>
            </>
          )}
          
          <Text style={styles.redirectMessage}>
            Redirecting to the home screen...
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Title style={styles.title}>Property Management App</Title>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {authError && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>
                Authentication Error: {authError}
              </Text>
            </Card.Content>
          </Card>
        )}

        {userInfo ? (
          renderUserInfo()
        ) : (
          <Card style={styles.authCard}>
            <Card.Content>
              <UaePassAuth
                onSuccess={handleAuthSuccess}
                onFailure={handleAuthFailure}
              />
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  authCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#b71c1c',
  },
  userInfoCard: {
    marginBottom: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  redirectMessage: {
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#4caf50',
  },
}); 