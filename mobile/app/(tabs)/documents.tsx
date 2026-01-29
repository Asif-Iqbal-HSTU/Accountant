import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TextInput,
    Image,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.105:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Accept': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

interface Document {
    id: number;
    user_id: number;
    uploaded_by_id: number;
    filename: string;
    filepath: string;
    type: string;
    category: string | null;
    status: 'pending' | 'reviewed' | 'processed';
    notes: string | null;
    accountant_comment: string | null;
    amount: number | null;
    document_date: string | null;
    merchant: string | null;
    file_size: number | null;
    mime_type: string | null;
    created_at: string;
}

interface Stats {
    total: number;
    pending: number;
    reviewed: number;
    processed: number;
}

export default function DocumentsScreen() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchDocuments();
            fetchStats();
        }
    }, [currentUser]);

    const loadUser = async () => {
        const userStr = await SecureStore.getItemAsync('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
    };

    const fetchDocuments = async () => {
        try {
            let url = '/documents';
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (filterStatus) params.append('status', filterStatus);
            if (params.toString()) url += '?' + params.toString();

            const response = await api.get(url);
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/documents/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDocuments();
        fetchStats();
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                multiple: true,
            });

            if (!result.canceled && result.assets.length > 0) {
                uploadFiles(result.assets);
            }
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };

    const pickFromCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required to take photos');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            const asset = result.assets[0];
            uploadFiles([{
                uri: asset.uri,
                name: `receipt_${Date.now()}.jpg`,
                mimeType: 'image/jpeg',
            }]);
        }
    };

    const pickFromGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            const files = result.assets.map((asset, index) => ({
                uri: asset.uri,
                name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
                mimeType: asset.mimeType || 'image/jpeg',
            }));
            uploadFiles(files);
        }
    };

    const uploadFiles = async (files: any[]) => {
        setUploading(true);
        const formData = new FormData();

        files.forEach((file, index) => {
            formData.append(`files[${index}]`, {
                uri: file.uri,
                name: file.name || file.fileName,
                type: file.mimeType || file.type || 'application/octet-stream',
            } as any);
        });

        try {
            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Alert.alert('Success', `${files.length} document(s) uploaded successfully`);
            fetchDocuments();
            fetchStats();
        } catch (error) {
            console.error('Error uploading:', error);
            Alert.alert('Error', 'Failed to upload documents');
        } finally {
            setUploading(false);
        }
    };

    const deleteDocument = (id: number) => {
        Alert.alert(
            'Delete Document',
            'Are you sure you want to delete this document?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/documents/${id}`);
                            setDocuments(prev => prev.filter(d => d.id !== id));
                            fetchStats();
                        } catch (error) {
                            console.error('Error deleting:', error);
                            Alert.alert('Error', 'Failed to delete document');
                        }
                    },
                },
            ]
        );
    };

    const showUploadOptions = () => {
        Alert.alert(
            'Upload Document',
            'Choose an option',
            [
                { text: 'Take Photo (Receipt)', onPress: pickFromCamera },
                { text: 'Choose from Gallery', onPress: pickFromGallery },
                { text: 'Browse Files', onPress: pickDocument },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'reviewed': return '#3b82f6';
            case 'processed': return '#22c55e';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return 'time-outline';
            case 'reviewed': return 'eye-outline';
            case 'processed': return 'checkmark-circle-outline';
            default: return 'help-outline';
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const renderDocument = ({ item }: { item: Document }) => (
        <View style={styles.documentCard}>
            <View style={styles.documentHeader}>
                <View style={styles.fileIconContainer}>
                    {item.mime_type?.startsWith('image/') ? (
                        <Ionicons name="image" size={24} color="#3b82f6" />
                    ) : item.mime_type?.includes('pdf') ? (
                        <Ionicons name="document-text" size={24} color="#ef4444" />
                    ) : (
                        <Ionicons name="document" size={24} color="#6b7280" />
                    )}
                </View>
                <View style={styles.documentInfo}>
                    <Text style={styles.filename} numberOfLines={1}>{item.filename}</Text>
                    <Text style={styles.fileSize}>{formatFileSize(item.file_size)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Ionicons name={getStatusIcon(item.status) as any} size={14} color={getStatusColor(item.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            {item.merchant && (
                <Text style={styles.merchant}>Merchant: {item.merchant}</Text>
            )}
            {item.amount && (
                <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
            )}

            {item.accountant_comment && (
                <View style={styles.commentBox}>
                    <Ionicons name="chatbubble-outline" size={12} color="#3b82f6" />
                    <Text style={styles.commentText}>{item.accountant_comment}</Text>
                </View>
            )}

            <View style={styles.documentFooter}>
                <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteDocument(item.id)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with Stats */}
            <View style={styles.header}>
                <Text style={styles.title}>My Documents</Text>
                {stats && (
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={[styles.statItem, { backgroundColor: '#fef3c7' }]}>
                            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.pending}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={[styles.statItem, { backgroundColor: '#dbeafe' }]}>
                            <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.reviewed}</Text>
                            <Text style={styles.statLabel}>Reviewed</Text>
                        </View>
                        <View style={[styles.statItem, { backgroundColor: '#dcfce7' }]}>
                            <Text style={[styles.statValue, { color: '#22c55e' }]}>{stats.processed}</Text>
                            <Text style={styles.statLabel}>Processed</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Search & Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInput}>
                    <Ionicons name="search" size={18} color="#999" />
                    <TextInput
                        style={styles.searchTextInput}
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={fetchDocuments}
                        returnKeyType="search"
                    />
                </View>
                <TouchableOpacity
                    style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Ionicons name="filter" size={20} color={showFilters ? '#007AFF' : '#666'} />
                </TouchableOpacity>
            </View>

            {showFilters && (
                <View style={styles.filtersContainer}>
                    {['', 'pending', 'reviewed', 'processed'].map((status) => (
                        <TouchableOpacity
                            key={status || 'all'}
                            style={[
                                styles.filterChip,
                                filterStatus === status && styles.filterChipActive
                            ]}
                            onPress={() => {
                                setFilterStatus(status);
                                setTimeout(fetchDocuments, 100);
                            }}
                        >
                            <Text style={[
                                styles.filterChipText,
                                filterStatus === status && styles.filterChipTextActive
                            ]}>
                                {status || 'All'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Documents List */}
            <FlatList
                data={documents}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderDocument}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No documents found</Text>
                        <Text style={styles.emptySubtext}>Upload your first document to get started</Text>
                    </View>
                }
            />

            {/* Upload FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={showUploadOptions}
                disabled={uploading}
            >
                {uploading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Ionicons name="add" size={28} color="#fff" />
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statItem: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 10,
        color: '#666',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
        backgroundColor: '#fff',
    },
    searchInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 12,
        gap: 8,
    },
    searchTextInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 15,
    },
    filterButton: {
        width: 44,
        height: 44,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#e0f2fe',
    },
    filtersContainer: {
        flexDirection: 'row',
        padding: 12,
        paddingTop: 0,
        gap: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
    },
    filterChipActive: {
        backgroundColor: '#007AFF',
    },
    filterChipText: {
        fontSize: 13,
        color: '#666',
        textTransform: 'capitalize',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 12,
        paddingBottom: 100,
    },
    documentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    documentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    fileIconContainer: {
        width: 40,
        height: 40,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentInfo: {
        flex: 1,
    },
    filename: {
        fontSize: 14,
        fontWeight: '600',
    },
    fileSize: {
        fontSize: 12,
        color: '#999',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    merchant: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#22c55e',
        marginTop: 4,
    },
    commentBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 8,
        padding: 8,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
    },
    commentText: {
        flex: 1,
        fontSize: 12,
        color: '#3b82f6',
    },
    documentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 4,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        width: 56,
        height: 56,
        backgroundColor: '#007AFF',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
