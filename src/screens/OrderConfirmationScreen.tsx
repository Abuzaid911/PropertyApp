import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type OrderConfirmationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderConfirmation'>;
type OrderConfirmationScreenRouteProp = RouteProp<RootStackParamList, 'OrderConfirmation'>;

export const OrderConfirmationScreen = () => {
  const navigation = useNavigation<OrderConfirmationScreenNavigationProp>();
  const route = useRoute<OrderConfirmationScreenRouteProp>();
  const { orderId } = route.params;

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✓</Text>
          </View>

          <Text style={styles.title}>Order Confirmed</Text>
          <Text style={styles.orderId}>Order ID: {orderId}</Text>

          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service Type:</Text>
              <Text style={styles.detailValue}>Passport Change</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, styles.statusPending]}>Pending</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted:</Text>
              <Text style={styles.detailValue}>
                {new Date().toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={styles.message}>
            Your passport change request has been submitted successfully. 
            We will process your request and update you on the status.
          </Text>

          <Button
            mode="contained"
            onPress={handleBackToHome}
            style={styles.button}
          >
            Back to Home
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    width: 100,
    height: 100,
    borderRadius: 50,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  detailsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusPending: {
    color: '#FFA000',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    marginTop: 8,
  },
}); 