import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ManagePropertyScreen } from '../screens/ManagePropertyScreen';
import { PassportChangeScreen } from '../screens/PassportChangeScreen';
import { OrderConfirmationScreen } from '../screens/OrderConfirmationScreen';
import { IconButton } from 'react-native-paper';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // TODO: Add a proper loading screen
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6200ee',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={({ navigation }) => ({
                title: 'Properties',
                headerRight: () => (
                  <IconButton
                    icon="account-circle"
                    iconColor="#fff"
                    size={24}
                    onPress={() => navigation.navigate('Profile')}
                  />
                ),
              })}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Your Profile' }}
            />
            <Stack.Screen
              name="ManageProperty"
              component={ManagePropertyScreen}
              options={{ title: 'Manage Property' }}
            />
            <Stack.Screen
              name="PassportChange"
              component={PassportChangeScreen}
              options={{ title: 'Change Passport' }}
            />
            <Stack.Screen
              name="OrderConfirmation"
              component={OrderConfirmationScreen}
              options={{ 
                title: 'Order Confirmation',
                headerLeft: () => null, // Prevent going back
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 