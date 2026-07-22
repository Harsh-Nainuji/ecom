import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { LayoutDashboard, Package, ClipboardList } from 'lucide-react-native';
import { SellerDashboardScreen } from '../screens/seller/SellerDashboardScreen';
import { SellerProductsScreen } from '../screens/seller/SellerProductsScreen';
import { SellerOrdersScreen } from '../screens/seller/SellerOrdersScreen';

export type SellerTabParamList = {
  SellerDashboard: undefined;
  SellerProducts: undefined;
  SellerOrders: undefined;
};

const Tab = createBottomTabNavigator<SellerTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const color = focused ? '#c2185b' : '#9e9e9e';
  const size = 20;
  const strokeWidth = 2;

  let IconComponent = LayoutDashboard;
  if (label === 'Products') {
    IconComponent = Package;
  } else if (label === 'Orders') {
    IconComponent = ClipboardList;
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={[
        { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
        focused && { backgroundColor: '#FDE8EC' },
      ]}>
        <IconComponent size={size} color={color} strokeWidth={strokeWidth} />
      </View>
    </View>
  );
}

export function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#c2185b',
        tabBarInactiveTintColor: '#9e9e9e',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#F0E4E7',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#F5A5B0',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginTop: 2 },
        headerStyle: { backgroundColor: '#ffffff', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '800', fontSize: 18, color: '#1a1a2e', letterSpacing: 0.5 },
        headerTintColor: '#c2185b',
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="SellerDashboard"
        component={SellerDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SellerProducts"
        component={SellerProductsScreen}
        options={{
          title: 'Products',
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused }) => <TabIcon label="Products" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SellerOrders"
        component={SellerOrdersScreen}
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon label="Orders" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
