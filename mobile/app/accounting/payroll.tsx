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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';

const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
const TAX_YEARS_P60 = ['2023/2024', '2024/2025', '2025/2026'];
const TABS = ['Submit Hours', 'Payslips', 'Liabilities', 'Starter Form', 'P60/P45'];

export default function PayrollScreen() {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedYear, setSelectedYear] = useState('2024/2025');
    const [loading, setLoading] = useState(false);

    // Submit Hours state
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [submitForm, setSubmitForm] = useState({ name: '', hours: '', holidays: '', notes: '' });
    const [submissions, setSubmissions] = useState<any[]>([]);

    // Payslips state
    const [payslips, setPayslips] = useState<any[]>([]);

    // Liabilities state
    const [liabilities, setLiabilities] = useState<any[]>([]);

    // Starter Form state
    const [starterForm, setStarterForm] = useState<any>(null);

    // P60/P45 state
    const [p60p45s, setP60p45s] = useState<any[]>([]);
    const [selectedP60Year, setSelectedP60Year] = useState('2024/2025');

    useEffect(() => {
        loadTabData();
    }, [activeTab, selectedYear, selectedP60Year]);

    const loadTabData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 0:
                    const subRes = await api.get(`/payroll/submissions?year=${selectedYear}`);
                    setSubmissions(subRes.data);
                    break;
                case 1:
                    const payRes = await api.get(`/payroll/payslips?year=${selectedYear}`);
                    setPayslips(payRes.data);
                    break;
                case 2:
                    const liabRes = await api.get(`/payroll/liabilities?year=${selectedYear}`);
                    setLiabilities(liabRes.data);
                    break;
                case 3:
                    const formRes = await api.get('/payroll/starter-form');
                    setStarterForm(formRes.data);
                    break;
                case 4:
                    const p60Res = await api.get(`/payroll/p60-p45?tax_year=${selectedP60Year}`);
                    setP60p45s(p60Res.data);
                    break;
            }
        } catch (error) {
            console.log('Error loading payroll data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitHours = async () => {
        try {
            await api.post('/payroll/submissions', {
                month: selectedMonth,
                year: selectedYear,
                ...submitForm,
            });
            Alert.alert('Success', 'Payroll hours submitted successfully');
            setShowSubmitModal(false);
            setSubmitForm({ name: '', hours: '', holidays: '', notes: '' });
            loadTabData();
        } catch (error) {
            Alert.alert('Error', 'Failed to submit payroll hours');
        }
    };

    const openMonthSubmit = (month: string) => {
        setSelectedMonth(month);
        setShowSubmitModal(true);
    };

    const renderSubmitHours = () => (
        <View>
            <Text style={styles.tabDescription}>Submit payroll hours for each month</Text>
            {MONTHS.map((month) => {
                const submitted = submissions.find((s) => s.month === month);
                return (
                    <TouchableOpacity
                        key={month}
                        style={styles.monthCard}
                        onPress={() => openMonthSubmit(month)}
                    >
                        <View style={styles.monthInfo}>
                            <Ionicons
                                name={submitted ? 'checkmark-circle' : 'ellipse-outline'}
                                size={20}
                                color={submitted ? '#10b981' : '#64748b'}
                            />
                            <Text style={styles.monthText}>{month}</Text>
                        </View>
                        <View style={styles.monthRight}>
                            {submitted && <Text style={styles.submittedText}>Submitted</Text>}
                            <Ionicons name="chevron-forward" size={18} color="#64748b" />
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderPayslips = () => (
        <View>
            <Text style={styles.tabDescription}>View and download payslips</Text>
            {MONTHS.map((month) => {
                const payslip = payslips.find((p) => p.month === month);
                return (
                    <View key={month} style={styles.monthCard}>
                        <View style={styles.monthInfo}>
                            <Ionicons
                                name={payslip ? 'document-text' : 'document-text-outline'}
                                size={20}
                                color={payslip ? '#3b82f6' : '#475569'}
                            />
                            <Text style={styles.monthText}>{month}</Text>
                        </View>
                        {payslip ? (
                            <TouchableOpacity
                                style={styles.downloadBtn}
                                onPress={() => Linking.openURL(payslip.file_path)}
                            >
                                <Ionicons name="download-outline" size={16} color="#14b8a6" />
                                <Text style={styles.downloadText}>Download</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.notAvailableText}>Not available</Text>
                        )}
                    </View>
                );
            })}
        </View>
    );

    const renderLiabilities = () => (
        <View>
            <Text style={styles.tabDescription}>Monthly payroll liabilities and payment info</Text>
            {MONTHS.map((month) => {
                const liability = liabilities.find((l) => l.month === month);
                return (
                    <View key={month} style={styles.liabilityCard}>
                        <View style={styles.liabilityHeader}>
                            <Text style={styles.monthText}>{month}</Text>
                            {liability && (
                                <Text style={styles.amountText}>£{parseFloat(liability.amount).toFixed(2)}</Text>
                            )}
                        </View>
                        {liability ? (
                            <View style={styles.liabilityDetails}>
                                {liability.payment_reference && (
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Payment Ref:</Text>
                                        <Text style={styles.detailValue}>{liability.payment_reference}</Text>
                                    </View>
                                )}
                                {liability.payment_link && (
                                    <TouchableOpacity
                                        style={styles.payBtn}
                                        onPress={() => Linking.openURL(liability.payment_link)}
                                    >
                                        <Ionicons name="card-outline" size={16} color="#fff" />
                                        <Text style={styles.payBtnText}>Pay Now</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.notAvailableText}>No liability set</Text>
                        )}
                    </View>
                );
            })}
        </View>
    );

    const renderStarterForm = () => (
        <View>
            <Text style={styles.tabDescription}>View and download the starter form</Text>
            {starterForm ? (
                <View style={styles.starterCard}>
                    <View style={styles.starterInfo}>
                        <LinearGradient colors={['#3b82f6', '#14b8a6']} style={styles.starterIcon}>
                            <Ionicons name="document-text" size={28} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.starterTitle}>Starter Form</Text>
                            <Text style={styles.starterFilename}>{starterForm.filename || 'starter_form.pdf'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.downloadFullBtn}
                        onPress={() => Linking.openURL(starterForm.file_path)}
                    >
                        <Ionicons name="download-outline" size={18} color="#fff" />
                        <Text style={styles.downloadFullText}>Download Form</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="document-outline" size={48} color="#475569" />
                    <Text style={styles.emptyText}>No starter form available</Text>
                    <Text style={styles.emptySubtext}>Your accountant will upload it here</Text>
                </View>
            )}

            {/* Upload button */}
            <TouchableOpacity style={styles.uploadArea}>
                <Ionicons name="cloud-upload-outline" size={24} color="#3b82f6" />
                <Text style={styles.uploadAreaText}>Upload Starter Form</Text>
            </TouchableOpacity>
        </View>
    );

    const renderP60P45 = () => (
        <View>
            <Text style={styles.tabDescription}>View and download P60s and P45s</Text>

            {/* Year Selector */}
            <View style={styles.yearSelector}>
                {TAX_YEARS_P60.map((year) => (
                    <TouchableOpacity
                        key={year}
                        style={[styles.yearChip, selectedP60Year === year && styles.yearChipActive]}
                        onPress={() => setSelectedP60Year(year)}
                    >
                        <Text style={[styles.yearChipText, selectedP60Year === year && styles.yearChipTextActive]}>
                            {year}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {p60p45s.length > 0 ? (
                p60p45s.map((doc) => (
                    <View key={doc.id} style={styles.monthCard}>
                        <View style={styles.monthInfo}>
                            <Ionicons name="document-text" size={20} color="#8b5cf6" />
                            <View>
                                <Text style={styles.monthText}>{doc.type.toUpperCase()}</Text>
                                <Text style={styles.notAvailableText}>{doc.tax_year}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.downloadBtn}
                            onPress={() => Linking.openURL(doc.file_path)}
                        >
                            <Ionicons name="download-outline" size={16} color="#14b8a6" />
                            <Text style={styles.downloadText}>Download</Text>
                        </TouchableOpacity>
                    </View>
                ))
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="folder-open-outline" size={48} color="#475569" />
                    <Text style={styles.emptyText}>No documents for {selectedP60Year}</Text>
                </View>
            )}
        </View>
    );

    const tabContent = [renderSubmitHours, renderPayslips, renderLiabilities, renderStarterForm, renderP60P45];

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

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
                    {TABS.map((tab, i) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === i && styles.tabActive]}
                            onPress={() => setActiveTab(i)}
                        >
                            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Content */}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 40 }} />
                    ) : (
                        tabContent[activeTab]()
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>

            {/* Submit Hours Modal */}
            <Modal visible={showSubmitModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.modalGradient}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Submit Hours — {selectedMonth}</Text>
                                <TouchableOpacity onPress={() => setShowSubmitModal(false)}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalDescription}>
                                Please submit the name, hours, holidays and any other notes in the box below
                            </Text>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="Employee Name"
                                placeholderTextColor="#475569"
                                value={submitForm.name}
                                onChangeText={(t) => setSubmitForm({ ...submitForm, name: t })}
                            />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Hours Worked"
                                placeholderTextColor="#475569"
                                keyboardType="numeric"
                                value={submitForm.hours}
                                onChangeText={(t) => setSubmitForm({ ...submitForm, hours: t })}
                            />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Holiday Hours"
                                placeholderTextColor="#475569"
                                keyboardType="numeric"
                                value={submitForm.holidays}
                                onChangeText={(t) => setSubmitForm({ ...submitForm, holidays: t })}
                            />
                            <TextInput
                                style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                                placeholder="Additional Notes"
                                placeholderTextColor="#475569"
                                multiline
                                value={submitForm.notes}
                                onChangeText={(t) => setSubmitForm({ ...submitForm, notes: t })}
                            />

                            <TouchableOpacity onPress={handleSubmitHours} style={styles.submitBtnContainer}>
                                <LinearGradient
                                    colors={['#3b82f6', '#14b8a6']}
                                    style={styles.submitBtn}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.submitBtnText}>Submit Hours</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
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
    tabBar: { maxHeight: 48, paddingHorizontal: 16, marginBottom: 8 },
    tab: {
        paddingHorizontal: 16, paddingVertical: 10, marginRight: 8,
        borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)',
    },
    tabActive: { backgroundColor: '#14b8a6' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    tabTextActive: { color: '#fff' },
    content: { paddingHorizontal: 20 },
    tabDescription: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
    monthCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12,
        padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    monthInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    monthText: { fontSize: 15, fontWeight: '500', color: '#e2e8f0' },
    monthRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    submittedText: { fontSize: 12, color: '#10b981', fontWeight: '600' },
    notAvailableText: { fontSize: 12, color: '#475569' },
    downloadBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 8, backgroundColor: 'rgba(20, 184, 166, 0.1)',
    },
    downloadText: { fontSize: 12, fontWeight: '600', color: '#14b8a6' },
    liabilityCard: {
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12,
        padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    liabilityHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8,
    },
    amountText: { fontSize: 18, fontWeight: 'bold', color: '#14b8a6' },
    liabilityDetails: { gap: 8 },
    detailRow: { flexDirection: 'row', gap: 8 },
    detailLabel: { fontSize: 12, color: '#64748b' },
    detailValue: { fontSize: 12, color: '#e2e8f0', fontWeight: '600' },
    payBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 10,
    },
    payBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    starterCard: {
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
        padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 16,
    },
    starterInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    starterIcon: {
        width: 56, height: 56, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
    },
    starterTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    starterFilename: { fontSize: 13, color: '#64748b', marginTop: 4 },
    downloadFullBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#14b8a6', borderRadius: 10, paddingVertical: 12,
    },
    downloadFullText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    uploadArea: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderRadius: 12, paddingVertical: 16,
        borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', borderStyle: 'dashed',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
    },
    uploadAreaText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
    yearSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    yearChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    yearChipActive: { backgroundColor: '#8b5cf6' },
    yearChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    yearChipTextActive: { color: '#fff' },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
    emptySubtext: { fontSize: 13, color: '#64748b', marginTop: 4 },
    modalOverlay: {
        flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
    modalGradient: { padding: 24, paddingBottom: 40 },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    modalDescription: { fontSize: 13, color: '#94a3b8', marginBottom: 20, lineHeight: 20 },
    modalInput: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#fff',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12,
    },
    submitBtnContainer: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
    submitBtn: {
        alignItems: 'center', justifyContent: 'center', paddingVertical: 16,
    },
    submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
