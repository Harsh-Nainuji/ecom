import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DeliveryAssignmentsScreen } from '../screens/delivery/DeliveryAssignmentsScreen';
import { DeliveryDetailScreen } from '../screens/delivery/DeliveryDetailScreen';

export type DeliveryStackParamList = {
  DeliveryAssignments: undefined;
  DeliveryDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<DeliveryStackParamList>();

export function DeliveryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DeliveryAssignments"
        component={DeliveryAssignmentsScreen}
        options={{ title: 'Assignments' }}
      />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} options={{ title: 'Order' }} />
    </Stack.Navigator>
  );
}
