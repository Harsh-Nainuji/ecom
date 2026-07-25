import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { BuyerStack } from './BuyerStack';
import { SellerTabs } from './SellerTabs';
import { DeliveryStack } from './DeliveryStack';
import { SellerRegistrationScreen } from '../screens/seller/SellerRegistrationScreen';
import { SellerPendingScreen } from '../screens/seller/SellerPendingScreen';
import { SellerSuspendedScreen } from '../screens/seller/SellerSuspendedScreen';
import { useAuth } from '../context/AuthContext';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export function RootNavigator() {
  const { loading, session, profile, sellerProfile, activeRole } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  function Navigator() {
    if (!session) {
      return <BuyerStack />;
    }
    if (!profile) {
      return <LoadingScreen />;
    }

    // Let sellers (and admins, if any) temporarily switch to buyer mode
    const effectiveRole = activeRole ?? profile.role;

    switch (effectiveRole) {
      case 'seller':
        if (!sellerProfile) {
          return <SellerRegistrationScreen />;
        }
        if (sellerProfile.status === 'pending') {
          return <SellerPendingScreen />;
        }
        if (sellerProfile.status === 'suspended' || sellerProfile.status === 'rejected') {
          return <SellerSuspendedScreen reason={sellerProfile.rejected_reason} />;
        }
        return <SellerTabs />;
      case 'delivery':
        return <DeliveryStack />;
      case 'admin':
      case 'buyer':
      default:
        return <BuyerStack />;
    }
  }

  return (
    <NavigationContainer>
      <Navigator />
    </NavigationContainer>
  );
}
