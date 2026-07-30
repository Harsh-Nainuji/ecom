import React from 'react';
import { StyleSheet, View } from 'react-native';
import { C, R, S } from '../lib/theme';

export function ProductSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <View style={styles.titleLine} />
        <View style={styles.shortLine} />
        <View style={styles.priceLine} />
      </View>
    </View>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: S.md,
    gap: S.md,
  },
  card: {
    width: '47%',
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: S.sm,
    borderWidth: 1,
    borderColor: C.border,
    gap: S.xs,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: R.md,
    backgroundColor: '#F3F4F6',
  },
  content: {
    gap: 6,
    paddingTop: S.xs,
  },
  titleLine: {
    width: '85%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  shortLine: {
    width: '50%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  priceLine: {
    width: '40%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
});
