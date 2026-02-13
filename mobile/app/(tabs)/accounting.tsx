import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import api from '../../services/api';
import * as SecureStore from 'expo-secure-store';

const WIZARD_CARDS = [
    {
        id: 'company-info',
        title: 'Company Info',
        subtitle: 'Company details & registration numbers',
        icon: 'business',
        colors: ['#3b82f6', '#2563eb'] as const,
        route: '/accounting/company-info',
    },
    {
        id: 'payroll',
        title: 'Payroll',
        subtitle: 'Hours, payslips, liabilities & P60/P45',
        icon: 'people',
        colors: ['#14b8a6', '#0d9488'] as const,
        route: '/accounting/payroll',
    },
    {
        id: 'accounts',
        title: 'Accounts',
        subtitle: 'View & download yearly accounts',
        icon: 'calculator',
        colors: ['#8b5cf6', '#7c3aed'] as const,
        route: '/accounting/accounts',
    },
    {
        id: 'corporation-tax',
        title: 'Corporation Tax',
        subtitle: 'CT600, computations & liabilities',
        icon: 'document-text',
        colors: ['#f59e0b', '#d97706'] as const,
        route: '/accounting/corporation-tax',
    },
    {
        id: 'vat',
        title: 'VAT',
        subtitle: 'Quarterly returns & liabilities',
        icon: 'receipt',
        colors: ['#ef4444', '#dc2626'] as const,
        route: '/accounting/vat',
    },
    {
        id: 'self-assessment',
        title: 'Self Assessment',
        subtitle: 'Tax returns & liabilities',
        icon: 'person',
        colors: ['#06b6d4', '#0891b2'] as const,
        route: '/accounting/self-assessment',
    },
];

export default function AccountingScreen() {
    const [user, setUser] = useState<any>(null);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const userStr = await SecureStore.getItemAsync('user');
            if (userStr) setUser(JSON.parse(userStr));

            const infoRes = await api.get('/company-info');
            setCompanyInfo(infoRes.data);
        } catch (error) {
            console.log('Error loading accounting data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#14b8a6"
                        />
                    }
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>Accounting</Text>
                            <Text style={styles.subtitle}>Manage your finances</Text>
                        </View>
                        <LinearGradient colors={['#3b82f6', '#14b8a6']} style={styles.headerIcon}>
                            <Ionicons name="briefcase" size={24} color="#fff" />
                        </LinearGradient>
                    </View>

                    {/* Company Info Summary */}
                    {companyInfo && (
                        <TouchableOpacity
                            style={styles.companyCard}
                            onPress={() => router.push('/accounting/company-info' as any)}
                        >
                            <LinearGradient
                                colors={['rgba(59, 130, 246, 0.1)', 'rgba(20, 184, 166, 0.1)']}
                                style={styles.companyCardGradient}
                            >
                                <View style={styles.companyHeader}>
                                    <Text style={styles.companyLabel}>COMPANY DETAILS</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#64748b" />
                                </View>
                                {companyInfo.company_number && (
                                    <Text style={styles.companyNumber}>
                                        Company No: {companyInfo.company_number}
                                    </Text>
                                )}
                                {companyInfo.vat_registration && (
                                    <Text style={styles.companyDetail}>
                                        VAT: {companyInfo.vat_registration}
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {/* Wizard Cards */}
                    <View style={styles.cardsSection}>
                        <Text style={styles.sectionTitle}>Services</Text>
                        <View style={styles.cardsGrid}>
                            {WIZARD_CARDS.map((card) => (
                                <TouchableOpacity
                                    key={card.id}
                                    style={styles.wizardCard}
                                    onPress={() => router.push(card.route as any)}
                                    activeOpacity={0.7}
                                >
                                    <LinearGradient
                                        colors={[card.colors[0] + '20', card.colors[1] + '10']}
                                        style={styles.wizardCardGradient}
                                    >
                                        <LinearGradient
                                            colors={[card.colors[0], card.colors[1]]}
                                            style={styles.wizardIconContainer}
                                        >
                                            <Ionicons name={card.icon as any} size={24} color="#fff" />
                                        </LinearGradient>
                                        <Text style={styles.wizardTitle}>{card.title}</Text>
                                        <Text style={styles.wizardSubtitle} numberOfLines={2}>
                                            {card.subtitle}
                                        </Text>
                                        <View style={styles.wizardArrow}>
                                            <Ionicons name="arrow-forward" size={16} color={card.colors[0]} />
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 20 }} />
                </ScrollView>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    headerIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    companyCard: {
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    companyCardGradient: {
        padding: 16,
    },
    companyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    companyLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
        letterSpacing: 1,
    },
    companyNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f1f5f9',
        marginBottom: 4,
    },
    companyDetail: {
        fontSize: 13,
        color: '#64748b',
    },
    cardsSection: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    wizardCard: {
        width: '47.5%',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    wizardCardGradient: {
        padding: 16,
        minHeight: 160,
        justifyContent: 'space-between',
    },
    wizardIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    wizardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    wizardSubtitle: {
        fontSize: 11,
        color: '#94a3b8',
        lineHeight: 16,
        marginBottom: 8,
    },
    wizardArrow: {
        alignSelf: 'flex-end',
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
