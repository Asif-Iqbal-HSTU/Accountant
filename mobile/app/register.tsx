import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export default function Register() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        occupation: '',
        phone: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Validate passwords match
            if (formData.password !== formData.password_confirmation) {
                Alert.alert('Error', 'Passwords do not match');
                setLoading(false);
                return;
            }

            const response = await api.post('/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'client',
                occupation: formData.occupation,
                phone: formData.phone,
            });

            await SecureStore.setItemAsync('token', response.data.access_token);
            await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
            router.replace('/(tabs)');
        } catch (error: any) {
            console.log(error);
            Alert.alert('Error', error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                style={StyleSheet.absoluteFill}
            />

            {/* Background decorations */}
            <View style={[styles.bgCircle, styles.bgCircle1]} />
            <View style={[styles.bgCircle, styles.bgCircle2]} />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={['#3b82f6', '#14b8a6']}
                                style={styles.logoGradient}
                            >
                                <Text style={styles.logoText}>AC</Text>
                            </LinearGradient>
                            <Text style={styles.appName}>AccountantConnect</Text>
                            <Text style={styles.subtitle}>Create your account</Text>
                        </View>

                        {/* Progress Indicator */}
                        <View style={styles.progressContainer}>
                            {[1, 2].map((s) => (
                                <View key={s} style={styles.progressItem}>
                                    <View style={[
                                        styles.progressDot,
                                        step >= s && styles.progressDotActive
                                    ]}>
                                        {step > s ? (
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        ) : (
                                            <Text style={[
                                                styles.progressDotText,
                                                step >= s && styles.progressDotTextActive
                                            ]}>{s}</Text>
                                        )}
                                    </View>
                                    {s < 2 && (
                                        <View style={[
                                            styles.progressLine,
                                            step > s && styles.progressLineActive
                                        ]} />
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Form Card */}
                        <View style={styles.card}>
                            {step === 1 ? (
                                <>
                                    <Text style={styles.cardTitle}>Account Details</Text>
                                    <Text style={styles.cardSubtitle}>Enter your login credentials</Text>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Your Name *</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder="John Doe"
                                                placeholderTextColor="#64748b"
                                                value={formData.name}
                                                onChangeText={(v) => handleChange('name', v)}
                                                style={styles.input}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email Address *</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder="john@example.com"
                                                placeholderTextColor="#64748b"
                                                value={formData.email}
                                                onChangeText={(v) => handleChange('email', v)}
                                                style={styles.input}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Password *</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder="••••••••"
                                                placeholderTextColor="#64748b"
                                                value={formData.password}
                                                onChangeText={(v) => handleChange('password', v)}
                                                style={styles.input}
                                                secureTextEntry={!showPassword}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                <Ionicons
                                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                                    size={20}
                                                    color="#64748b"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Confirm Password *</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder="••••••••"
                                                placeholderTextColor="#64748b"
                                                value={formData.password_confirmation}
                                                onChangeText={(v) => handleChange('password_confirmation', v)}
                                                style={styles.input}
                                                secureTextEntry={!showPassword}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            onPress={() => router.back()}
                                            style={styles.backButton}
                                        >
                                            <Text style={styles.backButtonText}>Login</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => setStep(2)}
                                            disabled={!formData.name || !formData.email || !formData.password}
                                            style={[
                                                styles.button,
                                                styles.buttonFlex,
                                                (!formData.name || !formData.email || !formData.password) && styles.buttonDisabled
                                            ]}
                                        >
                                            <LinearGradient
                                                colors={(!formData.name || !formData.email || !formData.password)
                                                    ? ['#475569', '#475569']
                                                    : ['#3b82f6', '#14b8a6']}
                                                style={styles.buttonGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                <Text style={styles.buttonText}>Continue</Text>
                                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.cardTitle}>Almost there!</Text>
                                    <Text style={styles.cardSubtitle}>Add some optional details</Text>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Occupation</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="briefcase-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder="Business Owner, Freelancer, etc."
                                                placeholderTextColor="#64748b"
                                                value={formData.occupation}
                                                onChangeText={(v) => handleChange('occupation', v)}
                                                style={styles.input}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Phone Number</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="call-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                            <TextInput
                                                placeholder="+44 20 1234 5678"
                                                placeholderTextColor="#64748b"
                                                value={formData.phone}
                                                onChangeText={(v) => handleChange('phone', v)}
                                                style={styles.input}
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            onPress={() => setStep(1)}
                                            style={styles.backButton}
                                        >
                                            <Text style={styles.backButtonText}>Back</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleSubmit}
                                            disabled={loading}
                                            style={[styles.button, styles.buttonFlex, loading && styles.buttonDisabled]}
                                        >
                                            <LinearGradient
                                                colors={loading ? ['#475569', '#475569'] : ['#3b82f6', '#14b8a6']}
                                                style={styles.buttonGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                {loading ? (
                                                    <ActivityIndicator color="#fff" />
                                                ) : (
                                                    <>
                                                        <Text style={styles.buttonText}>Get Started</Text>
                                                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                                    </>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Features */}
                        <View style={styles.features}>
                            {[
                                { icon: 'shield-checkmark', label: 'Secure & Private' },
                                { icon: 'flash', label: '2-min setup' },
                                { icon: 'chatbubbles', label: 'Instant messaging' },
                            ].map((f, i) => (
                                <View key={i} style={styles.featureItem}>
                                    <Ionicons name={f.icon as any} size={20} color="#14b8a6" />
                                    <Text style={styles.featureText}>{f.label}</Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    bgCircle: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.15,
    },
    bgCircle1: {
        width: 300,
        height: 300,
        backgroundColor: '#3b82f6',
        top: -50,
        left: -100,
    },
    bgCircle2: {
        width: 250,
        height: 250,
        backgroundColor: '#14b8a6',
        bottom: 50,
        right: -80,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoGradient: {
        width: 64,
        height: 64,
        borderRadius: 16,
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
        fontSize: 24,
        fontWeight: 'bold',
    },
    appName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 4,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDotActive: {
        backgroundColor: '#14b8a6',
        borderColor: '#14b8a6',
    },
    progressDotText: {
        color: '#64748b',
        fontWeight: '600',
    },
    progressDotTextActive: {
        color: '#fff',
    },
    progressLine: {
        width: 40,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 8,
        borderRadius: 2,
    },
    progressLineActive: {
        backgroundColor: '#14b8a6',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    cardSubtitle: {
        color: '#94a3b8',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingRight: 4,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        color: '#fff',
        fontSize: 16,
    },
    button: {
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonFlex: {
        flex: 1,
    },
    buttonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    backButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    features: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 24,
        paddingHorizontal: 8,
    },
    featureItem: {
        alignItems: 'center',
        gap: 4,
    },
    featureText: {
        color: '#94a3b8',
        fontSize: 12,
    },
});
