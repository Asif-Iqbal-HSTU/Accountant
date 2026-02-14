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
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import api, { API_URL } from '../../services/api';

const YEARS = ['2023', '2024', '2025', '2026'];
const QUARTERS = [
    { id: 1, label: 'Q1', full: 'Quarter 1 (Jan-Mar)' },
    { id: 2, label: 'Q2', full: 'Quarter 2 (Apr-Jun)' },
    { id: 3, label: 'Q3', full: 'Quarter 3 (Jul-Sep)' },
    { id: 4, label: 'Q4', full: 'Quarter 4 (Oct-Dec)' },
];

export default function VatScreen() {
    const [selectedYear, setSelectedYear] = useState('2025');
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [vatData, setVatData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // PDF Viewer Modal
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState('');

    useEffect(() => {
        loadData();
    }, [selectedYear, selectedQuarter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/vat?year=${selectedYear}&quarter=${selectedQuarter}`);
            setVatData(res.data.length > 0 ? res.data[0] : null);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to load VAT data');
        } finally {
            setLoading(false);
        }
    };

    const getBaseUrl = () => API_URL.replace('/api', '');

    const handleViewPdf = (path: string, title: string) => {
        const fullUrl = path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
        setPdfUrl(fullUrl);
        setPdfTitle(title);
        setShowPdfModal(true);
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied', 'Reference number copied to clipboard');
    };

    const handleOpenPayment = async (url: string) => {
        if (!url) return;
        await WebBrowser.openBrowserAsync(url);
    };

    const downloadPdf = async () => {
        if (!pdfUrl) return;
        try {
            const filename = pdfUrl.split('/').pop() || 'vat-return.pdf';
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
                    <Text style={styles.headerTitle}>VAT Returns</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Filters */}
                <View style={styles.filterSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        <View style={styles.filterGroup}>
                            {YEARS.map(y => (
                                <TouchableOpacity
                                    key={y}
                                    style={[styles.chip, selectedYear === y && styles.chipActiveRed]}
                                    onPress={() => setSelectedYear(y)}
                                >
                                    <Text style={[styles.chipText, selectedYear === y && styles.chipTextActive]}>{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={[styles.filterGroup, { marginLeft: 16 }]}>
                            {QUARTERS.map(q => (
                                <TouchableOpacity
                                    key={q.id}
                                    style={[styles.chip, selectedQuarter === q.id && styles.chipActiveBlue]}
                                    onPress={() => setSelectedQuarter(q.id)}
                                >
                                    <Text style={[styles.chipText, selectedQuarter === q.id && styles.chipTextActive]}>{q.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#ef4444" style={{ marginTop: 40 }} />
                    ) : (
                        <>
                            {/* Liability Card */}
                            <View style={styles.liabilityCard}>
                                <LinearGradient
                                    colors={['#ef4444', '#b91c1c']}
                                    style={styles.liabilityGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <View style={styles.liabilityHeader}>
                                        <View>
                                            <Text style={styles.liabilityLabel}>VAT LIABILITY (Q{selectedQuarter} {selectedYear})</Text>
                                            <Text style={styles.liabilityAmount}>
                                                {vatData?.liability_amount ? `£${parseFloat(vatData.liability_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '£0.00'}
                                            </Text>
                                        </View>
                                        <View style={styles.statusBadge}>
                                            <Ionicons name="receipt" size={16} color="#fff" />
                                            <Text style={styles.statusText}>ACTIVE</Text>
                                        </View>
                                    </View>

                                    {vatData?.payment_reference && (
                                        <View style={styles.refSection}>
                                            <Text style={styles.refLabel}>Payment Reference</Text>
                                            <TouchableOpacity
                                                style={styles.refBox}
                                                onPress={() => copyToClipboard(vatData.payment_reference)}
                                            >
                                                <Text style={styles.refValue}>{vatData.payment_reference}</Text>
                                                <Ionicons name="copy-outline" size={16} color="rgba(255,255,255,0.7)" />
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {vatData?.payment_link && (
                                        <TouchableOpacity
                                            style={styles.payBtn}
                                            onPress={() => handleOpenPayment(vatData.payment_link)}
                                        >
                                            <Text style={styles.payBtnText}>Pay HMRC Now</Text>
                                            <Ionicons name="open-outline" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    )}
                                </LinearGradient>
                            </View>

                            {/* VAT Return Document */}
                            <Text style={styles.sectionTitle}>Filing Documents</Text>
                            <TouchableOpacity
                                style={[styles.docCard, !vatData?.vat_return_file && styles.docCardDisabled]}
                                disabled={!vatData?.vat_return_file}
                                onPress={() => handleViewPdf(vatData.vat_return_file, `VAT Return Q${selectedQuarter} ${selectedYear}`)}
                            >
                                <View style={[styles.docIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                    <Ionicons name="document-text" size={24} color="#ef4444" />
                                </View>
                                <View style={styles.docInfo}>
                                    <Text style={styles.docTitle}>VAT Return Statement</Text>
                                    <Text style={styles.docSubtitle}>{vatData?.vat_return_file ? 'Verify & Download Statement' : 'Awaiting upload from accountant'}</Text>
                                </View>
                                {vatData?.vat_return_file && <Ionicons name="chevron-forward" size={20} color="#64748b" />}
                            </TouchableOpacity>

                            <View style={styles.infoCard}>
                                <Ionicons name="information-circle-outline" size={20} color="#64748b" />
                                <Text style={styles.infoText}>
                                    VAT returns for {QUARTERS.find(q => q.id === selectedQuarter)?.full} are typically due on the 7th of the month following the period end.
                                </Text>
                            </View>
                        </>
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
    filterScroll: { py: 4 },
    filterGroup: { flexDirection: 'row', gap: 8 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    chipActiveRed: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
    chipActiveBlue: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    chipText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    liabilityCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 30, elevation: 8, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    liabilityGradient: { padding: 24 },
    liabilityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    liabilityLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
    liabilityAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginTop: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    refSection: { marginBottom: 24 },
    refLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8 },
    refBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    refValue: { color: '#fff', fontSize: 15, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, gap: 10 },
    payBtnText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
    docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    docCardDisabled: { opacity: 0.5 },
    docIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    docInfo: { flex: 1 },
    docTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    docSubtitle: { fontSize: 13, color: '#64748b' },
    infoCard: { flexDirection: 'row', padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, gap: 12, alignItems: 'center' },
    infoText: { flex: 1, fontSize: 12, color: '#64748b', lineHeight: 18 },
    pdfHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    pdfTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' },
});
