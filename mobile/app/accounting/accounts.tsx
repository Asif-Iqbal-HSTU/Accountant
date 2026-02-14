import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import api, { API_URL } from '../../services/api';

const YEARS = ['2023', '2024', '2025', '2026'];

export default function AccountsScreen() {
    const [selectedYear, setSelectedYear] = useState('2025');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // PDF Viewer Modal
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState('');

    useEffect(() => {
        loadAccounts();
    }, [selectedYear]);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accounts?year=${selectedYear}`);
            setAccounts(res.data);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const getBaseUrl = () => API_URL.replace('/api', '');

    const handleViewPdf = (path: string, year: string) => {
        const fullUrl = path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
        setPdfUrl(fullUrl);
        setPdfTitle(`Accounts ${year}`);
        setShowPdfModal(true);
    };

    const downloadPdf = async () => {
        if (!pdfUrl) return;
        try {
            const filename = pdfUrl.split('/').pop() || 'accounts.pdf';
            const fileUri = `${FileSystem.documentDirectory}${filename}`;
            const downloadRes = await FileSystem.downloadAsync(pdfUrl, fileUri);

            if (Platform.OS === 'android') {
                const fs = FileSystem as any;
                const permissions = await fs.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const base64 = await FileSystem.readAsStringAsync(downloadRes.uri, { encoding: fs.EncodingType.Base64 });
                    await fs.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, 'application/pdf')
                        .then(async (uri: string) => {
                            await FileSystem.writeAsStringAsync(uri, base64, { encoding: fs.EncodingType.Base64 });
                            Alert.alert('Success', 'File saved to device');
                        });
                } else {
                    Sharing.shareAsync(downloadRes.uri);
                }
            } else {
                Sharing.shareAsync(downloadRes.uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to download file');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Yearly Accounts</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Year Selector */}
                <View style={styles.filterSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearSelector}>
                        {YEARS.map(y => (
                            <TouchableOpacity
                                key={y}
                                style={[styles.yearChip, selectedYear === y && styles.yearChipActive]}
                                onPress={() => setSelectedYear(y)}
                            >
                                <Text style={[styles.yearChipText, selectedYear === y && styles.yearChipTextActive]}>{y}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 40 }} />
                    ) : accounts.length > 0 ? (
                        accounts.map((acc) => (
                            <TouchableOpacity
                                key={acc.id}
                                style={styles.card}
                                onPress={() => handleViewPdf(acc.file_path, acc.year)}
                            >
                                <LinearGradient
                                    colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
                                    style={styles.cardGradient}
                                >
                                    <View style={styles.cardIcon}>
                                        <Ionicons name="calculator" size={28} color="#8b5cf6" />
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardTitle}>Year Ended {acc.year}</Text>
                                        <Text style={styles.cardSubtitle}>{acc.filename || 'accounts.pdf'}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#64748b" />
                                </LinearGradient>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={64} color="#334155" />
                            <Text style={styles.emptyTitle}>No Accounts Found</Text>
                            <Text style={styles.emptySubtitle}>Your accountant hasn't uploaded annual accounts for {selectedYear} yet.</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* PDF View Modal */}
            {showPdfModal && (
                <View style={StyleSheet.absoluteFill}>
                    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
                        <View style={styles.pdfHeader}>
                            <TouchableOpacity onPress={() => setShowPdfModal(false)} style={styles.backBtn}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.pdfTitle} numberOfLines={1}>{pdfTitle}</Text>
                            <TouchableOpacity onPress={downloadPdf} style={styles.backBtn}>
                                <Ionicons name="download-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#fff' }}>
                            <WebView
                                source={{ uri: (Platform.OS === 'android' ? `https://docs.google.com/gview?embedded=true&url=${pdfUrl}` : pdfUrl) || '' }}
                                style={{ flex: 1 }}
                                startInLoadingState
                            />
                        </View>
                    </SafeAreaView>
                </View>
            )}
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
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    filterSection: { marginBottom: 20 },
    yearSelector: { paddingHorizontal: 16 },
    yearChip: {
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    yearChipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
    yearChipText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
    yearChipTextActive: { color: '#fff' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    cardGradient: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    cardIcon: {
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
    },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    cardSubtitle: { fontSize: 13, color: '#64748b' },
    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 20 },
    emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8 },
    pdfHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    pdfTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' },
});
