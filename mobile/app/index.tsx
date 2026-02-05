import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';

export default function Index() {
    const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            const user = await SecureStore.getItemAsync('user');

            if (token && user) {
                setAuthState('authenticated');
            } else {
                setAuthState('unauthenticated');
            }
        } catch (error) {
            console.log('Auth check error:', error);
            setAuthState('unauthenticated');
        }
    };

    // Show loading screen while checking auth
    if (authState === 'loading') {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar style="light" />
                <LinearGradient
                    colors={['#0f172a', '#1e293b', '#0f172a']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.logoContainer}>
                    <LinearGradient
                        colors={['#3b82f6', '#14b8a6']}
                        style={styles.logo}
                    >
                        <Text style={styles.logoText}>AC</Text>
                    </LinearGradient>
                    <ActivityIndicator size="small" color="#14b8a6" style={{ marginTop: 20 }} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    // Redirect based on auth state
    if (authState === 'authenticated') {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/setup" />;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    logoText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    loadingText: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 12,
    },
});
