import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Package, ClipboardList, LogOut, ShoppingBag } from 'lucide-react-native';
import { SellerDashboardScreen } from '../screens/seller/SellerDashboardScreen';
import { SellerProductsScreen } from '../screens/seller/SellerProductsScreen';
import { SellerOrdersScreen } from '../screens/seller/SellerOrdersScreen';
import { useAuth } from '../context/AuthContext';
import { C } from '../lib/theme';

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

function HeaderActions() {
  const { signOut, setActiveRole } = useAuth();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 16 }}>
      <TouchableOpacity
        style={{ padding: 6, borderRadius: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac' }}
        onPress={() => Alert.alert('Switch to Buyer', 'Open the buyer app view to shop?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Shop Now', onPress: () => setActiveRole('buyer') },
        ])}
        activeOpacity={0.8}
      >
        <ShoppingBag size={18} color={C.success} strokeWidth={2} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 6, borderRadius: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: C.error }}
        onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ])}
        activeOpacity={0.8}
      >
        <LogOut size={18} color={C.error} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

export function SellerTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerRight: () => <HeaderActions />,
        tabBarActiveTintColor: '#c2185b',
        tabBarInactiveTintColor: '#9e9e9e',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#F0E4E7',
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
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
