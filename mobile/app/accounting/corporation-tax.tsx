import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';

const YEARS = ['2023', '2024', '2025', '2026'];
const CT_TABS = ['CT600', 'Tax Computation', 'Tax Liability'];

export default function CorporationTaxScreen() {
    const [selectedYear, setSelectedYear] = useState('2025');
    const [activeTab, setActiveTab] = useState(0);
    const [taxData, setTaxData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/corporation-tax?year=${selectedYear}`);
            setTaxData(res.data.length > 0 ? res.data[0] : null);
        } catch (error) {
            console.log('Error loading corporation tax:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCT600 = () => (
        <View>
            {taxData?.ct600_file ? (
                <View style={styles.docCard}>
                    <View style={styles.docInfo}>
                        <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.docIcon}>
                            <Ionicons name="document-text" size={28} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.docTitle}>CT600 — {selectedYear}</Text>
                            <Text style={styles.docFilename}>{taxData.ct600_filename || 'ct600.pdf'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.viewDownloadBtn}
                        onPress={() => Linking.openURL(taxData.ct600_file)}
                    >
                        <Ionicons name="eye-outline" size={18} color="#fff" />
                        <Text style={styles.viewDownloadText}>View & Download</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="document-outline" size={48} color="#475569" />
                    <Text style={styles.emptyText}>No CT600 for {selectedYear}</Text>
                    <Text style={styles.emptySubtext}>Your accountant will upload it</Text>
                </View>
            )}
        </View>
    );

    const renderTaxComputation = () => (
        <View>
            {taxData?.tax_computation_file ? (
                <View style={styles.docCard}>
                    <View style={styles.docInfo}>
                        <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.docIcon}>
                            <Ionicons name="calculator" size={28} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.docTitle}>Tax Computation — {selectedYear}</Text>
                            <Text style={styles.docFilename}>{taxData.tax_computation_filename || 'computation.pdf'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.viewDownloadBtn}
                        onPress={() => Linking.openURL(taxData.tax_computation_file)}
                    >
                        <Ionicons name="eye-outline" size={18} color="#fff" />
                        <Text style={styles.viewDownloadText}>View & Download</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="calculator-outline" size={48} color="#475569" />
                    <Text style={styles.emptyText}>No computation for {selectedYear}</Text>
                    <Text style={styles.emptySubtext}>Your accountant will upload it</Text>
                </View>
            )}
        </View>
    );

    const renderTaxLiability = () => (
        <View>
            {taxData?.liability_amount ? (
                <View style={styles.liabilityCard}>
                    <View style={styles.liabilityHeader}>
                        <Text style={styles.liabilityLabel}>Tax Liability</Text>
                        <Text style={styles.liabilityAmount}>£{parseFloat(taxData.liability_amount).toFixed(2)}</Text>
                    </View>

                    {taxData.payment_reference && (
                        <View style={styles.refRow}>
                            <Text style={styles.refLabel}>Payment Reference</Text>
                            <Text style={styles.refValue}>{taxData.payment_reference}</Text>
                        </View>
                    )}

                    {taxData.payment_link && (
                        <TouchableOpacity
                            style={styles.payBtn}
                            onPress={() => Linking.openURL(taxData.payment_link)}
                        >
                            <LinearGradient
                                colors={['#f59e0b', '#d97706']}
                                style={styles.payBtnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="card-outline" size={18} color="#fff" />
                                <Text style={styles.payBtnText}>Pay Now</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="cash-outline" size={48} color="#475569" />
                    <Text style={styles.emptyText}>No liability for {selectedYear}</Text>
                    <Text style={styles.emptySubtext}>Liability info will appear here</Text>
                </View>
            )}
        </View>
    );

    const tabContent = [renderCT600, renderTaxComputation, renderTaxLiability];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Corporation Tax</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    {/* Year Selector */}
                    <View style={styles.yearRow}>
                        {YEARS.map((year) => (
                            <TouchableOpacity
                                key={year}
                                style={[styles.yearChip, selectedYear === year && styles.yearChipActive]}
                                onPress={() => setSelectedYear(year)}
                            >
                                <Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextActive]}>
                                    {year}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabBar}>
                        {CT_TABS.map((tab, i) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === i && styles.tabActive]}
                                onPress={() => setActiveTab(i)}
                            >
                                <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 40 }} />
                    ) : (
                        tabContent[activeTab]()
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    content: { paddingHorizontal: 20 },
    yearRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    yearChip: {
        flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    yearChipActive: { backgroundColor: '#f59e0b' },
    yearChipText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
    yearChipTextActive: { color: '#fff' },
    tabBar: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: {
        flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    tabActive: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' },
    tabText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
    tabTextActive: { color: '#f59e0b' },
    docCard: {
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
        padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    docInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    docIcon: {
        width: 56, height: 56, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
    },
    docTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    docFilename: { fontSize: 12, color: '#64748b', marginTop: 4 },
    viewDownloadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#f59e0b', borderRadius: 10, paddingVertical: 12,
    },
    viewDownloadText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    liabilityCard: {
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
        padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    liabilityHeader: { marginBottom: 16 },
    liabilityLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
    liabilityAmount: { fontSize: 32, fontWeight: 'bold', color: '#f59e0b' },
    refRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10,
        padding: 12, marginBottom: 16,
    },
    refLabel: { fontSize: 13, color: '#64748b' },
    refValue: { fontSize: 13, fontWeight: '600', color: '#e2e8f0' },
    payBtn: { borderRadius: 12, overflow: 'hidden' },
    payBtnGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14,
    },
    payBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    emptyState: { alignItems: 'center', paddingVertical: 50 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
    emptySubtext: { fontSize: 13, color: '#64748b', marginTop: 4 },
});
