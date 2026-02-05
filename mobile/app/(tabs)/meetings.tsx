import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import api from '../../services/api';

export default function MeetingsScreen() {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMeetings = async () => {
        try {
            const response = await api.get('/meetings');
            setMeetings(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadMeetings();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadMeetings();
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return 'TBD';
        const date = new Date(dateStr);
        // IOS/Android consistent formatting
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleString(undefined, options);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return '#14b8a6';
            case 'pending_accountant': return '#eab308';
            case 'pending_client': return '#3b82f6';
            case 'declined': return '#ef4444';
            case 'cancelled': return '#64748b';
            default: return '#64748b';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Confirmed';
            case 'pending_accountant': return 'Pending Approval';
            case 'pending_client': return 'Action Required';
            case 'declined': return 'Declined';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const handleCancel = async (id: number) => {
        Alert.alert(
            'Cancel Meeting',
            'Are you sure you want to cancel this meeting?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.put(`/meetings/${id}`, { status: 'cancelled' });
                            loadMeetings();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to cancel meeting');
                        }
                    }
                }
            ]
        );
    };

    const handleConfirm = async (id: number, slot: string) => {
        Alert.alert(
            'Confirm Meeting',
            `Confirm meeting for ${formatDateTime(slot)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            // Automatically assume video link generation logic on backend will trigger if needed
                            await api.put(`/meetings/${id}`, {
                                status: 'confirmed',
                                confirmed_at: slot
                            });
                            loadMeetings();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to confirm meeting');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <Ionicons
                        name={item.type === 'video' ? 'videocam' : item.type === 'phone' ? 'call' : 'people'}
                        size={12}
                        color="#fff"
                        style={{ marginRight: 4 }}
                    />
                    <Text style={styles.typeText}>{item.type.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>

            {item.latest_negotiation_note && item.status === 'pending_client' && (
                <View style={styles.noteContainer}>
                    <Text style={styles.noteTitle}>Accountant's Note:</Text>
                    <Text style={styles.noteText}>{item.latest_negotiation_note}</Text>
                </View>
            )}

            {item.confirmed_at ? (
                <View style={styles.row}>
                    <Ionicons name="time-outline" size={16} color="#94a3b8" />
                    <Text style={styles.rowText}>{formatDateTime(item.confirmed_at)}</Text>
                </View>
            ) : (
                <View>
                    <View style={styles.row}>
                        <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                        <Text style={styles.rowText}>
                            {item.status === 'pending_client' ? 'Proposed New Time(s):' :
                                (item.proposed_slots && item.proposed_slots.length > 0
                                    ? `${item.proposed_slots.length} proposed times`
                                    : 'No time set')}
                        </Text>
                    </View>
                    {item.status === 'pending_client' && item.proposed_slots?.map((slot: string, idx: number) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.slotButton}
                            onPress={() => handleConfirm(item.id, slot)}
                        >
                            <Text style={styles.slotButtonText}>Accept: {formatDateTime(slot)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.actionRow}>
                {item.meeting_link && item.status === 'confirmed' && (
                    <TouchableOpacity style={styles.joinBtn}>
                        <Text style={styles.joinBtnText}>Join Meeting</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                )}

                {item.status === 'pending_client' && (
                    <TouchableOpacity
                        style={[styles.joinBtn, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                        onPress={() => router.push(`/meetings/request?id=${item.id}`)}
                    >
                        <Text style={[styles.joinBtnText, { color: '#fff' }]}>Propose Other</Text>
                    </TouchableOpacity>
                )}

                {(item.status === 'pending_accountant' || item.status === 'confirmed' || item.status === 'pending_client') && (
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => handleCancel(item.id)}
                    >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.title}>Meetings</Text>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => router.push('/meetings/request')}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator color="#14b8a6" />
                    </View>
                ) : (
                    <FlatList
                        data={meetings}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14b8a6" />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="calendar-outline" size={64} color="#334155" />
                                <Text style={styles.emptyText}>No meetings scheduled</Text>
                                <TouchableOpacity
                                    style={styles.emptyBtn}
                                    onPress={() => router.push('/meetings/request')}
                                >
                                    <Text style={styles.emptyBtnText}>Schedule a Meeting</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    addBtn: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#14b8a6',
        justifyContent: 'center', alignItems: 'center',
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 100 },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    rowText: { color: '#94a3b8', marginLeft: 6, fontSize: 14 },
    joinBtn: {
        marginTop: 0,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    joinBtnText: { color: '#fff', fontWeight: '600', marginRight: 8 },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#64748b', fontSize: 16, marginTop: 16 },
    emptyBtn: { marginTop: 24, backgroundColor: 'rgba(20, 184, 166, 0.1)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    emptyBtnText: { color: '#14b8a6', fontWeight: 'bold' },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' },
    cancelBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: { color: '#ef4444', fontWeight: '600' },
    noteContainer: {
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        marginTop: 4
    },
    noteTitle: { color: '#14b8a6', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
    noteText: { color: '#e2e8f0', fontSize: 14 },
    slotButton: {
        marginTop: 8,
        backgroundColor: 'rgba(20, 184, 166, 0.2)',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#14b8a6',
    },
    slotButtonText: { color: '#14b8a6', fontWeight: 'bold', textAlign: 'center' }
});
