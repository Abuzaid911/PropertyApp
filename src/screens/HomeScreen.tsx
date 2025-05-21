import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Image, Dimensions } from 'react-native';
import { Card, Text, useTheme, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Property } from '../types';
import { mockProperties } from '../data/mockData';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');
const LIST_WIDTH = width * 0.4;
const DETAIL_WIDTH = width * 0.6;

export const HomeScreen = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property>(mockProperties[0]);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const theme = useTheme();

  const handlePropertyPress = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleManagePress = (propertyId: string) => {
    navigation.navigate('ManageProperty', { propertyId });
  };

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <Card
      style={[
        styles.propertyCard,
        selectedProperty.id === item.id && styles.selectedCard,
      ]}
      onPress={() => handlePropertyPress(item)}
    >
      <Card.Content>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.propertyAddress} numberOfLines={2}>
          {item.address}
        </Text>
        <Text style={styles.propertyRent}>
          AED {item.rent.toLocaleString()}/year
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <FlatList
          data={mockProperties}
          renderItem={renderPropertyItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
      
      <View style={styles.detailContainer}>
        <Card style={styles.detailCard}>
          <Card.Cover source={{ uri: selectedProperty.imageUrl }} />
          <Card.Content>
            <Text style={styles.detailTitle}>{selectedProperty.title}</Text>
            <Text style={styles.detailAddress}>{selectedProperty.address}</Text>
            <Text style={styles.detailDescription}>
              {selectedProperty.description}
            </Text>
            <Text style={styles.detailRent}>
              AED {selectedProperty.rent.toLocaleString()}/year
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => handleManagePress(selectedProperty.id)}
              style={styles.manageButton}
            >
              Manage Property
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    width: LIST_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  detailContainer: {
    width: DETAIL_WIDTH,
    padding: 16,
  },
  propertyCard: {
    margin: 8,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#6200ee',
    borderWidth: 2,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  propertyAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  propertyRent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 4,
  },
  detailCard: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  detailAddress: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  detailDescription: {
    fontSize: 14,
    marginTop: 16,
    lineHeight: 20,
  },
  detailRent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 16,
  },
  manageButton: {
    marginHorizontal: 8,
  },
}); 