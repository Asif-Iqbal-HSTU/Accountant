import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  TextInput,
  Modal,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const WIZARD_CARDS = [
    {
      id: 'company-info',
      title: 'Company Info',
      subtitle: 'Company details',
      icon: 'business',
      colors: ['#3b82f6', '#2563eb'] as const,
      route: '/accounting/company-info',
    },
    {
      id: 'payroll',
      title: 'Payroll',
      subtitle: 'Hours & payslips',
      icon: 'people',
      colors: ['#14b8a6', '#0d9488'] as const,
      route: '/accounting/payroll',
    },
    {
      id: 'accounts',
      title: 'Accounts',
      subtitle: 'Yearly accounts',
      icon: 'calculator',
      colors: ['#8b5cf6', '#7c3aed'] as const,
      route: '/accounting/accounts',
    },
    {
      id: 'corporation-tax',
      title: 'Corporation Tax',
      subtitle: 'CT600 & liabilities',
      icon: 'document-text',
      colors: ['#f59e0b', '#d97706'] as const,
      route: '/accounting/corporation-tax',
    },
    {
      id: 'vat',
      title: 'VAT',
      subtitle: 'Quarterly returns',
      icon: 'receipt',
      colors: ['#ef4444', '#dc2626'] as const,
      route: '/accounting/vat',
    },
    {
      id: 'self-assessment',
      title: 'Self Assessment',
      subtitle: 'Tax returns',
      icon: 'person',
      colors: ['#06b6d4', '#0891b2'] as const,
      route: '/accounting/self-assessment',
    },
  ];

  useFocusEffect(
    useCallback(() => {
      checkSetup();
    }, [])
  );

  const checkSetup = async () => {
    const token = await SecureStore.getItemAsync('token');
    const userStr = await SecureStore.getItemAsync('user');

    if (!token) {
      router.replace('/login');
      return;
    }

    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch fresh user data to get updated services
      const userRes = await api.get('/user');
      setUser(userRes.data);
      await SecureStore.setItemAsync('user', JSON.stringify(userRes.data));

      // Fetch accountants (should be 1 for bound client)
      const accResponse = await api.get('/accountants');
      if (accResponse.data.length > 0) {
        setAccountant(accResponse.data[0]);

        // Stats only for messages now
        setStats(prev => ({
          ...prev,
          unreadMessages: accResponse.data[0].unread_count || 0,
        }));

        // Fetch recent messages
        const msgResponse = await api.get(`/messages/${accResponse.data[0].id}`);
        setRecentMessages(msgResponse.data.slice(-3).reverse());
      }
    } catch (error: any) {
      console.log(error);
      if (error.response?.status === 401) {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        router.replace('/login');
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
      console.log(e);
    }
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    router.replace('/login');
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await api.delete('/account', {
        data: { password: deletePassword },
      });

      // Success — clear local data and redirect
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      setShowDeleteModal(false);
      setDeletePassword('');
      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      if (error.response?.status === 422) {
        setDeleteError(error.response.data.errors?.password?.[0] || 'Incorrect password');
      } else {
        setDeleteError('Something went wrong. Please try again.');
      }
    } finally {
      setDeleteLoading(false);
    }
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

          {/* Accounting Services */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Accounting Services</Text>
            <View style={styles.statsGrid}>
              {WIZARD_CARDS.map((card) => {
                const isActive = card.id === 'company-info' || (user?.services_config?.[card.id.replace(/-/g, '_')] === true);
                if (!isActive) return null;

                return (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.statCard}
                    onPress={() => router.push(card.route as any)}
                  >
                    <LinearGradient
                      colors={[card.colors[0] + '20', card.colors[1] + '10']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.statIcon, { backgroundColor: card.colors[0] }]}>
                      <Ionicons name={card.icon as any} size={24} color="#fff" />
                    </View>
                    <Text style={[styles.statValue, { fontSize: 16 }]}>{card.title}</Text>
                    <Text style={styles.statLabel}>{card.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
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
                onPress={() => accountant && router.push({ pathname: '/chat/[id]', params: { id: accountant.id, name: accountant.name } })}
              >
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
                  style={styles.actionGradient}
                >
                  <Ionicons name="chatbubbles" size={28} color="#3b82f6" />
                  <Text style={styles.actionText}>Message Accountant</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/messages')}
              >
                <LinearGradient
                  colors={['rgba(20, 184, 166, 0.1)', 'rgba(20, 184, 166, 0.05)']}
                  style={styles.actionGradient}
                >
                  <Ionicons name="mail-unread" size={28} color="#14b8a6" />
                  <Text style={styles.actionText}>View Messages</Text>
                  {stats.unreadMessages > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{stats.unreadMessages}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delete Account */}
          <View style={styles.deleteSection}>
            <View style={styles.deleteSectionHeader}>
              <Ionicons name="warning-outline" size={18} color="#ef4444" />
              <Text style={styles.deleteSectionTitle}>Danger Zone</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteAccountBtn}
              onPress={() => {
                setDeletePassword('');
                setDeleteError('');
                setShowDeleteModal(true);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.deleteAccountText}>Delete My Account</Text>
              <Ionicons name="chevron-forward" size={16} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.deleteNote}>
              Permanently delete your account and all associated data
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Delete Account Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="warning" size={32} color="#ef4444" />
              </View>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.modalDescription}>
                This will permanently delete your account and all data including messages, documents, and accounting records. This action cannot be undone.
              </Text>

              <Text style={styles.modalLabel}>Enter your password to confirm:</Text>
              <TextInput
                style={styles.modalInput}
                secureTextEntry
                placeholder="Your password"
                placeholderTextColor="#64748b"
                value={deletePassword}
                onChangeText={setDeletePassword}
                autoCapitalize="none"
              />

              {deleteError ? (
                <Text style={styles.modalError}>{deleteError}</Text>
              ) : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalDeleteBtn, deleteLoading && { opacity: 0.6 }]}
                  onPress={deleteAccount}
                  disabled={deleteLoading}
                >
                  <Text style={styles.modalDeleteText}>
                    {deleteLoading ? 'Deleting...' : 'Delete Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  deleteSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  deleteSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    gap: 12,
  },
  deleteAccountText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteNote: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 14,
    marginBottom: 12,
  },
  modalError: {
    color: '#fca5a5',
    fontSize: 13,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
