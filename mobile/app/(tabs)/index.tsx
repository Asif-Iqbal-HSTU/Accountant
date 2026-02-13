import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import * as SecureStore from 'expo-secure-store';
import { router, useFocusEffect } from 'expo-router';

export default function ClientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [accountant, setAccountant] = useState<any>(null);
  const [stats, setStats] = useState({
    unreadMessages: 0,
    pendingDocs: 0,
    approvedDocs: 0,
    totalDocs: 0,
  });
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkSetup();
    }, [])
  );

  const checkSetup = async () => {
    const token = await SecureStore.getItemAsync('token');
    const userStr = await SecureStore.getItemAsync('user');

    if (!token) {
      router.replace('/setup');
      return;
    }

    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch accountants (should be 1 for bound client)
      const accResponse = await api.get('/accountants');
      if (accResponse.data.length > 0) {
        setAccountant(accResponse.data[0]);

        // Fetch stats
        const statsResponse = await api.get('/documents/stats');
        setStats({
          unreadMessages: accResponse.data[0].unread_count || 0,
          pendingDocs: statsResponse.data.pending || 0,
          approvedDocs: statsResponse.data.approved || 0,
          totalDocs: statsResponse.data.total || 0,
        });

        // Fetch recent messages
        const msgResponse = await api.get(`/messages/${accResponse.data[0].id}`);
        setRecentMessages(msgResponse.data.slice(-3).reverse());
      }
    } catch (error: any) {
      console.log(error);
      if (error.response?.status === 401) {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        router.replace('/setup');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // Ignore errors - we're logging out anyway
    }
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    router.replace('/setup');
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
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#0f172a']}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient colors={['#3b82f6', '#14b8a6']} style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>AC</Text>
        </LinearGradient>
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#14b8a6"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Client'}</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* Accountant Card */}
          {accountant && (
            <View style={styles.accountantCard}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.1)', 'rgba(20, 184, 166, 0.1)']}
                style={styles.accountantCardGradient}
              >
                <View style={styles.accountantHeader}>
                  <Text style={styles.accountantLabel}>Your Accountant</Text>
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Available</Text>
                  </View>
                </View>
                <View style={styles.accountantInfo}>
                  <LinearGradient
                    colors={['#3b82f6', '#14b8a6']}
                    style={styles.accountantAvatar}
                  >
                    <Text style={styles.accountantInitials}>
                      {getInitials(accountant.name)}
                    </Text>
                  </LinearGradient>
                  <View style={styles.accountantDetails}>
                    <Text style={styles.accountantName}>{accountant.name}</Text>
                    {accountant.firm_name && (
                      <View style={styles.firmRow}>
                        <Ionicons name="business-outline" size={14} color="#14b8a6" />
                        <Text style={styles.firmName}>{accountant.firm_name}</Text>
                      </View>
                    )}
                    <Text style={styles.accountantEmail}>{accountant.email}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.messageAccountantBtn}
                  onPress={() => router.push({ pathname: '/chat/[id]', params: { id: accountant.id, name: accountant.name } })}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#14b8a6']}
                    style={styles.messageAccountantGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                    <Text style={styles.messageAccountantText}>Send Message</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Quick Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push('/(tabs)/messages')}
              >
                <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Ionicons name="chatbubbles" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statValue}>{stats.unreadMessages}</Text>
                <Text style={styles.statLabel}>Unread Messages</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push('/(tabs)/documents')}
              >
                <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="time" size={24} color="#f59e0b" />
                </View>
                <Text style={styles.statValue}>{stats.pendingDocs}</Text>
                <Text style={styles.statLabel}>Pending Review</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push('/(tabs)/documents')}
              >
                <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{stats.approvedDocs}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push('/(tabs)/documents')}
              >
                <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Ionicons name="folder" size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.statValue}>{stats.totalDocs}</Text>
                <Text style={styles.statLabel}>Total Documents</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Messages */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Messages</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/messages')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentMessages.length > 0 ? (
              recentMessages.map((msg, index) => (
                <TouchableOpacity
                  key={msg.id || index}
                  style={styles.messageCard}
                  onPress={() => accountant && router.push({ pathname: '/chat/[id]', params: { id: accountant.id, name: accountant.name } })}
                >
                  <View style={styles.messageIcon}>
                    <Ionicons
                      name={msg.sender_id === user?.id ? "arrow-up" : "arrow-down"}
                      size={16}
                      color={msg.sender_id === user?.id ? "#3b82f6" : "#14b8a6"}
                    />
                  </View>
                  <View style={styles.messageContent}>
                    <Text style={styles.messageSender}>
                      {msg.sender_id === user?.id ? 'You' : accountant?.name}
                    </Text>
                    <Text style={styles.messagePreview} numberOfLines={1}>
                      {stripHtml(msg.content) || 'Attachment'}
                    </Text>
                  </View>
                  <Text style={styles.messageTime}>{formatTime(msg.created_at)}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyMessages}>
                <Ionicons name="chatbubble-outline" size={32} color="#64748b" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start a conversation with your accountant</Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/documents')}
              >
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
                  style={styles.actionGradient}
                >
                  <Ionicons name="cloud-upload" size={28} color="#3b82f6" />
                  <Text style={styles.actionText}>Upload Document</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => accountant && router.push({ pathname: '/chat/[id]', params: { id: accountant.id, name: accountant.name } })}
              >
                <LinearGradient
                  colors={['rgba(20, 184, 166, 0.1)', 'rgba(20, 184, 166, 0.05)']}
                  style={styles.actionGradient}
                >
                  <Ionicons name="create" size={28} color="#14b8a6" />
                  <Text style={styles.actionText}>New Message</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#64748b',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  accountantCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  accountantCardGradient: {
    padding: 20,
  },
  accountantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountantLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  onlineText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  accountantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountantInitials: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  accountantDetails: {
    marginLeft: 16,
    flex: 1,
  },
  accountantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  firmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  firmName: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '500',
  },
  accountantEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  messageAccountantBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageAccountantGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  messageAccountantText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '600',
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  messageIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  messagePreview: {
    fontSize: 13,
    color: '#64748b',
  },
  messageTime: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyMessages: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  actionsSection: {
    paddingHorizontal: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionGradient: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
  },
});
