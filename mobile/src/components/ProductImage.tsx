import { Image, ImageStyle, StyleProp, StyleSheet, Text, View } from 'react-native';

interface ProductImageProps {
  uri?: string | null;
  name?: string;
  style?: StyleProp<ImageStyle>;
  placeholderBg?: string;
  placeholderColor?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export function ProductImage({
  uri,
  name = 'P',
  style,
  placeholderBg = '#fce7f3',
  placeholderColor = '#be185d',
  resizeMode = 'cover',
}: ProductImageProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={style}
        resizeMode={resizeMode}
      />
    );
  }

  const initial = (name[0] || 'P').toUpperCase();

  return (
    <View style={[style, styles.placeholder, { backgroundColor: placeholderBg }]}>
      <Text style={[styles.initial, { color: placeholderColor }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 32,
    fontWeight: '800',
  },
});
