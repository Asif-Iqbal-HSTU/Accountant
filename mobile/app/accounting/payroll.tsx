import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Linking,
    Platform,
    Share,
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

const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
const YEARS = ['2023/2024', '2024/2025', '2025/2026'];

export default function PayrollScreen() {
    const [selectedYear, setSelectedYear] = useState('2024/2025');
    const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [liability, setLiability] = useState<any>(null);
    const [starterForm, setStarterForm] = useState<any>(null);
    const [p60p45s, setP60p45s] = useState<any[]>([]);

    // Add Employee Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({ name: '', hours: '', holidays: '', notes: '' });

    // PDF Viewer Modal
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState('');

    // Document List Modal (for P60/P45 if multiple)
    const [showDocListModal, setShowDocListModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedYear, selectedMonth]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [subsRes, liabRes, starterRes, p60Res] = await Promise.all([
                api.get(`/payroll/submissions?year=${selectedYear}&month=${selectedMonth}`),
                api.get(`/payroll/liabilities?year=${selectedYear}`),
                api.get('/payroll/starter-form'),
                api.get('/payroll/p60-p45')
            ]);

            setSubmissions(subsRes.data || []);
            setStarterForm(starterRes.data || null);
            setP60p45s(Array.isArray(p60Res.data) ? p60Res.data : []);

            // Filter liability for selected month
            const currentMonthLiab = liabRes.data.find((l: any) => l.month === selectedMonth);
            setLiability(currentMonthLiab || null);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmployee = async () => {
        if (!form.name || !form.hours) {
            Alert.alert('Missing Fields', 'Please enter Name and Hours');
            return;
        }

        try {
            await api.post('/payroll/submissions', {
                year: selectedYear,
                month: selectedMonth,
                name: form.name,
                hours: form.hours,
                holidays: form.holidays,
                notes: form.notes,
            });
            setShowAddModal(false);
            setForm({ name: '', hours: '', holidays: '', notes: '' });
            loadData();
            Alert.alert('Success', 'Employee added successfully');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to add employee');
        }
    };

    const getBaseUrl = () => {
        return API_URL.replace('/api', '');
    };

    const handleViewPdf = (path: string, title: string) => {
        if (!path) return;
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
            const filename = pdfUrl.split('/').pop() || 'document.pdf';
            const fs = FileSystem as any;
            const fileUri = `${fs.documentDirectory}${filename}`;

            const downloadRes = await FileSystem.downloadAsync(pdfUrl, fileUri);

            if (Platform.OS === 'android') {
                const permissions = await fs.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const base64 = await FileSystem.readAsStringAsync(downloadRes.uri, { encoding: fs.EncodingType.Base64 });
                    await fs.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, 'application/pdf')
                        .then(async (uri: string) => {
                            await FileSystem.writeAsStringAsync(uri, base64, { encoding: fs.EncodingType.Base64 });
                            Alert.alert('Success', 'File saved to device');
                        })
                        .catch((e: any) => console.log(e));
                } else {
                    Sharing.shareAsync(downloadRes.uri);
                }
            } else {
                Sharing.shareAsync(downloadRes.uri);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to download file');
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
                    <Text style={styles.headerTitle}>Payroll</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Filter / Year & Month Selector */}
                <View style={styles.filterSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
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

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {MONTHS.map(m => (
                            <TouchableOpacity
                                key={m}
                                style={[styles.monthChip, selectedMonth === m && styles.monthChipActive]}
                                onPress={() => setSelectedMonth(m)}
                            >
                                <Text style={[styles.monthChipText, selectedMonth === m && styles.monthChipTextActive]}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <ScrollView contentContainerStyle={styles.listContent}>
                    {/* Liability Section */}
                    {liability && (
                        <View style={styles.liabilityCard}>
                            <LinearGradient
                                colors={['#1e293b', '#334155']}
                                style={styles.liabilityGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.liabilityHeader}>
                                    <View>
                                        <Text style={styles.liabilityLabel}>Monthly Liability</Text>
                                        <Text style={styles.liabilityAmount}>£{liability.amount}</Text>
                                    </View>
                                    <View style={styles.liabilityStatus}>
                                        <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                                        <Text style={styles.liabilityStatusText}>Pending Payment</Text>
                                    </View>
                                </View>

                                {liability.payment_reference && (
                                    <View style={styles.referenceContainer}>
                                        <Text style={styles.referenceLabel}>Reference:</Text>
                                        <TouchableOpacity
                                            style={styles.referenceBox}
                                            onPress={() => copyToClipboard(liability.payment_reference)}
                                        >
                                            <Text style={styles.referenceValue}>{liability.payment_reference}</Text>
                                            <Ionicons name="copy-outline" size={16} color="#94a3b8" />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {liability.payment_link && (
                                    <TouchableOpacity
                                        style={styles.payNowBtn}
                                        onPress={() => handleOpenPayment(liability.payment_link)}
                                    >
                                        <Text style={styles.payNowBtnText}>Pay Now</Text>
                                        <Ionicons name="open-outline" size={18} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </LinearGradient>
                        </View>
                    )}

                    <View style={styles.contentHeader}>
                        <Text style={styles.sectionTitle}>Employee List ({selectedMonth})</Text>

                        {/* Add Employee Button */}
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => setShowAddModal(true)}
                        >
                            <LinearGradient
                                colors={['#3b82f6', '#14b8a6']}
                                style={styles.addBtnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.addBtnText}>Add Employee</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 40 }} />
                    ) : submissions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color="#475569" />
                            <Text style={styles.emptyText}>No employees added for this month.</Text>
                        </View>
                    ) : (
                        <View style={styles.gridContainer}>
                            {submissions.map((item) => (
                                <View key={item.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardName}>{item.name}</Text>

                                        {/* Status / Action Icons */}
                                        <View style={styles.cardActions}>
                                            {item.status === 'processed' && item.payslip_file_path ? (
                                                <TouchableOpacity onPress={() => handleViewPdf(item.payslip_file_path, `${item.name} - ${item.month}`)}>
                                                    <View style={styles.iconBadge}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                                                        <Ionicons name="eye-outline" size={18} color="#3b82f6" style={{ marginLeft: 4 }} />
                                                    </View>
                                                </TouchableOpacity>
                                            ) : item.status === 'processing' ? (
                                                <View style={styles.statusContainer}>
                                                    <ActivityIndicator size="small" color="#f59e0b" />
                                                </View>
                                            ) : (
                                                <Ionicons name="cloud-upload-outline" size={20} color="#64748b" />
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.cardDetails}>
                                        <Text style={styles.detailText}>Hours Worked: <Text style={styles.detailValue}>{item.hours}</Text></Text>
                                        <Text style={styles.detailText}>Holidays: <Text style={styles.detailValue}>{item.holidays || '0'}</Text></Text>
                                        {item.notes ? (
                                            <Text style={styles.detailText} numberOfLines={1}>Note: <Text style={styles.detailValue}>{item.notes}</Text></Text>
                                        ) : null}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>

                {/* FABs / Document Quick Actions */}
                <View style={styles.fabContainer}>
                    {p60p45s.length > 0 && (
                        <TouchableOpacity
                            style={[styles.extendedFab, { backgroundColor: '#8b5cf6' }]}
                            onPress={() => p60p45s.length === 1
                                ? handleViewPdf(p60p45s[0].file_path, `${p60p45s[0].type.toUpperCase()} - ${p60p45s[0].tax_year}`)
                                : setShowDocListModal(true)
                            }
                        >
                            <Ionicons name="document-text-outline" size={20} color="#fff" />
                            <Text style={styles.fabText}>P60 & P45</Text>
                        </TouchableOpacity>
                    )}

                    {starterForm && starterForm.file_path && (
                        <TouchableOpacity
                            style={[styles.extendedFab, { backgroundColor: '#3b82f6' }]}
                            onPress={() => handleViewPdf(starterForm.file_path, 'Starter Form')}
                        >
                            <Ionicons name="person-add-outline" size={20} color="#fff" />
                            <Text style={styles.fabText}>Starter Form</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>

            {/* Document List Modal (P60/P45) */}
            <Modal visible={showDocListModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalOverlayClose} onPress={() => setShowDocListModal(false)} />
                    <View style={styles.docListModalContent}>
                        <View style={styles.docListHeader}>
                            <Text style={styles.docListTitle}>P60 & P45 Documents</Text>
                            <TouchableOpacity onPress={() => setShowDocListModal(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.docListScroll}>
                            {p60p45s.map((doc) => (
                                <TouchableOpacity
                                    key={doc.id}
                                    style={styles.docItem}
                                    onPress={() => {
                                        setShowDocListModal(false);
                                        handleViewPdf(doc.file_path, `${doc.type.toUpperCase()} - ${doc.tax_year}`);
                                    }}
                                >
                                    <View style={styles.docItemIcon}>
                                        <Ionicons name="document" size={20} color="#8b5cf6" />
                                    </View>
                                    <View style={styles.docItemInfo}>
                                        <Text style={styles.docItemType}>{doc.type.toUpperCase()}</Text>
                                        <Text style={styles.docItemYear}>Tax Year: {doc.tax_year}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Add Employee Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.modalGradient}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add Employee</Text>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Employee Name"
                                placeholderTextColor="#475569"
                                value={form.name}
                                onChangeText={t => setForm({ ...form, name: t })}
                            />
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                                    placeholder="Hours"
                                    placeholderTextColor="#475569"
                                    keyboardType="numeric"
                                    value={form.hours}
                                    onChangeText={t => setForm({ ...form, hours: t })}
                                />
                                <TextInput
                                    style={[styles.input, { flex: 1, marginLeft: 8 }]}
                                    placeholder="Holidays"
                                    placeholderTextColor="#475569"
                                    keyboardType="numeric"
                                    value={form.holidays}
                                    onChangeText={t => setForm({ ...form, holidays: t })}
                                />
                            </View>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="Notes"
                                placeholderTextColor="#475569"
                                multiline
                                value={form.notes}
                                onChangeText={t => setForm({ ...form, notes: t })}
                            />

                            <TouchableOpacity onPress={handleAddEmployee} style={styles.submitBtn}>
                                <LinearGradient
                                    colors={['#3b82f6', '#14b8a6']}
                                    style={styles.submitBtnGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.submitBtnText}>Add Employee</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>

            {/* PDF Viewer Modal */}
            <Modal visible={showPdfModal} animationType="slide" onRequestClose={() => setShowPdfModal(false)}>
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
                    {pdfUrl && (
                        <View style={{ flex: 1, backgroundColor: '#fff' }}>
                            {Platform.OS === 'android' ? (
                                <WebView
                                    source={{ uri: `https://docs.google.com/gview?embedded=true&url=${pdfUrl}` }}
                                    style={{ flex: 1 }}
                                    startInLoadingState
                                    renderLoading={() => <ActivityIndicator style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
                                />
                            ) : (
                                <WebView
                                    source={{ uri: pdfUrl }}
                                    style={{ flex: 1 }}
                                    startInLoadingState
                                />
                            )}
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
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
    filterSection: { marginBottom: 16, gap: 10 },
    selectorScroll: { maxHeight: 40 },
    yearChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    yearChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    yearChipText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
    yearChipTextActive: { color: '#fff' },
    monthChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8,
    },
    monthChipActive: { backgroundColor: '#14b8a6' },
    monthChipText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
    monthChipTextActive: { color: '#fff' },
    contentHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, marginBottom: 12,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#e2e8f0' },
    addBtn: { borderRadius: 8, overflow: 'hidden' },
    addBtnGradient: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, gap: 6,
    },
    addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    listContent: { paddingHorizontal: 16, paddingBottom: 40 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
        width: '48%', // 2 columns roughly
        backgroundColor: '#e0f2fe', // sky-100 equivalent for that light blue look in screenshot
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 4 },
    cardActions: { alignItems: 'flex-end' },
    statusContainer: { padding: 2 },
    iconBadge: { flexDirection: 'row', alignItems: 'center' },
    cardDetails: { gap: 2 },
    detailText: { fontSize: 12, color: '#334155' },
    detailValue: { fontWeight: '600', color: '#0f172a' },
    emptyState: { alignItems: 'center', paddingTop: 40 },
    emptyText: { color: '#64748b', marginTop: 12 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
    modalGradient: { padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#fff',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12,
    },
    row: { flexDirection: 'row' },
    submitBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
    submitBtnGradient: { alignItems: 'center', paddingVertical: 16 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // PDF Viewer
    pdfHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    pdfTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center', marginHorizontal: 10 },

    // Liability Styles
    liabilityCard: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    liabilityGradient: {
        padding: 20,
    },
    liabilityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    liabilityLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    liabilityAmount: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    liabilityStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    liabilityStatusText: {
        color: '#f59e0b',
        fontSize: 12,
        fontWeight: '700',
    },
    referenceContainer: {
        marginBottom: 16,
    },
    referenceLabel: {
        color: '#64748b',
        fontSize: 12,
        marginBottom: 6,
    },
    referenceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    referenceValue: {
        color: '#e2e8f0',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    payNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        borderRadius: 14,
        paddingVertical: 14,
        gap: 8,
    },
    payNowBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // FAB Styles
    fabContainer: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        gap: 12,
        alignItems: 'flex-end',
    },
    extendedFab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 30,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        gap: 10,
    },
    fabText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },

    // Doc List Modal
    modalOverlayClose: {
        ...StyleSheet.absoluteFillObject,
    },
    docListModalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        paddingBottom: 40,
    },
    docListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    docListTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    docListScroll: {
        padding: 16,
    },
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    docItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    docItemInfo: {
        flex: 1,
    },
    docItemType: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    docItemYear: {
        color: '#94a3b8',
        fontSize: 13,
    },
});
