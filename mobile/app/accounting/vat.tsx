import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';

const YEARS = ['2025', '2026'];
const QUARTERS = [1, 2, 3, 4];

export default function VatScreen() {
    const [selectedYear, setSelectedYear] = useState('2025');
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [activeTab, setActiveTab] = useState(0);
    const [vatData, setVatData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, [selectedYear, selectedQuarter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/vat?year=${selectedYear}&quarter=${selectedQuarter}`);
            setVatData(res.data.length > 0 ? res.data[0] : null);
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
                    <Text style={s.headerTitle}>VAT</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
                    <View style={s.yearRow}>
                        {YEARS.map(y => (
                            <TouchableOpacity key={y} style={[s.yearChip, selectedYear === y && s.yearChipActive]} onPress={() => setSelectedYear(y)}>
                                <Text style={[s.yearChipText, selectedYear === y && s.yearChipTextActive]}>{y}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={s.quarterRow}>
                        {QUARTERS.map(q => (
                            <TouchableOpacity key={q} style={[s.qCard, selectedQuarter === q && s.qCardActive]} onPress={() => setSelectedQuarter(q)}>
                                <Text style={[s.qText, selectedQuarter === q && s.qTextActive]}>Q{q}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={s.tabBar}>
                        {['VAT Returns', 'VAT Liabilities'].map((t, i) => (
                            <TouchableOpacity key={t} style={[s.tab, activeTab === i && s.tabActive]} onPress={() => setActiveTab(i)}>
                                <Text style={[s.tabText, activeTab === i && s.tabTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {loading ? <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 40 }} /> : activeTab === 0 ? (
                        vatData?.vat_return_file ? (
                            <View style={s.docCard}>
                                <View style={s.docInfo}>
                                    <LinearGradient colors={['#ef4444', '#dc2626']} style={s.docIcon}><Ionicons name="receipt" size={28} color="#fff" /></LinearGradient>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.docTitle}>VAT Return — Q{selectedQuarter} {selectedYear}</Text>
                                        <Text style={s.docFilename}>{vatData.vat_return_filename || 'vat_return.pdf'}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={s.dlBtn} onPress={() => Linking.openURL(vatData.vat_return_file)}>
                                    <Ionicons name="eye-outline" size={18} color="#fff" /><Text style={s.dlText}>View & Download</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={s.empty}><Ionicons name="receipt-outline" size={48} color="#475569" /><Text style={s.emptyText}>No VAT return for Q{selectedQuarter} {selectedYear}</Text></View>
                        )
                    ) : (
                        vatData?.liability_amount ? (
                            <View style={s.liabCard}>
                                <Text style={s.liabLabel}>VAT Liability — Q{selectedQuarter} {selectedYear}</Text>
                                <Text style={s.liabAmount}>£{parseFloat(vatData.liability_amount).toFixed(2)}</Text>
                                {vatData.payment_reference && <View style={s.refRow}><Text style={s.refLabel}>Payment Ref</Text><Text style={s.refValue}>{vatData.payment_reference}</Text></View>}
                                {vatData.payment_link && <TouchableOpacity style={s.payBtn} onPress={() => Linking.openURL(vatData.payment_link)}><LinearGradient colors={['#ef4444', '#dc2626']} style={s.payGrad}><Ionicons name="card-outline" size={18} color="#fff" /><Text style={s.payText}>Pay Now</Text></LinearGradient></TouchableOpacity>}
                            </View>
                        ) : (
                            <View style={s.empty}><Ionicons name="cash-outline" size={48} color="#475569" /><Text style={s.emptyText}>No liability for Q{selectedQuarter} {selectedYear}</Text></View>
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
    yearRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    yearChip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
    yearChipActive: { backgroundColor: '#ef4444' },
    yearChipText: { fontSize: 16, fontWeight: '700', color: '#64748b' },
    yearChipTextActive: { color: '#fff' },
    quarterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    qCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    qCardActive: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
    qText: { fontSize: 18, fontWeight: 'bold', color: '#475569' },
    qTextActive: { color: '#ef4444' },
    tabBar: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    tabActive: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    tabTextActive: { color: '#ef4444' },
    docCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    docInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    docIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    docTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    docFilename: { fontSize: 12, color: '#64748b', marginTop: 4 },
    dlBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 12 },
    dlText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    liabCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    liabLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
    liabAmount: { fontSize: 32, fontWeight: 'bold', color: '#ef4444', marginBottom: 16 },
    refRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, marginBottom: 16 },
    refLabel: { fontSize: 13, color: '#64748b' },
    refValue: { fontSize: 13, fontWeight: '600', color: '#e2e8f0' },
    payBtn: { borderRadius: 12, overflow: 'hidden' },
    payGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
    payText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    empty: { alignItems: 'center', paddingVertical: 50 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
});
