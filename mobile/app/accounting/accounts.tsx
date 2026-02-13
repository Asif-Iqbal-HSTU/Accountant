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

export default function AccountsScreen() {
    const [selectedYear, setSelectedYear] = useState('2025');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAccounts();
    }, [selectedYear]);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accounts?year=${selectedYear}`);
            setAccounts(res.data);
        } catch (error) {
            console.log('Error loading accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Accounts</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    <Text style={styles.description}>View and download your yearly accounts</Text>

                    {/* Year Selector */}
                    <View style={styles.yearSelector}>
                        {YEARS.map((year) => (
                            <TouchableOpacity
                                key={year}
                                style={[styles.yearCard, selectedYear === year && styles.yearCardActive]}
                                onPress={() => setSelectedYear(year)}
                            >
                                <LinearGradient
                                    colors={selectedYear === year ? ['#8b5cf6', '#7c3aed'] : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                                    style={styles.yearCardGradient}
                                >
                                    <Ionicons
                                        name="calendar"
                                        size={24}
                                        color={selectedYear === year ? '#fff' : '#64748b'}
                                    />
                                    <Text style={[styles.yearText, selectedYear === year && styles.yearTextActive]}>
                                        {year}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Accounts List */}
                    {loading ? (
                        <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 40 }} />
                    ) : accounts.length > 0 ? (
                        accounts.map((acc) => (
                            <View key={acc.id} style={styles.accountCard}>
                                <View style={styles.accountInfo}>
                                    <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.docIcon}>
                                        <Ionicons name="document-text" size={24} color="#fff" />
                                    </LinearGradient>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.docTitle}>Accounts {acc.year}</Text>
                                        <Text style={styles.docFilename}>{acc.filename || 'accounts.pdf'}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.downloadBtn}
                                    onPress={() => Linking.openURL(acc.file_path)}
                                >
                                    <Ionicons name="download-outline" size={18} color="#fff" />
                                    <Text style={styles.downloadText}>Download</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="folder-open-outline" size={56} color="#475569" />
                            <Text style={styles.emptyText}>No accounts for {selectedYear}</Text>
                            <Text style={styles.emptySubtext}>Your accountant will upload them here</Text>
                        </View>
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
    description: { fontSize: 13, color: '#94a3b8', marginBottom: 20 },
    yearSelector: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    yearCard: {
        flex: 1, borderRadius: 14, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    yearCardActive: { borderColor: '#8b5cf6' },
    yearCardGradient: {
        alignItems: 'center', paddingVertical: 16, gap: 8,
    },
    yearText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
    yearTextActive: { color: '#fff' },
    accountCard: {
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
        padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    accountInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
    docIcon: {
        width: 48, height: 48, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
    },
    docTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    docFilename: { fontSize: 12, color: '#64748b', marginTop: 4 },
    downloadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#8b5cf6', borderRadius: 10, paddingVertical: 12,
    },
    downloadText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 16 },
    emptySubtext: { fontSize: 13, color: '#64748b', marginTop: 4 },
});
