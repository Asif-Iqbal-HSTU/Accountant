import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';

export default function CompanyInfoScreen() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        company_number: '',
        auth_code: '',
        ct_reference: '',
        vat_registration: '',
        paye_registration: '',
        accounts_office_ref: '',
    });

    useEffect(() => {
        loadCompanyInfo();
    }, []);

    const loadCompanyInfo = async () => {
        try {
            const res = await api.get('/company-info');
            if (res.data) {
                setForm({
                    company_number: res.data.company_number || '',
                    auth_code: res.data.auth_code || '',
                    ct_reference: res.data.ct_reference || '',
                    vat_registration: res.data.vat_registration || '',
                    paye_registration: res.data.paye_registration || '',
                    accounts_office_ref: res.data.accounts_office_ref || '',
                });
            }
        } catch (error) {
            console.log('Error loading company info:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveCompanyInfo = async () => {
        setSaving(true);
        try {
            await api.post('/company-info', form);
            Alert.alert('Success', 'Company information saved successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to save company information');
        } finally {
            setSaving(false);
        }
    };

    const fields = [
        { key: 'company_number', label: 'Company Number', icon: 'business-outline' },
        { key: 'auth_code', label: 'Company Authentication Code', icon: 'key-outline' },
        { key: 'ct_reference', label: 'Corporation Tax Reference', icon: 'document-text-outline' },
        { key: 'vat_registration', label: 'VAT Registration Number', icon: 'receipt-outline' },
        { key: 'paye_registration', label: 'PAYE Registration Number', icon: 'people-outline' },
        { key: 'accounts_office_ref', label: 'Accounts Office Reference', icon: 'folder-outline' },
    ];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color="#14b8a6" />
            </View>
        );
    }

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
                    <Text style={styles.headerTitle}>Company Info</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    {/* Info Banner */}
                    <View style={styles.banner}>
                        <LinearGradient
                            colors={['rgba(59, 130, 246, 0.15)', 'rgba(20, 184, 166, 0.1)']}
                            style={styles.bannerGradient}
                        >
                            <Ionicons name="information-circle" size={20} color="#3b82f6" />
                            <Text style={styles.bannerText}>
                                Enter your company registration details below. Your accountant can also update these from the portal.
                            </Text>
                        </LinearGradient>
                    </View>

                    {/* Form Fields */}
                    {fields.map((field) => (
                        <View key={field.key} style={styles.fieldContainer}>
                            <View style={styles.fieldLabel}>
                                <Ionicons name={field.icon as any} size={16} color="#14b8a6" />
                                <Text style={styles.labelText}>{field.label}</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={form[field.key as keyof typeof form]}
                                onChangeText={(text) => setForm({ ...form, [field.key]: text })}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                placeholderTextColor="#475569"
                            />
                        </View>
                    ))}

                    {/* Incorporation Certificate */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.fieldLabel}>
                            <Ionicons name="document-attach-outline" size={16} color="#14b8a6" />
                            <Text style={styles.labelText}>Incorporation Certificate</Text>
                        </View>
                        <TouchableOpacity style={styles.uploadBtn}>
                            <Ionicons name="cloud-upload-outline" size={20} color="#3b82f6" />
                            <Text style={styles.uploadText}>Upload Certificate</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity onPress={saveCompanyInfo} disabled={saving} style={styles.saveContainer}>
                        <LinearGradient
                            colors={['#3b82f6', '#14b8a6']}
                            style={styles.saveBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.saveText}>Save Company Info</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    content: { paddingHorizontal: 20 },
    banner: { marginBottom: 24, borderRadius: 12, overflow: 'hidden' },
    bannerGradient: {
        flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10,
    },
    bannerText: { flex: 1, fontSize: 13, color: '#94a3b8', lineHeight: 20 },
    fieldContainer: { marginBottom: 20 },
    fieldLabel: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
    },
    labelText: { fontSize: 13, fontWeight: '600', color: '#e2e8f0' },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 15, color: '#fff',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    uploadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 12, paddingVertical: 14,
        borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)', borderStyle: 'dashed',
    },
    uploadText: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
    saveContainer: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 16,
    },
    saveText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
