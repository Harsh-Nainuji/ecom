import { Alert, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LogOut } from 'lucide-react-native';
import { DeliveryAssignmentsScreen } from '../screens/delivery/DeliveryAssignmentsScreen';
import { DeliveryDetailScreen } from '../screens/delivery/DeliveryDetailScreen';
import { useAuth } from '../context/AuthContext';
import { C } from '../lib/theme';

export type DeliveryStackParamList = {
  DeliveryAssignments: undefined;
  DeliveryDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<DeliveryStackParamList>();

function HeaderLogout() {
  const { signOut } = useAuth();
  return (
    <TouchableOpacity
      style={{ marginRight: 16, padding: 6, borderRadius: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: C.error }}
      onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ])}
      activeOpacity={0.8}
    >
      <LogOut size={18} color={C.error} strokeWidth={2} />
    </TouchableOpacity>
  );
}

export function DeliveryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerRight: () => <HeaderLogout />,
        headerTintColor: C.rose,
        headerStyle: { backgroundColor: '#ffffff' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="DeliveryAssignments"
        component={DeliveryAssignmentsScreen}
        options={{ title: 'Assignments' }}
      />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} options={{ title: 'Order' }} />
    </Stack.Navigator>
  );
}
