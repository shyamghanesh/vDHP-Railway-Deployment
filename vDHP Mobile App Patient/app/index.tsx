import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import { SplashScreen } from '@/components/SplashScreen';

export default function Index() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Only navigate after both animation completes AND minimum time has passed
    if (!showSplash && animationComplete) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        checkAuth();
      }, 100);
    }
  }, [showSplash, animationComplete]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        router.replace('/(app)/dashboard');
      } else {
        router.replace('/(auth)/welcome');
      }
    } catch (error) {
      router.replace('/(auth)/welcome');
    }
  };

  const handleSplashComplete = () => {
    console.log('[Index] Splash animation complete');
    setAnimationComplete(true);
    // Wait a bit before hiding splash to ensure animation is fully visible
    setTimeout(() => {
      setShowSplash(false);
    }, 200);
  };

  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return <View style={{ flex: 1 }} />;
}
