import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { C } from '../lib/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
}

export function ScreenContainer({ children, style, maxWidth = 1200 }: ScreenContainerProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter}>
        <View style={[styles.webInner, { maxWidth }, style]}>
          {children}
        </View>
      </View>
    );
  }

  return <View style={[styles.nativeContainer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    width: '100%',
    backgroundColor: C.white,
    alignItems: 'center',
  },
  webInner: {
    flex: 1,
    width: '100%',
    backgroundColor: C.white,
  },
  nativeContainer: {
    flex: 1,
    backgroundColor: C.white,
  },
});
