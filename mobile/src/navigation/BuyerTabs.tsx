import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, View } from 'react-native';
import { Home, ClipboardList, User, ShoppingCart } from 'lucide-react-native';
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

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const color = focused ? '#c2185b' : '#9e9e9e';
  const size = 20;
  const strokeWidth = 2;

  let IconComponent = Home;
  if (label === 'Orders') {
    IconComponent = ClipboardList;
  } else if (label === 'Profile') {
    IconComponent = User;
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
        name="BuyerHome"
        component={BuyerHomeScreen}
        options={{
          title: 'FabZone',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Cart')}
              style={{
                marginRight: 16,
                backgroundColor: '#FDE8EC',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: '#F5A5B0',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
              activeOpacity={0.8}
            >
              <ShoppingCart size={15} color="#c2185b" strokeWidth={2.2} />
              <Text style={{ fontWeight: '700', color: '#c2185b', fontSize: 13 }}>Cart</Text>
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
