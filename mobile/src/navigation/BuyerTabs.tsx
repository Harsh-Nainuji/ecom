import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, View } from 'react-native';
import { BuyerHomeScreen } from '../screens/buyer/BuyerHomeScreen';
import { BuyerOrdersScreen } from '../screens/buyer/BuyerOrdersScreen';
import { BuyerProfileScreen } from '../screens/buyer/BuyerProfileScreen';
import type { BuyerStackParamList } from './BuyerStack';

export type BuyerTabParamList = {
  BuyerHome: undefined;
  BuyerOrders: undefined;
  BuyerProfile: undefined;
};

const Tab = createBottomTabNavigator<BuyerTabParamList>();

const PINK = '#F5A5B0';
const BEIGE = '#DCBDA8';
const PEACH = '#FFBCBE';

const ICON: Record<string, string> = { Home: '⌂', Orders: '⊡', Profile: '◯' };

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <View style={[
        { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
        focused && { backgroundColor: '#FDE8EC' },
      ]}>
        <Text style={{ fontSize: 16, color: focused ? '#c2185b' : '#bbb' }}>{ICON[label]}</Text>
      </View>
    </View>
  );
}

export function BuyerTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#c2185b',
        tabBarInactiveTintColor: '#9e9e9e',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#F0E4E7',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
          shadowColor: '#F5A5B0',
          shadowOpacity: 0.10,
          shadowRadius: 6,
          elevation: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, marginTop: 1 },
        headerStyle: { backgroundColor: '#ffffff', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '800', fontSize: 18, color: '#1a1a2e', letterSpacing: 0.5 },
        headerTintColor: '#c2185b',
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="BuyerHome"
        component={BuyerHomeScreen}
        options={{
          title: 'FabZone',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Cart')}
              style={{ marginRight: 16, backgroundColor: '#FDE8EC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: '#F5A5B0' }}
            >
              <Text style={{ fontWeight: '700', color: '#c2185b', fontSize: 13 }}>🛒  Cart</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="BuyerOrders"
        component={BuyerOrdersScreen}
        options={{
          title: 'My Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon label="Orders" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="BuyerProfile"
        component={BuyerProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
