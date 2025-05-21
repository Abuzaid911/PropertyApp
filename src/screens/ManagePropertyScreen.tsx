import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, TextInput, Button, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { mockProperties } from '../data/mockData';

type ManagePropertyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManageProperty'>;
type ManagePropertyScreenRouteProp = RouteProp<RootStackParamList, 'ManageProperty'>;

export const ManagePropertyScreen = () => {
  const navigation = useNavigation<ManagePropertyScreenNavigationProp>();
  const route = useRoute<ManagePropertyScreenRouteProp>();
  const { propertyId } = route.params;

  const property = mockProperties.find(p => p.id === propertyId);
  const [title, setTitle] = useState(property?.title || '');
  const [address, setAddress] = useState(property?.address || '');
  const [rent, setRent] = useState(property?.rent.toString() || '');

  const handleUpdateProperty = () => {
    // TODO: Implement property update logic
    console.log('Updating property:', { title, address, rent });
  };

  const handlePassportChange = () => {
    navigation.navigate('PassportChange', { propertyId });
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
          <Text style={styles.sectionTitle}>Property Details</Text>
          
          <TextInput
            label="Property Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          
          <TextInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
            multiline
          />
          
          <TextInput
            label="Annual Rent (AED)"
            value={rent}
            onChangeText={setRent}
            keyboardType="numeric"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleUpdateProperty}
            style={styles.button}
          >
            Update Property
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Trust Office Services</Text>
          
          <Button
            mode="outlined"
            onPress={handlePassportChange}
            icon="passport"
            style={styles.serviceButton}
          >
            Change Passport
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  serviceButton: {
    marginTop: 8,
  },
}); 