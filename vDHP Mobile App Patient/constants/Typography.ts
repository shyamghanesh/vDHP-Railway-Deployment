/**
 * vDHP Care Compass - Typography System
 * Large, accessible fonts designed for elderly users
 */

export const Typography = {
  fontSizes: {
    xs: 14,
    sm: 16,
    base: 18,
    lg: 20,
    xl: 24,
    xxl: 28,
    xxxl: 32,
    display: 40,
  },
  
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

export const textStyles = {
  display: {
    fontSize: Typography.fontSizes.display,
    fontWeight: Typography.fontWeights.bold,
    lineHeight: Typography.lineHeights.tight * Typography.fontSizes.display,
  },
  
  h1: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.bold,
    lineHeight: Typography.lineHeights.tight * Typography.fontSizes.xxxl,
  },
  
  h2: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    lineHeight: Typography.lineHeights.tight * Typography.fontSizes.xxl,
  },
  
  h3: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.semibold,
    lineHeight: Typography.lineHeights.normal * Typography.fontSizes.xl,
  },
  
  h4: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    lineHeight: Typography.lineHeights.normal * Typography.fontSizes.lg,
  },
  
  body: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.regular,
    lineHeight: Typography.lineHeights.relaxed * Typography.fontSizes.base,
  },
  
  bodyLarge: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.regular,
    lineHeight: Typography.lineHeights.relaxed * Typography.fontSizes.lg,
  },
  
  bodySemibold: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.semibold,
    lineHeight: Typography.lineHeights.relaxed * Typography.fontSizes.base,
  },
  
  caption: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.regular,
    lineHeight: Typography.lineHeights.normal * Typography.fontSizes.sm,
  },
  
  button: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    lineHeight: Typography.lineHeights.normal * Typography.fontSizes.lg,
  },
  
  buttonLarge: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.semibold,
    lineHeight: Typography.lineHeights.normal * Typography.fontSizes.xl,
  },
};
