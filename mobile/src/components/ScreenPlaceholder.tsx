import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface ScreenPlaceholderProps {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

export function ScreenPlaceholder({ title, subtitle, footer }: ScreenPlaceholderProps) {
  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyLarge" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
  },
});
