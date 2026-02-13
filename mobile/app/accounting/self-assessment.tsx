import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';

const YEARS = ['2023', '2024', '2025', '2026'];

export default function SelfAssessmentScreen() {
    const [selectedYear, setSelectedYear] = useState('2025');
    const [activeTab, setActiveTab] = useState(0);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, [selectedYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/self-assessment?year=${selectedYear}`);
            setData(res.data.length > 0 ? res.data[0] : null);
        } catch (e) { console.log(e); }
        finally { setLoading(false); }
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={s.safeArea}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Self Assessment</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
                    {/* UTR Number */}
                    {data?.utr_number && (
                        <View style={s.utrCard}>
                            <Text style={s.utrLabel}>UTR Number</Text>
                            <Text style={s.utrValue}>{data.utr_number}</Text>
                        </View>
                    )}

                    {/* Year Selector */}
                    <View style={s.yearRow}>
                        {YEARS.map(y => (
                            <TouchableOpacity key={y} style={[s.yearChip, selectedYear === y && s.yearChipActive]} onPress={() => setSelectedYear(y)}>
                                <Text style={[s.yearChipText, selectedYear === y && s.yearChipTextActive]}>{y}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tabs */}
                    <View style={s.tabBar}>
                        {['Tax Return', 'Tax Liability'].map((t, i) => (
                            <TouchableOpacity key={t} style={[s.tab, activeTab === i && s.tabActive]} onPress={() => setActiveTab(i)}>
                                <Text style={[s.tabText, activeTab === i && s.tabTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {loading ? <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 40 }} /> : activeTab === 0 ? (
                        data?.tax_return_file ? (
                            <View style={s.docCard}>
                                <View style={s.docInfo}>
                                    <LinearGradient colors={['#06b6d4', '#0891b2']} style={s.docIcon}><Ionicons name="document-text" size={28} color="#fff" /></LinearGradient>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.docTitle}>Tax Return — {selectedYear}</Text>
                                        <Text style={s.docFilename}>{data.tax_return_filename || 'tax_return.pdf'}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={s.dlBtn} onPress={() => Linking.openURL(data.tax_return_file)}>
                                    <Ionicons name="eye-outline" size={18} color="#fff" /><Text style={s.dlText}>View & Download</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={s.empty}><Ionicons name="document-outline" size={48} color="#475569" /><Text style={s.emptyText}>No tax return for {selectedYear}</Text><Text style={s.emptySub}>Your accountant will upload it</Text></View>
                        )
                    ) : (
                        data?.liability_amount ? (
                            <View style={s.liabCard}>
                                <Text style={s.liabLabel}>Tax Liability — {selectedYear}</Text>
                                <Text style={s.liabAmount}>£{parseFloat(data.liability_amount).toFixed(2)}</Text>
                                {data.payment_reference && <View style={s.refRow}><Text style={s.refLabel}>Payment Ref</Text><Text style={s.refValue}>{data.payment_reference}</Text></View>}
                                {data.payment_link && <TouchableOpacity style={s.payBtn} onPress={() => Linking.openURL(data.payment_link)}><LinearGradient colors={['#06b6d4', '#0891b2']} style={s.payGrad}><Ionicons name="card-outline" size={18} color="#fff" /><Text style={s.payText}>Pay Now</Text></LinearGradient></TouchableOpacity>}
                            </View>
                        ) : (
                            <View style={s.empty}><Ionicons name="cash-outline" size={48} color="#475569" /><Text style={s.emptyText}>No liability for {selectedYear}</Text><Text style={s.emptySub}>Liability info will appear here</Text></View>
                        )
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 }, safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    content: { paddingHorizontal: 20 },
    utrCard: { backgroundColor: 'rgba(6,182,212,0.1)', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(6,182,212,0.2)' },
    utrLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
    utrValue: { fontSize: 20, fontWeight: 'bold', color: '#06b6d4' },
    yearRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    yearChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
    yearChipActive: { backgroundColor: '#06b6d4' },
    yearChipText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
    yearChipTextActive: { color: '#fff' },
    tabBar: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    tabActive: { backgroundColor: 'rgba(6,182,212,0.15)', borderColor: '#06b6d4' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    tabTextActive: { color: '#06b6d4' },
    docCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    docInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    docIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    docTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    docFilename: { fontSize: 12, color: '#64748b', marginTop: 4 },
    dlBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#06b6d4', borderRadius: 10, paddingVertical: 12 },
    dlText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    liabCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    liabLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
    liabAmount: { fontSize: 32, fontWeight: 'bold', color: '#06b6d4', marginBottom: 16 },
    refRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, marginBottom: 16 },
    refLabel: { fontSize: 13, color: '#64748b' },
    refValue: { fontSize: 13, fontWeight: '600', color: '#e2e8f0' },
    payBtn: { borderRadius: 12, overflow: 'hidden' },
    payGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
    payText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    empty: { alignItems: 'center', paddingVertical: 50 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
    emptySub: { fontSize: 13, color: '#64748b', marginTop: 4 },
});
