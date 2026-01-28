import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const response = await api.post('/login', { email, password });
            await SecureStore.setItemAsync('token', response.data.access_token);
            await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
            router.replace('/(tabs)');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Login failed');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Client Login</Text>
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
            <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
            <Button title="Login" onPress={handleLogin} />
            <TouchableOpacity onPress={() => router.push('/register')} style={{ marginTop: 20 }}>
                <Text style={{ color: 'blue', textAlign: 'center' }}>Don't have an account? Register</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
});
