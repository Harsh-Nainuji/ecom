import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BuyerTabs } from './BuyerTabs';
import { ProductDetailScreen } from '../screens/buyer/ProductDetailScreen';
import { WishlistScreen } from '../screens/buyer/WishlistScreen';
import { CartScreen } from '../screens/buyer/CartScreen';
import { CheckoutScreen } from '../screens/buyer/CheckoutScreen';
import { OrderDetailScreen } from '../screens/buyer/OrderDetailScreen';
import { AddressBookScreen } from '../screens/buyer/AddressBookScreen';
import { TermsScreen } from '../screens/buyer/TermsScreen';
import { PrivacyConsentScreen } from '../screens/common/PrivacyConsentScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

export type BuyerStackParamList = {
  BuyerTabs: undefined;
  ProductDetail: { productId: string };
  Wishlist: undefined;
  Cart: undefined;
  Checkout: undefined;
  OrderDetail: { orderId: string };
  AddressBook: undefined;
  Terms: undefined;
  PrivacyConsent: undefined;
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<BuyerStackParamList>();

export function BuyerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BuyerTabs" component={BuyerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
      <Stack.Screen name="AddressBook" component={AddressBookScreen} options={{ title: 'Saved Addresses' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PrivacyConsent" component={PrivacyConsentScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In', headerTintColor: '#c2185b' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account', headerTintColor: '#c2185b' }} />
    </Stack.Navigator>
  );
}

