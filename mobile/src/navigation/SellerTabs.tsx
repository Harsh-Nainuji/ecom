import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SellerDashboardScreen } from '../screens/seller/SellerDashboardScreen';
import { SellerProductsScreen } from '../screens/seller/SellerProductsScreen';
import { SellerOrdersScreen } from '../screens/seller/SellerOrdersScreen';

export type SellerTabParamList = {
  SellerDashboard: undefined;
  SellerProducts: undefined;
  SellerOrders: undefined;
};

const Tab = createBottomTabNavigator<SellerTabParamList>();

export function SellerTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="SellerDashboard" component={SellerDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="SellerProducts" component={SellerProductsScreen} options={{ title: 'Products' }} />
      <Tab.Screen name="SellerOrders" component={SellerOrdersScreen} options={{ title: 'Orders' }} />
    </Tab.Navigator>
  );
}
