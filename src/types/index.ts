export interface Property {
  id: string;
  title: string;
  address: string;
  rent: number;
  imageUrl: string;
  description: string;
}

export interface PassportChangeOrder {
  id: string;
  propertyId: string;
  oldPassportUrl: string;
  newPassportUrl: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  uaePassId: string;
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  PropertyDetails: { propertyId: string };
  ManageProperty: { propertyId: string };
  PassportChange: { propertyId: string };
  OrderConfirmation: { orderId: string };
}; 