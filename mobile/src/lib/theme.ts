import { StyleSheet } from 'react-native';

export const C = {
  pink:      '#F5A5B0',
  beige:     '#DCBDA8',
  peach:     '#FFBCBE',
  rose:      '#c2185b',
  white:     '#FFFFFF',
  bg:        '#FFFFFF',
  card0:     '#FFF0F2',
  card1:     '#FFF5EE',
  card2:     '#FDE8EC',
  card3:     '#FFF9F0',
  border:    '#F0E4E7',
  text:      '#1a1a2e',
  text2:     '#333333',
  text3:     '#555555',
  muted:     '#888888',
  success:   '#059669',
  warning:   '#f59e0b',
  error:     '#dc2626',
  inputBg:   '#FAFAFA',
  surface:   '#FFF8F9',
} as const;

export const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const R = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

export const T = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '800', color: C.text },
  h3: { fontSize: 18, fontWeight: '700', color: C.text },
  h4: { fontSize: 16, fontWeight: '700', color: C.text },
  body: { fontSize: 15, fontWeight: '400', color: C.text2, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400', color: C.text3, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500', color: C.muted },
  price: { fontSize: 20, fontWeight: '800', color: C.rose },
  priceLg: { fontSize: 26, fontWeight: '800', color: C.rose },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' },
  link: { fontSize: 14, fontWeight: '700', color: C.rose },
});

export const BTN = StyleSheet.create({
  primary: {
    backgroundColor: C.rose,
    borderRadius: R.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.lg,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondary: {
    backgroundColor: C.card2,
    borderRadius: R.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.lg,
    borderWidth: 1,
    borderColor: C.pink,
  },
  secondaryText: {
    color: C.rose,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ghost: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.lg,
  },
  ghostText: {
    color: C.rose,
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: { opacity: 0.45 },
});

export const INPUT = StyleSheet.create({
  base: {
    height: 48,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.inputBg,
  },
  focused: {
    borderColor: C.rose,
    backgroundColor: C.white,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
});

export const CARD = StyleSheet.create({
  base: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.md,
  },
  elevated: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.md,
    shadowColor: C.pink,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});

