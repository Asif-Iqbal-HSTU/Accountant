import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
    TouchableOpacity,
    Image,
    Linking,
    Alert,
    Keyboard,
    ScrollView
} from 'react-native';

import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import RenderHtml from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import api from '../../services/api';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

// Defined types to avoid TS errors
type Message = {
    id: number;
    content: string | null;
    sender_id: number;
    created_at: string;
    type: 'text' | 'image' | 'file' | 'audio';
    attachment_path: string | null;
};

type ChatPartner = {
    id: number;
    name: string;
    email: string;
};

export default function ChatScreen() {
    const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
    const navigation = useNavigation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [messageContent, setMessageContent] = useState('');
    const { width } = useWindowDimensions();
    const flatListRef = useRef<FlatList>(null);
    const richText = useRef<RichEditor>(null);

    const [attachment, setAttachment] = useState<any>(null);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [chatPartnerName, setChatPartnerName] = useState<string>(name || 'Chat');
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Keyboard listeners
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    useEffect(() => {
        getCurrentUser();
        fetchMessages();
        fetchChatPartner();

        const interval = setInterval(fetchMessages, 5000);
        return () => {
            clearInterval(interval);
            if (sound) sound.unloadAsync();
        };
    }, [id]);

    // Set navigation title
    useEffect(() => {
        navigation.setOptions({
            headerTitle: chatPartnerName,
        });
    }, [chatPartnerName, navigation]);

    const getCurrentUser = async () => {
        const userStr = await SecureStore.getItemAsync('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
    };

    const fetchChatPartner = async () => {
        try {
            const response = await api.get(`/users/${id}`);
            if (response.data && response.data.name) {
                setChatPartnerName(response.data.name);
            }
        } catch (error) {
            console.log("Error fetching chat partner:", error);
            // Keep the default name or passed name
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/messages/${id}`);
            if (Array.isArray(response.data)) {
                setMessages(response.data);
            } else {
                console.error("Invalid response format:", response.data);
            }
        } catch (error) {
            console.log("Error fetching messages:", error);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({});
            if (!result.canceled) {
                setAttachment({
                    uri: result.assets[0].uri,
                    name: result.assets[0].name,
                    type: result.assets[0].mimeType || 'application/octet-stream',
                    category: 'file'
                });
            }
        } catch (err) {
            console.log("Unknown error: ", err);
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
            });
            if (!result.canceled) {
                const uri = result.assets[0].uri;
                const fileName = uri.split('/').pop() || 'image.jpg';
                const match = /\.(\w+)$/.exec(fileName);
                const type = match ? `image/${match[1]}` : `image`;

                setAttachment({
                    uri: uri,
                    name: fileName,
                    type: type,
                    category: 'image'
                });
            }
        } catch (err) {
            console.log("Error picking image: ", err);
        }
    };

    const startRecording = async () => {
        try {
            if (permissionResponse?.status !== 'granted') {
                await requestPermission();
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        setRecording(null);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (uri) {
            setAttachment({
                uri: uri,
                name: 'voice-message.m4a',
                type: 'audio/m4a',
                category: 'audio'
            });
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    };

    const playAudio = async (uri: string) => {
        try {
            if (sound) await sound.unloadAsync();
            const { sound: newSound } = await Audio.Sound.createAsync({ uri });
            setSound(newSound);
            await newSound.playAsync();
        } catch (error) {
            console.log("Error playing audio", error);
        }
    };

    const sendMessage = async () => {
        let type = 'text';
        if (attachment) {
            if (attachment.category === 'audio') type = 'audio';
            else if (attachment.category === 'image') type = 'image';
            else type = 'file';
        }

        const stripped = messageContent.trim();
        if (!stripped && !attachment) return;

        const formData = new FormData();
        formData.append('receiver_id', id as string);
        formData.append('content', messageContent);
        formData.append('type', type);

        if (attachment) {
            // @ts-ignore
            formData.append('attachment', {
                uri: attachment.uri,
                name: attachment.name,
                type: attachment.type,
            });
        }

        try {
            await api.post('/messages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setMessageContent('');
            setAttachment(null);
            fetchMessages();
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to send message");
        }
    };



    const renderMessageContent = (item: Message, isMyMessage: boolean) => {
        const textColor = isMyMessage ? '#fff' : '#333';
        const baseUrl = 'http://119.148.16.204:88';

        const getUrl = (path: string) => path.startsWith('http') ? path : `${baseUrl}${path}`;

        // Default to 'text' if type is undefined (for old messages)
        const messageType = item.type || 'text';

        const baseTagsStyles = {
            body: { color: isMyMessage ? '#fff' : '#333', fontSize: 15 },
            p: { margin: 0, padding: 0 },
            ul: { marginTop: 4, marginBottom: 4, paddingLeft: 20 },
            ol: { marginTop: 4, marginBottom: 4, paddingLeft: 20 },
            li: { marginBottom: 2 },
            b: { fontWeight: 'bold' as 'bold' }, // Cast to satisfy TS if needed, or just string
            strong: { fontWeight: 'bold' as 'bold' },
            i: { fontStyle: 'italic' as 'italic' },
            em: { fontStyle: 'italic' as 'italic' },
            u: { textDecorationLine: 'underline' as 'underline' },
        };

        if (messageType === 'text' || !item.attachment_path) {
            // Show content as text (includes old messages without type)
            return (
                <RenderHtml
                    contentWidth={width * 0.7}
                    source={{ html: item.content || '<p></p>' }}
                    tagsStyles={baseTagsStyles}
                    systemFonts={['System', 'Roboto', 'Arial']} // Ensure fonts are available
                />
            );
        } else if (item.type === 'image' && item.attachment_path) {
            return (
                <View>
                    <Image
                        source={{ uri: getUrl(item.attachment_path) }}
                        style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 5 }}
                        resizeMode="cover"
                    />
                    {item.content && (
                        <RenderHtml
                            contentWidth={width * 0.7}
                            source={{ html: item.content }}
                            tagsStyles={baseTagsStyles}
                            systemFonts={['System', 'Roboto', 'Arial']}
                        />
                    )}
                </View>
            );
        } else if (item.type === 'audio' && item.attachment_path) {
            return (
                <TouchableOpacity onPress={() => playAudio(getUrl(item.attachment_path!))} style={styles.audioButton}>
                    <Ionicons name="play-circle" size={32} color={textColor} />
                    <Text style={{ color: textColor, marginLeft: 8, fontWeight: '500' }}>Voice Message</Text>
                </TouchableOpacity>
            );
        } else if (item.type === 'file' && item.attachment_path) {
            return (
                <TouchableOpacity onPress={() => Linking.openURL(getUrl(item.attachment_path!))} style={styles.fileButton}>
                    <Ionicons name="document-attach" size={24} color={textColor} />
                    <Text style={{ color: textColor, marginLeft: 8, textDecorationLine: 'underline' }}>Download File</Text>
                </TouchableOpacity>
            );
        }
        return null;
    };

    const headerHeight = useHeaderHeight();

    useEffect(() => {
        if (messages.length > 0) {
            // For inverted list, offset 0 is the bottom (newest items)
            // If we wanted to force scroll to bottom on new message:
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
    }, [messages]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
        >
            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={[...messages].reverse()}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.messagesList}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                inverted
                renderItem={({ item }) => {
                    const isMyMessage = item.sender_id === currentUser?.id;

                    return (
                        <View style={[
                            styles.messageItem,
                            isMyMessage ? styles.myMessage : styles.otherMessage
                        ]}>
                            {renderMessageContent(item, isMyMessage)}
                            <Text style={[
                                styles.messageDate,
                                isMyMessage && { color: 'rgba(255,255,255,0.7)' }
                            ]}>
                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    );
                }}
            />

            {/* Input Section at BOTTOM */}
            <View style={[styles.inputSection, { paddingBottom: Platform.OS === 'ios' ? Math.max(8, keyboardHeight) : 8 }]}>
                {/* Attachment Preview */}
                {attachment && (
                    <View style={styles.previewContainer}>
                        <View style={styles.previewContent}>
                            <Ionicons
                                name={attachment.category === 'image' ? 'image' : attachment.category === 'audio' ? 'mic' : 'document'}
                                size={18}
                                color="#666"
                            />
                            <Text style={styles.previewText} numberOfLines={1}>
                                {attachment.name}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setAttachment(null)}>
                            <Ionicons name="close-circle" size={22} color="#999" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Formatting Toolbar */}
                <RichToolbar
                    editor={richText}
                    selectedIconTint="#007AFF"
                    iconTint="#666"
                    actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.setUnderline,
                        actions.insertLink,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                    ]}
                    iconMap={{
                        [actions.setBold]: ({ tintColor }: any) => <Text style={[styles.toolbarIcon, { color: tintColor }]}>B</Text>,
                        [actions.setItalic]: ({ tintColor }: any) => <Text style={[styles.toolbarIcon, { color: tintColor, fontStyle: 'italic' }]}>I</Text>,
                        [actions.setUnderline]: ({ tintColor }: any) => <Text style={[styles.toolbarIcon, { color: tintColor, textDecorationLine: 'underline' }]}>U</Text>,
                        [actions.insertLink]: ({ tintColor }: any) => <Ionicons name="link" size={20} color={tintColor} />,
                    }}
                    style={styles.toolbar}
                />

                {/* Main Input Row */}
                <View style={styles.inputRow}>
                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity onPress={pickImage} style={styles.actionBtn}>
                            <Ionicons name="image" size={22} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={pickDocument} style={styles.actionBtn}>
                            <Ionicons name="attach" size={22} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPressIn={startRecording}
                            onPressOut={stopRecording}
                            style={[styles.actionBtn, recording && styles.recordingActive]}
                        >
                            <Ionicons name="mic" size={22} color={recording ? "#FF3B30" : "#007AFF"} />
                        </TouchableOpacity>
                    </View>

                    {/* Rich Text Input */}
                    <View style={styles.editorContainer}>
                        <RichEditor
                            ref={richText}
                            onChange={setMessageContent}
                            placeholder="Type a message..."
                            initialHeight={45}
                            editorStyle={{
                                backgroundColor: '#F5F5F5',
                                contentCSSText: 'font-size: 15px; padding: 8px 12px; min-height: 45px;',
                                placeholderColor: '#999',
                            }}
                            style={styles.richEditor}
                        />
                    </View>

                    {/* Send Button */}
                    <TouchableOpacity
                        onPress={() => {
                            sendMessage();
                            richText.current?.setContentHTML('');
                        }}
                        style={[styles.sendButton, (!messageContent.trim() && !attachment) && styles.sendButtonDisabled]}
                        disabled={!messageContent.trim() && !attachment}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8E8ED'
    },
    inputSection: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    previewContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    previewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    previewText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    actionBtn: {
        padding: 6,
        marginRight: 4,
    },
    recordingActive: {
        backgroundColor: '#FFEBEE',
        borderRadius: 20,
    },
    toolbar: {
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        marginBottom: 8,
        height: 36,
    },
    toolbarIcon: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    editorContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        overflow: 'hidden',
        maxHeight: 100,
    },
    richEditor: {
        flex: 1,
        minHeight: 45,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: '#B0B0B0',
    },
    messagesList: {
        padding: 12,
        paddingBottom: 20,
    },
    messageItem: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginVertical: 4,
        borderRadius: 18,
        maxWidth: '80%',
    },
    myMessage: {
        backgroundColor: '#007AFF',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    otherMessage: {
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    messageDate: {
        fontSize: 11,
        color: '#888',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    audioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
});

