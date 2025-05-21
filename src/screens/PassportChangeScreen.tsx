import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { RootStackParamList } from '../types';
import { mockProperties } from '../data/mockData';

type PassportChangeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PassportChange'>;
type PassportChangeScreenRouteProp = RouteProp<RootStackParamList, 'PassportChange'>;

export const PassportChangeScreen = () => {
  const navigation = useNavigation<PassportChangeScreenNavigationProp>();
  const route = useRoute<PassportChangeScreenRouteProp>();
  const { propertyId } = route.params;

  const property = mockProperties.find(p => p.id === propertyId);
  const [oldPassport, setOldPassport] = useState<string | null>(null);
  const [newPassport, setNewPassport] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickDocument = async (type: 'old' | 'new') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        if (type === 'old') {
          setOldPassport(fileUri);
        } else {
          setNewPassport(fileUri);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      // TODO: Show error message to user
    }
  };

  const handleSubmit = async () => {
    if (!oldPassport || !newPassport) {
      // TODO: Show validation error
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement actual submission logic
      // For now, we'll simulate a network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const orderId = `PASSPORT-${Date.now()}`;
      navigation.navigate('OrderConfirmation', { orderId });
    } catch (error) {
      console.error('Error submitting passport change:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!property) {
    return (
      <View style={styles.container}>
        <Text>Property not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Change Passport</Text>
          <Text style={styles.subtitle}>{property.title}</Text>

          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Old Passport</Text>
            <Button
              mode="outlined"
              onPress={() => handlePickDocument('old')}
              icon="upload"
              style={styles.uploadButton}
            >
              {oldPassport ? 'Change Old Passport' : 'Upload Old Passport'}
            </Button>
            {oldPassport && (
              <Text style={styles.fileName}>File uploaded</Text>
            )}
          </View>

          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>New Passport</Text>
            <Button
              mode="outlined"
              onPress={() => handlePickDocument('new')}
              icon="upload"
              style={styles.uploadButton}
            >
              {newPassport ? 'Change New Passport' : 'Upload New Passport'}
            </Button>
            {newPassport && (
              <Text style={styles.fileName}>File uploaded</Text>
            )}
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!oldPassport || !newPassport || isSubmitting}
            style={styles.submitButton}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              'Submit Request'
            )}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  uploadSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  uploadButton: {
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    color: '#4CAF50',
  },
  submitButton: {
    marginTop: 16,
  },
}); 