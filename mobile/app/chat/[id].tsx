import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import api from '../../services/api';
import * as SecureStore from 'expo-secure-store';

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        getCurrentUser();
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [id]);

    const getCurrentUser = async () => {
        const userStr = await SecureStore.getItemAsync('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
    }

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/messages/${id}`);
            setMessages(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage) return;
        try {
            await api.post('/messages', {
                receiver_id: id,
                content: newMessage
            });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={[
                        styles.messageItem,
                        item.sender_id === currentUser?.id ? styles.myMessage : styles.otherMessage
                    ]}>
                        <Text style={styles.messageText}>{item.content}</Text>
                        <Text style={styles.messageDate}>{new Date(item.created_at).toLocaleTimeString()}</Text>
                    </View>
                )}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                />
                <Button title="Send" onPress={sendMessage} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    messageItem: { padding: 10, marginVertical: 5, borderRadius: 5, maxWidth: '80%' },
    myMessage: { backgroundColor: '#dcf8c6', alignSelf: 'flex-end' },
    otherMessage: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start' },
    messageText: { fontSize: 16 },
    messageDate: { fontSize: 10, color: 'gray', marginTop: 5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginRight: 10 }
});
