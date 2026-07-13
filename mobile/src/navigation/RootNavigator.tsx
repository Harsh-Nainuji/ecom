import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { BuyerStack } from './BuyerStack';
import { SellerTabs } from './SellerTabs';
import { DeliveryStack } from './DeliveryStack';
import { useAuth } from '../context/AuthContext';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function RoleNavigator() {
  const { profile } = useAuth();

  if (!profile) {
    return <LoadingScreen />;
  }

  switch (profile.role) {
    case 'seller':
      return <SellerTabs />;
    case 'delivery':
      return <DeliveryStack />;
    case 'buyer':
    default:
      return <BuyerStack />;
  }
}

export function RootNavigator() {
  const { loading, session, profile } = useAuth();

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
    switch (profile.role) {
      case 'seller':
        return <SellerTabs />;
      case 'delivery':
        return <DeliveryStack />;
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
