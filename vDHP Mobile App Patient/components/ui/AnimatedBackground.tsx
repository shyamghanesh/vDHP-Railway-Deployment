import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

// Random position generator
const getRandomPosition = (max: number) => Math.random() * max;

interface OrbProps {
    color: string;
    size: number;
    initialX: number;
    initialY: number;
    duration: number;
}

function Orb({ color, size, initialX, initialY, duration }: OrbProps) {
    const translateX = useSharedValue(initialX);
    const translateY = useSharedValue(initialY);
    const scale = useSharedValue(1);

    useEffect(() => {
        // Move X
        translateX.value = withRepeat(
            withSequence(
                withTiming(getRandomPosition(width), { duration, easing: Easing.inOut(Easing.ease) }),
                withTiming(getRandomPosition(width), { duration, easing: Easing.inOut(Easing.ease) }),
                withTiming(initialX, { duration, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Move Y
        translateY.value = withRepeat(
            withSequence(
                withTiming(getRandomPosition(height), { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
                withTiming(getRandomPosition(height), { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
                withTiming(initialY, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Pulse scale
        scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: duration * 0.8 }),
                withTiming(0.8, { duration: duration * 0.8 }),
                withTiming(1, { duration: duration * 0.8 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        };
    });

    return (
        <Animated.View
            style={[
                styles.orb,
                {
                    width: size,
                    height: size,
                    backgroundColor: color,
                    borderRadius: size / 2,
                },
                animatedStyle,
            ]}
        />
    );
}

export function AnimatedBackground() {
    return (
        <View style={styles.container}>
            {/* Base dark background */}
            <LinearGradient
                colors={Colors.dark.gradient.background as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Animated Orbs */}
            <View style={styles.orbContainer}>
                {/* Primary Color Orb */}
                <Orb
                    color={Colors.dark.primary + '20'} // 20% opacity
                    size={width * 0.8}
                    initialX={-width * 0.2}
                    initialY={-height * 0.1}
                    duration={15000}
                />

                {/* Secondary Color Orb */}
                <Orb
                    color={Colors.dark.secondary + '15'} // 15% opacity
                    size={width * 0.9}
                    initialX={width * 0.4}
                    initialY={height * 0.6}
                    duration={18000}
                />

                {/* Accent Orb */}
                <Orb
                    color={Colors.dark.primaryDark + '15'} // 15% opacity
                    size={width * 0.6}
                    initialX={width * 0.1}
                    initialY={height * 0.3}
                    duration={20000}
                />
            </View>

            {/* Overlay to smooth everything out */}
            <View style={styles.overlay} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
        overflow: 'hidden',
    },
    orbContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    orb: {
        position: 'absolute',
        opacity: 0.6,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(5, 11, 20, 0.3)', // Subtle overlay to blend
        backdropFilter: 'blur(30px)', // Web support
    },
});
