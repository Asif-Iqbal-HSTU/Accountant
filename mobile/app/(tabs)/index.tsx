import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import api from '../../services/api';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [accountants, setAccountants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      router.replace('/login');
    } else {
      fetchAccountants();
    }
  };

  const fetchAccountants = async () => {
    try {
      const response = await api.get('/accountants');
      setAccountants(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    router.replace('/login');
  }

  const [searchQuery, setSearchQuery] = useState('');

  const filteredAccountants = accountants.filter(acc =>
    acc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Accountants</Text>
        <Button title="Logout" onPress={logout} />
      </View>

      <TextInput
        placeholder="Search accountants..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      <FlatList
        data={filteredAccountants}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.email}</Text>
            <Button title="Message" onPress={() => router.push(`/chat/${item.id}`)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 20 },
  item: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  name: { fontSize: 18, fontWeight: 'bold' },
});
