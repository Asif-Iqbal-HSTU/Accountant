import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import * as SecureStore from 'expo-secure-store';
import { router, useFocusEffect } from 'expo-router';

export default function MessagesScreen() {
    const [user, setUser] = useState<any>(null);
    const [accountant, setAccountant] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        if (accountant) {
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [accountant]);

    const loadData = async () => {
        const userStr = await SecureStore.getItemAsync('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }

        try {
            const accResponse = await api.get('/accountants');
            if (accResponse.data.length > 0) {
                setAccountant(accResponse.data[0]);
                fetchMessagesForAccountant(accResponse.data[0].id);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchMessages = async () => {
        if (!accountant) return;
        fetchMessagesForAccountant(accountant.id);
    };

    const fetchMessagesForAccountant = async (accountantId: number) => {
        try {
            const response = await api.get(`/messages/${accountantId}`);
            setMessages(response.data.reverse()); // Show newest first
        } catch (error) {
            console.log(error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getInitials = (name: string) => {
        if (!name) return '??';
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const stripHtml = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]+>/g, '').trim();
    };

    const formatTime = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Just now';
        if (hours < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (hours < 48) return 'Yesterday';
        return d.toLocaleDateString();
    };

    const getMessageTypeIcon = (type: string) => {
        switch (type) {
            case 'image': return 'image';
            case 'audio': return 'mic';
            case 'file': return 'document-attach';
            default: return null;
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#14b8a6" />
                </View>
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
                    <Text style={styles.title}>Messages</Text>
                    {accountant && (
                        <TouchableOpacity
                            style={styles.newMessageBtn}
                            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: accountant.id, name: accountant.name } })}
                        >
                            <Ionicons name="create-outline" size={20} color="#14b8a6" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Accountant Chat Card */}
                {accountant && (
                    <TouchableOpacity
                        style={styles.accountantCard}
                        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: accountant.id, name: accountant.name } })}
                    >
                        <LinearGradient colors={['#3b82f6', '#14b8a6']} style={styles.accountantAvatar}>
                            <Text style={styles.accountantInitials}>{getInitials(accountant.name)}</Text>
                        </LinearGradient>
                        <View style={styles.accountantInfo}>
                            <Text style={styles.accountantName}>{accountant.name}</Text>
                            {accountant.firm_name && (
                                <Text style={styles.firmName}>{accountant.firm_name}</Text>
                            )}
                        </View>
                        <View style={styles.chatIndicator}>
                            <Ionicons name="chevron-forward" size={20} color="#64748b" />
                        </View>
                        {accountant.unread_count > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{accountant.unread_count}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {/* Message Preview List */}
                <View style={styles.messagesSection}>
                    <Text style={styles.sectionTitle}>Conversation History</Text>

                    <FlatList
                        data={messages.slice(0, 20)}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14b8a6" />
                        }
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIcon}>
                                    <Ionicons name="chatbubbles-outline" size={48} color="#3b82f6" />
                                </View>
                                <Text style={styles.emptyText}>No messages yet</Text>
                                <Text style={styles.emptySubtext}>Start a conversation with your accountant</Text>
                                {accountant && (
                                    <TouchableOpacity
                                        style={styles.startChatBtn}
                                        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: accountant.id, name: accountant.name } })}
                                    >
                                        <LinearGradient
                                            colors={['#3b82f6', '#14b8a6']}
                                            style={styles.startChatGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.startChatText}>Start Conversation</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                        renderItem={({ item }) => {
                            const isMyMessage = item.sender_id === user?.id;
                            const typeIcon = getMessageTypeIcon(item.type);

                            return (
                                <TouchableOpacity
                                    style={styles.messageItem}
                                    onPress={() => accountant && router.push({ pathname: '/chat/[id]', params: { id: accountant.id, name: accountant.name } })}
                                >
                                    <View style={[styles.messageIndicator, isMyMessage ? styles.sentIndicator : styles.receivedIndicator]} />
                                    <View style={styles.messageContent}>
                                        <View style={styles.messageHeader}>
                                            <Text style={styles.messageSender}>
                                                {isMyMessage ? 'You' : accountant?.name}
                                            </Text>
                                            <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
                                        </View>
                                        <View style={styles.messagePreviewRow}>
                                            {typeIcon && (
                                                <Ionicons name={typeIcon as any} size={14} color="#64748b" style={{ marginRight: 4 }} />
                                            )}
                                            <Text style={styles.messagePreview} numberOfLines={2}>
                                                {item.type === 'text' || !item.type
                                                    ? stripHtml(item.content) || 'Message'
                                                    : item.type === 'image' ? 'Photo'
                                                        : item.type === 'audio' ? 'Voice message'
                                                            : 'Attachment'
                                                }
                                            </Text>
                                        </View>
                                        {!item.read_at && !isMyMessage && (
                                            <View style={styles.newBadge}>
                                                <Text style={styles.newBadgeText}>NEW</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    newMessageBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(20, 184, 166, 0.2)',
    },
    accountantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 24,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    accountantAvatar: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accountantInitials: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    accountantInfo: {
        flex: 1,
        marginLeft: 14,
    },
    accountantName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#f1f5f9',
    },
    firmName: {
        fontSize: 13,
        color: '#14b8a6',
        marginTop: 2,
    },
    chatIndicator: {
        marginLeft: 8,
    },
    unreadBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        minWidth: 22,
        height: 22,
        backgroundColor: '#ef4444',
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    messagesSection: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    messageItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    messageIndicator: {
        width: 4,
        borderRadius: 2,
        marginRight: 12,
    },
    sentIndicator: {
        backgroundColor: '#3b82f6',
    },
    receivedIndicator: {
        backgroundColor: '#14b8a6',
    },
    messageContent: {
        flex: 1,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    messageSender: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f1f5f9',
    },
    messageTime: {
        fontSize: 12,
        color: '#64748b',
    },
    messagePreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    messagePreview: {
        fontSize: 14,
        color: '#94a3b8',
        flex: 1,
    },
    newBadge: {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: '#14b8a6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#fff',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#e2e8f0',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
        marginBottom: 24,
    },
    startChatBtn: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    startChatGradient: {
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    startChatText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
