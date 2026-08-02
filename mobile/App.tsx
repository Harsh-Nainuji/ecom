import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { ToastProvider } from './src/context/ToastContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <ToastProvider>
            <WishlistProvider>
              <CartProvider>
                <StatusBar style="dark" />
                <RootNavigator />
              </CartProvider>
            </WishlistProvider>
          </ToastProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
