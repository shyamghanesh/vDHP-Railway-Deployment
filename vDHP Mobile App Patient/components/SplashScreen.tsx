import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Image as RNImage, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

const INITIAL_SIZE = 200;
const FINAL_SIZE = 50;

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [logoError, setLogoError] = useState(false);

  const SCREEN_WIDTH = dimensions.width;
  const SCREEN_HEIGHT = dimensions.height;
  const INITIAL_X = SCREEN_WIDTH / 2 - INITIAL_SIZE / 2;
  const INITIAL_Y = SCREEN_HEIGHT / 2 - INITIAL_SIZE / 2;
  const FINAL_X = 24; // Top left position (padding)
  const FINAL_Y = insets.top + 10; // Top position (below status bar + padding)

  // Initialize shared values - will be updated in useEffect
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const width = useSharedValue(INITIAL_SIZE);
  const height = useSharedValue(INITIAL_SIZE);

  useEffect(() => {
    // Update dimensions on change (for orientation changes)
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    // Only run animation once when component mounts
    if (SCREEN_WIDTH === 0 || SCREEN_HEIGHT === 0) return;

    // Recalculate positions
    const INITIAL_X_NEW = SCREEN_WIDTH / 2 - INITIAL_SIZE / 2;
    const INITIAL_Y_NEW = SCREEN_HEIGHT / 2 - INITIAL_SIZE / 2;
    
    // Initialize animation values with current dimensions
    // Start logo visible but small and centered
    translateX.value = INITIAL_X_NEW;
    translateY.value = INITIAL_Y_NEW;
    width.value = INITIAL_SIZE;
    height.value = INITIAL_SIZE;
    opacity.value = 0.3; // Start slightly visible so we can see it
    scale.value = 1;

    console.log('[SplashScreen] Starting animation');
    console.log('[SplashScreen] Platform:', Platform.OS);
    console.log('[SplashScreen] Screen dimensions:', SCREEN_WIDTH, SCREEN_HEIGHT);
    console.log('[SplashScreen] Initial position:', INITIAL_X_NEW, INITIAL_Y_NEW);
    console.log('[SplashScreen] Final position:', FINAL_X, FINAL_Y);
    console.log('[SplashScreen] Safe area top:', insets.top);

    // Start animation after a brief delay to ensure screen is ready (longer on mobile)
    const delay = Platform.OS === 'web' ? 100 : 300;
    const startAnimation = setTimeout(() => {
      console.log('[SplashScreen] Animation started - fade in');
      
      // Fade in animation (from 0.3 to 1.0)
      opacity.value = withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.ease),
      });

      // Move and scale animation after fade in starts (slight overlap for smoother animation)
      setTimeout(() => {
        console.log('[SplashScreen] Starting move animation to top-left');
        translateX.value = withTiming(FINAL_X, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        });
        translateY.value = withTiming(FINAL_Y, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        });
        width.value = withTiming(FINAL_SIZE, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        });
        height.value = withTiming(FINAL_SIZE, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        });
        scale.value = withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        });
      }, 800); // Start move while fading in for smoother effect

      // Complete animation after total duration (fade in + move)
      setTimeout(() => {
        console.log('[SplashScreen] Animation complete - navigating');
        onAnimationComplete();
      }, 2800); // Total: 1200ms fade + 1200ms move + 400ms overlap
    }, delay);

    return () => {
      clearTimeout(startAnimation);
    };
  }, []); // Run only once on mount

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      width: width.value,
      height: height.value,
    };
  });

  const handleImageError = () => {
    setLogoError(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        {!logoError ? (
          <RNImage
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            onError={handleImageError}
          />
        ) : (
          <View style={[styles.logo, styles.placeholderLogo]}>
            <View style={styles.placeholderBox} />
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  placeholderLogo: {
    backgroundColor: Colors.dark.primary + '30',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderBox: {
    width: '60%',
    height: '60%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 8,
  },
});

