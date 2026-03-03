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
    ScrollView,
    TextInput
} from 'react-native';

import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import RenderHtml from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import api, { API_URL } from '../../services/api';
import { RichEditor, RichToolbar, actions } from '../../components/ui/RichText';

// Defined types to avoid TS errors
type Message = {
    id: number;
    content: string | null;
    sender_id: number;
    receiver_id: number;
    created_at: string;
    type: 'text' | 'image' | 'file' | 'audio';
    attachment_path: string | null;
    is_starred?: boolean;
    read_at?: string | null;
    parent_id?: number | null;
    parent?: Message | null;
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
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Helper to strip HTML tags for plain text preview
    const stripHtml = (html: string | null) => {
        if (!html) return '';
        return html.replace(/<[^>]+>/g, '').trim();
    };

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

    // Set navigation title and Search
    useEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>{chatPartnerName}</Text>
                    {partnerTyping ? (
                        <Text style={{ fontSize: 11, color: '#4ADE80', fontWeight: '500' }}>typing...</Text>
                    ) : (
                        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '400' }}>Online</Text>
                    )}
                </View>
            ),
            headerStyle: {
                backgroundColor: '#0F172A', // Dark Slate matching dashboard
            },
            headerTintColor: '#FFFFFF',
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 8 }}>
                    <TouchableOpacity onPress={() => setIsSearching(!isSearching)}>
                        <Ionicons name={isSearching ? "close" : "search-outline"} size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowDateFilter(!showDateFilter)}>
                        <Ionicons name="calendar-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [chatPartnerName, navigation, isSearching, showDateFilter, partnerTyping]);

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
            let url = `/messages/${id}`;
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);
            if (params.toString()) url += '?' + params.toString();

            const response = await api.get(url);
            if (Array.isArray(response.data)) {
                setMessages(response.data);

                const unreadIds = response.data
                    .filter((m: any) => m.receiver_id === currentUser?.id && !m.read_at)
                    .map((m: any) => m.id);

                if (unreadIds.length > 0) {
                    await api.post(`/messages/read-all/${id}`);
                }

            } else {
                console.error("Invalid response format:", response.data);
            }
        } catch (error) {
            console.log("Error fetching messages:", error);
        }
    };

    // Typing indicator functions
    const sendTypingStatus = async () => {
        try {
            await api.post(`/messages/typing/${id}`);
        } catch (error) {
            console.log("Error sending typing status:", error);
        }
    };

    const pollTypingStatus = async () => {
        try {
            const response = await api.get(`/messages/typing/${id}`);
            setPartnerTyping(response.data.is_typing);
        } catch (error) {
            console.log("Error polling typing status:", error);
        }
    };

    // Poll for typing status
    useEffect(() => {
        const interval = setInterval(pollTypingStatus, 2000);
        return () => clearInterval(interval);
    }, [id]);

    // Archive conversation
    const archiveConversation = async () => {
        Alert.alert(
            'Archive Conversation',
            'Are you sure you want to archive this conversation? It will be hidden from both users.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Archive',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/messages/archive/${id}`);
                            Alert.alert('Success', 'Conversation archived.');
                            navigation.goBack();
                        } catch (error) {
                            console.log("Error archiving:", error);
                            Alert.alert('Error', 'Failed to archive conversation.');
                        }
                    }
                }
            ]
        );
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

    const [playbackStatus, setPlaybackStatus] = useState<{ [key: number]: any }>({});

    const playAudio = async (id: number, uri: string) => {
        try {
            if (sound) {
                const status = await sound.getStatusAsync();
                // @ts-ignore
                if (status.isLoaded && status.uri === uri) {
                    // @ts-ignore
                    if (status.isPlaying) {
                        await sound.pauseAsync();
                        return;
                    } else {
                        await sound.playAsync();
                        return;
                    }
                }
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true },
                (status) => {
                    if (status.isLoaded) {
                        setPlaybackStatus(prev => ({
                            ...prev,
                            [id]: {
                                position: status.positionMillis,
                                duration: status.durationMillis,
                                isPlaying: status.isPlaying,
                                isFinished: status.didJustFinish
                            }
                        }));
                    }
                }
            );
            setSound(newSound);
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

        if (replyTo) {
            formData.append('parent_id', replyTo.id.toString());
        }

        try {
            await api.post('/messages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setMessageContent('');
            setAttachment(null);
            setReplyTo(null);
            fetchMessages();
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to send message");
        }
    };



    const renderMessageContent = (item: Message, isMyMessage: boolean) => {
        const textColor = isMyMessage ? '#FFFFFF' : '#F1F5F9';
        const baseUrl = API_URL.replace('/api', '');

        const getUrl = (path: string) => {
            if (!path) return '';
            return path.startsWith('http') ? path : `${baseUrl}${path}`;
        };

        // Default to 'text' if type is undefined (for old messages)
        const messageType = item.type || 'text';

        const baseTagsStyles = {
            body: { color: isMyMessage ? '#FFFFFF' : '#F1F5F9', fontSize: 16 },
            p: { margin: 0, padding: 0 },
            ul: { marginTop: 4, marginBottom: 4, paddingLeft: 20, color: isMyMessage ? '#FFFFFF' : '#F1F5F9' },
            ol: { marginTop: 4, marginBottom: 4, paddingLeft: 20, color: isMyMessage ? '#FFFFFF' : '#F1F5F9' },
            li: { marginBottom: 2, color: isMyMessage ? '#FFFFFF' : '#F1F5F9' },
            b: { fontWeight: 'bold' as 'bold', color: isMyMessage ? '#FFFFFF' : '#F1F5F9' },
            strong: { fontWeight: 'bold' as 'bold', color: isMyMessage ? '#FFFFFF' : '#F1F5F9' },
            i: { fontStyle: 'italic' as 'italic', color: isMyMessage ? '#FFFFFF' : '#F1F5F9' },
            em: { fontStyle: 'italic' as 'italic', color: isMyMessage ? '#FFFFFF' : '#F1F5F9' },
            u: { textDecorationLine: 'underline' as 'underline', color: isMyMessage ? '#FFFFFF' : '#F1F5F9' },
        };

        // Fallback for valid content width
        const contentWidth = (width * 0.7) > 0 ? (width * 0.7) : 200;

        try {
            if (messageType === 'text' || !item.attachment_path) {
                // Show content as text (includes old messages without type)
                const safeHtml = String(item.content || '').trim() || '<p></p>';
                return (
                    <RenderHtml
                        contentWidth={contentWidth}
                        source={{ html: safeHtml }}
                        tagsStyles={baseTagsStyles}
                        systemFonts={['System', 'Roboto', 'Arial', 'sans-serif']}
                        defaultTextProps={{ selectable: true }}
                    />
                );
            } else if (item.type === 'image' && item.attachment_path) {
                return (
                    <View>
                        <Image
                            source={{ uri: getUrl(item.attachment_path) }}
                            style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 5, backgroundColor: '#eee' }}
                            resizeMode="cover"
                        />
                        {item.content ? (
                            <RenderHtml
                                contentWidth={contentWidth}
                                source={{ html: String(item.content) }}
                                tagsStyles={baseTagsStyles}
                                systemFonts={['System', 'Roboto', 'Arial', 'sans-serif']}
                            />
                        ) : null}
                    </View>
                );
            } else if (item.type === 'audio' && item.attachment_path) {
                const status = playbackStatus[item.id] || { position: 0, duration: 1, isPlaying: false };
                const progress = status.position / status.duration;
                
                return (
                    <View style={styles.voicePlayerCard}>
                        <TouchableOpacity 
                            onPress={() => playAudio(item.id, getUrl(item.attachment_path!))}
                            style={styles.playButton}
                        >
                            <Ionicons 
                                name={status.isPlaying ? "pause" : "play"} 
                                size={24} 
                                color={textColor} 
                            />
                        </TouchableOpacity>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressIndicator, { width: `${progress * 100}%`, backgroundColor: textColor }]} />
                            </View>
                            <Text style={[styles.durationText, { color: isMyMessage ? 'rgba(255,255,255,0.7)' : 'rgba(241, 245, 249, 0.7)' }]}>
                                {status.isPlaying || status.position > 0 ? 
                                    `${Math.floor(status.position / 1000 / 60)}:${String(Math.floor((status.position / 1000) % 60)).padStart(2, '0')}` : 
                                    'Voice Message'}
                            </Text>
                        </View>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="mic" size={16} color={textColor} />
                        </View>
                    </View>
                );
            } else if (item.type === 'file' && item.attachment_path) {
                return (
                    <TouchableOpacity onPress={() => Linking.openURL(getUrl(item.attachment_path!))} style={styles.fileButton}>
                        <Ionicons name="document-attach" size={24} color={textColor} />
                        <Text style={{ color: textColor, marginLeft: 8, textDecorationLine: 'underline' }}>
                            {decodeURIComponent(item.attachment_path!.split('/').pop() || 'Download File')}
                        </Text>
                    </TouchableOpacity>
                );
            }
        } catch (e) {
            console.error('Render error:', e);
            return <Text style={{ color: 'red', fontSize: 10 }}>Error rendering message</Text>;
        }
        return null;
    };

    const headerHeight = useHeaderHeight();
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);
    const prevMessageCount = useRef(0);

    // Safely format time
    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    // Smart scroll: only scroll to bottom on new messages, not when browsing history
    useEffect(() => {
        if (messages.length > prevMessageCount.current) {
            // New message arrived
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
        prevMessageCount.current = messages.length;
    }, [messages]);

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        // For inverted list, offsetY > threshold means user scrolled up (viewing old messages)
        setShowJumpToLatest(offsetY > 200);
    };

    const jumpToLatest = () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setShowJumpToLatest(false);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                style={StyleSheet.absoluteFill}
            />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
            >
            {isSearching && (
                <View style={{ padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
                    <View style={{ backgroundColor: '#f0f0f0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="search" size={20} color="#999" />
                        <TextInput
                            style={{ flex: 1, marginLeft: 10, fontSize: 16, color: '#333' }}
                            placeholder="Search messages..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                            }}
                            onSubmitEditing={() => fetchMessages()}
                            returnKeyType="search"
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchMessages(); }}>
                                <Ionicons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
            {/* Date Filter UI */}
            {showDateFilter && (
                <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="calendar" size={18} color="#666" />
                        <TextInput
                            style={{ flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' }}
                            placeholder="From (YYYY-MM-DD)"
                            placeholderTextColor="#999"
                            value={dateFrom}
                            onChangeText={setDateFrom}
                        />
                        <Text style={{ color: '#666' }}>to</Text>
                        <TextInput
                            style={{ flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' }}
                            placeholder="To (YYYY-MM-DD)"
                            placeholderTextColor="#999"
                            value={dateTo}
                            onChangeText={setDateTo}
                        />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        {(dateFrom || dateTo) && (
                            <TouchableOpacity
                                onPress={() => { setDateFrom(''); setDateTo(''); fetchMessages(); }}
                                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#eee' }}
                            >
                                <Text style={{ color: '#666' }}>Clear</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={fetchMessages}
                            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#007AFF' }}
                        >
                            <Text style={{ color: '#fff', fontWeight: '600' }}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            {/* Messages List */}
            <View style={{ flex: 1 }}>
                <FlatList
                    ref={flatListRef}
                    data={[...messages].reverse()}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.messagesList}
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    inverted
                    onScroll={handleScroll}
                    scrollEventThrottle={100}
                    renderItem={({ item }) => {
                        const isMyMessage = item.sender_id === currentUser?.id;

                        return (
                            <TouchableOpacity
                                onLongPress={() => {
                                    Alert.alert(
                                        'Message Options',
                                        'Choose an action',
                                        [
                                            { text: 'Reply', onPress: () => setReplyTo(item) },
                                            {
                                                text: item.is_starred ? 'Unstar' : 'Star',
                                                onPress: async () => {
                                                    await api.post(`/messages/${item.id}/star`);
                                                    setMessages(prev => prev.map(m => m.id === item.id ? { ...m, is_starred: !m.is_starred } : m));
                                                }
                                            },
                                            { text: 'Cancel', style: 'cancel' }
                                        ]
                                    );
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={[
                                    styles.messageItem,
                                    isMyMessage ? styles.myMessage : styles.otherMessage,
                                    (highlightedMessageId === item.id) && { backgroundColor: isMyMessage ? '#0066CC' : '#FFFACD' }
                                ]}>
                                    {item.parent && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                const reversedData = [...messages].reverse();
                                                const parentIndex = reversedData.findIndex(m => m.id === item.parent_id);
                                                if (parentIndex !== -1) {
                                                    flatListRef.current?.scrollToIndex({ index: parentIndex, animated: true });
                                                    setHighlightedMessageId(item.parent_id!);
                                                    setTimeout(() => setHighlightedMessageId(null), 2000);
                                                }
                                            }}
                                            style={{ borderLeftWidth: 3, borderLeftColor: isMyMessage ? '#fff' : '#007AFF', paddingLeft: 8, marginBottom: 6, opacity: 0.85 }}
                                        >
                                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: isMyMessage ? '#fff' : '#333' }}>Replying to</Text>
                                            <Text numberOfLines={1} style={{ fontSize: 13, color: isMyMessage ? '#fff' : '#555' }}>
                                                {stripHtml(item.parent.content) || 'Attachment'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {renderMessageContent(item, isMyMessage)}

                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                                        {item.is_starred && <Ionicons name="star" size={12} color="#FFD700" style={{ marginRight: 4 }} />}
                                        <Text style={[
                                            styles.messageDate,
                                            isMyMessage && { color: 'rgba(255,255,255,0.7)' }
                                        ]}>
                                            {formatTime(item.created_at)}
                                        </Text>
                                        {isMyMessage && (
                                            <Ionicons
                                                name={item.read_at ? "checkmark-done" : "checkmark"}
                                                size={16}
                                                color={item.read_at ? "#81b0ff" : "rgba(255,255,255,0.7)"}
                                                style={{ marginLeft: 4 }}
                                            />
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
                {showJumpToLatest && (
                    <TouchableOpacity
                        onPress={jumpToLatest}
                        style={{
                            position: 'absolute',
                            bottom: 20,
                            alignSelf: 'center',
                            backgroundColor: '#007AFF',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 4,
                            elevation: 5,
                        }}
                    >
                        <Ionicons name="arrow-down" size={16} color="#fff" />
                        <Text style={{ color: '#fff', marginLeft: 6, fontWeight: '600' }}>Jump to Latest</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Input Section at BOTTOM */}
            <View style={styles.inputArea}>
                {replyTo && (
                    <View style={styles.replyBubblePreview}>
                        <View style={styles.replyIndicator} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.replyName}>Replying to...</Text>
                            <Text numberOfLines={1} style={styles.replyTextPreview}>{stripHtml(replyTo.content)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyTo(null)}>
                            <Ionicons name="close-circle" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Rich Text Toolbar */}
                <RichToolbar
                    editor={richText}
                    selectedIconTint="#3b82f6"
                    iconTint="#94a3b8"
                    style={styles.richToolbar}
                    actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.setStrikethrough,
                        actions.setUnderline,
                        actions.undo,
                        actions.redo,
                    ]}
                />
                
                <View style={styles.mainInputRow}>
                    <TouchableOpacity onPress={pickImage} style={styles.inputActionBtn}>
                        <Ionicons name="add" size={28} color="#3b82f6" />
                    </TouchableOpacity>
                    
                    <View style={styles.textInputWrapper}>
                        <RichEditor
                            ref={richText}
                            onChange={(text) => {
                                setMessageContent(text);
                                sendTypingStatus();
                            }}
                            placeholder="Type a message..."
                            initialHeight={40}
                            editorStyle={{
                                backgroundColor: 'transparent',
                                contentCSSText: 'font-size: 16px; color: #fff; min-height: 40px;',
                                placeholderColor: '#64748b',
                            }}
                            style={{ backgroundColor: 'transparent' }}
                        />
                    </View>

                    {messageContent.trim() || attachment ? (
                        <TouchableOpacity onPress={() => { sendMessage(); richText.current?.setContentHTML(''); }} style={styles.sendCircle}>
                            <Ionicons name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            onLongPress={startRecording}
                            onPressOut={stopRecording}
                            style={[styles.sendCircle, recording ? { backgroundColor: '#ef4444' } : {}]}
                        >
                            <Ionicons name={recording ? "mic" : "mic-outline"} size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    </View>
);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    messagesList: {
        paddingHorizontal: 12,
        paddingBottom: 20,
        paddingTop: 10,
    },
    messageItem: {
        marginBottom: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        maxWidth: '85%',
        elevation: 1,
    },
    myMessage: {
        backgroundColor: '#3b82f6', // App Theme Blue
        alignSelf: 'flex-end',
        borderTopRightRadius: 4,
    },
    otherMessage: {
        backgroundColor: 'rgba(255,255,255,0.08)', // Dark Semi-transparent
        alignSelf: 'flex-start',
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    messageDate: {
        fontSize: 10,
        color: '#94a3b8',
        marginLeft: 8,
    },
    voicePlayerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        minWidth: 220,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    progressContainer: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    progressBar: {
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 1,
        width: '100%',
        overflow: 'hidden',
    },
    progressIndicator: {
        height: '100%',
    },
    durationText: {
        fontSize: 10,
        marginTop: 4,
    },
    avatarContainer: {
        padding: 5,
    },
    inputArea: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    richToolbar: {
        backgroundColor: 'transparent',
        height: 40,
        marginBottom: 4,
    },
    mainInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    textInputWrapper: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        paddingHorizontal: 4,
        paddingVertical: 2,
        minHeight: 45,
        maxHeight: 150,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputActionBtn: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    replyBubblePreview: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 8,
        borderRadius: 12,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    replyIndicator: {
        width: 3,
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 2,
        marginRight: 10,
    },
    replyName: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#3b82f6',
    },
    replyTextPreview: {
        fontSize: 12,
        color: '#94a3b8',
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
    },
});

