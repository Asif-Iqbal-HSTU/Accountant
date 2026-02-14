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
import { WebView } from 'react-native-webview';
import api, { API_URL } from '../../services/api';

const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

export default function PayrollScreen() {
    const [selectedYear, setSelectedYear] = useState('2024/2025');
    const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState<any[]>([]);

    // Add Employee Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({ name: '', hours: '', holidays: '', notes: '' });

    // PDF Viewer Modal
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState('');

    useEffect(() => {
        loadSubmissions();
    }, [selectedYear, selectedMonth]);

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/payroll/submissions?year=${selectedYear}&month=${selectedMonth}`);
            setSubmissions(response.data);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to load employees');
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
            loadSubmissions();
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

    const downloadPdf = async () => {
        if (!pdfUrl) return;

        try {
            const filename = pdfUrl.split('/').pop() || 'document.pdf';
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            const downloadRes = await FileSystem.downloadAsync(pdfUrl, fileUri);

            if (Platform.OS === 'android') {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const base64 = await FileSystem.readAsStringAsync(downloadRes.uri, { encoding: FileSystem.EncodingType.Base64 });
                    await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, 'application/pdf')
                        .then(async (uri: string) => {
                            await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
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

                {/* Filter / Month Selector */}
                <View style={styles.filterSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthSelector}>
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

                {/* Employee List */}
                <ScrollView contentContainerStyle={styles.listContent}>
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
            </SafeAreaView>

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
    filterSection: { marginBottom: 16 },
    monthSelector: { paddingHorizontal: 16, maxHeight: 40 },
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
});
