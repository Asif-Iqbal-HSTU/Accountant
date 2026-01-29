import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { Editor, EditorProvider, Toolbar, BtnBold, BtnItalic, BtnUnderline, BtnStrikeThrough, BtnLink, BtnBulletList, BtnNumberedList, BtnClearFormatting, Separator } from 'react-simple-wysiwyg';
import { Paperclip, Mic, Square, Trash2, ArrowDown, Reply, Star, Check, CheckCheck, Search, X } from 'lucide-react';

axios.defaults.withCredentials = true;

export default function Dashboard({ clients = [] }: { clients?: any[] }) {
    const user = (usePage().props as any).auth.user;
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [replyTo, setReplyTo] = useState<any>(null);
    const [messageSearch, setMessageSearch] = useState('');
    const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
    const [clientsData, setClientsData] = useState<any[]>(clients);

    // Helper to strip HTML tags for plain text preview
    const stripHtml = (html: string | null) => {
        if (!html) return '';
        return html.replace(/<[^>]+>/g, '').trim();
    };

    // Poll for client list updates (for unread badges)
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const endpoint = user.role === 'accountant' ? '/api/clients' : '/api/accountants';
                const response = await axios.get(endpoint);
                setClientsData(response.data);
            } catch (error) {
                console.error(error);
            }
        };
        const interval = setInterval(fetchClients, 10000);
        return () => clearInterval(interval);
    }, [user.role]);

    const filteredClients = clientsData.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (selectedClient) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedClient]);

    const prevMessageCount = useRef(0);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);

    // Smart scroll: only scroll on new messages, not when browsing history
    useEffect(() => {
        if (messages.length > prevMessageCount.current) {
            // New message arrived
            scrollToBottom();
        }
        prevMessageCount.current = messages.length;
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowJumpToLatest(false);
    };

    const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
        // Show button if user scrolled more than 300px from bottom
        setShowJumpToLatest(distanceFromBottom > 300);
    };

    const fetchMessages = async () => {
        if (!selectedClient) return;
        try {
            const url = messageSearch ? `/api/messages/${selectedClient.id}?q=${messageSearch}` : `/api/messages/${selectedClient.id}`;
            const response = await axios.get(url);
            setMessages(response.data);

            // Mark unread messages as read
            const unreadIds = response.data
                .filter((m: any) => m.receiver_id === user.id && !m.read_at)
                .map((m: any) => m.id);

            if (unreadIds.length > 0) {
                // We could do bulk read, but for now loop or just call "read-all" if simple
                await axios.post(`/api/messages/read-all/${selectedClient.id}`);
            }

        } catch (error) {
            console.error(error);
        }
    };

    const toggleStar = async (msgId: number) => {
        try {
            await axios.post(`/api/messages/${msgId}/star`);
            // Optimistic update
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_starred: !m.is_starred } : m));
        } catch (error) {
            console.error(error);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
            setAudioBlob(null); // Clear audio if file selected
        }
    };

    const sendMessage = async (e: any) => {
        e.preventDefault();

        let type = 'text';
        if (audioBlob) type = 'audio';
        else if (attachment) type = 'file'; // or image, check mime later

        if (attachment && attachment.type.startsWith('image/')) type = 'image';

        const stripped = newMessage.replace(/<[^>]+>/g, '').trim();

        // Validation: Must have content OR attachment OR audio
        if (!stripped && !newMessage.includes('<img') && !attachment && !audioBlob) return;

        if (!selectedClient) return;

        const formData = new FormData();
        formData.append('receiver_id', selectedClient.id);
        formData.append('content', newMessage);
        formData.append('type', type);

        if (attachment) {
            formData.append('attachment', attachment);
        } else if (audioBlob) {
            formData.append('attachment', audioBlob, 'voice-message.webm');
        }

        if (replyTo) {
            formData.append('parent_id', replyTo.id);
        }

        try {
            await axios.post('/api/messages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewMessage('');
            setAttachment(null);
            setAudioBlob(null);
            setReplyTo(null);
            fetchMessages();
        } catch (error) {
            console.error(error);
        }
    };

    function onEditorChange(e: any) {
        setNewMessage(e.target.value);
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard().url }]}>
            <Head title="Dashboard" />
            <div className="flex h-[calc(100vh-65px)] p-4 gap-4">
                {/* Client List */}
                <div className="w-1/3 bg-white dark:bg-zinc-800 rounded-xl border border-sidebar-border/70 dark:border-sidebar-border shadow-sm p-4 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Clients</h2>

                    {user.role === 'accountant' && (
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 mb-4 border rounded-lg dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    )}

                    {user.role === 'client' ? (
                        <p>Search accountants on your mobile app.</p>
                    ) : (
                        <ul className="space-y-2">
                            {filteredClients.map(client => (
                                <li
                                    key={client.id}
                                    onClick={() => setSelectedClient(client)}
                                    className={`p-3 rounded cursor-pointer transition-colors ${selectedClient?.id === client.id ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-zinc-700/50'}`}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <div>
                                            <div className="font-bold">{client.name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{client.email}</div>
                                        </div>
                                        {client.unread_count > 0 && (
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                                                {client.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {clients.length === 0 && <p className="text-gray-500">No clients found.</p>}
                        </ul>
                    )}
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white dark:bg-zinc-800 rounded-xl border border-sidebar-border/70 dark:border-sidebar-border shadow-sm p-4 flex flex-col">
                    {selectedClient ? (
                        <>
                            <div className="border-b dark:border-zinc-700 pb-2 mb-4 flex justify-between items-center">
                                <h2 className="text-xl font-bold">Chat with {selectedClient.name}</h2>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search chat..."
                                        value={messageSearch}
                                        onChange={(e) => {
                                            setMessageSearch(e.target.value);
                                            // Trigger fetch immediately or debounced logic could go here
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && fetchMessages()}
                                        className="pl-8 pr-2 py-1 text-sm border rounded-full dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                                    />
                                    <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                            <div ref={messagesContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 relative">
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        id={`msg-${msg.id}`}
                                        className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'} transition-all duration-500 ${highlightedMessageId === msg.id ? 'scale-[1.02]' : ''}`}
                                    >
                                        <div className={`p-3 rounded-lg max-w-lg transition-colors duration-500 ${msg.sender_id === user.id ? (highlightedMessageId === msg.id ? 'bg-blue-600' : 'bg-blue-500') + ' text-white' : (highlightedMessageId === msg.id ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-zinc-700')}`}>
                                            {msg.parent && (
                                                <div
                                                    onClick={() => {
                                                        const parentEl = document.getElementById(`msg-${msg.parent.id}`);
                                                        if (parentEl) {
                                                            parentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            setHighlightedMessageId(msg.parent.id);
                                                            setTimeout(() => setHighlightedMessageId(null), 2000);
                                                        }
                                                    }}
                                                    className={`text-xs mb-2 p-1.5 rounded border-l-2 cursor-pointer hover:opacity-90 ${msg.sender_id === user.id ? 'bg-blue-600 border-blue-300 text-blue-100' : 'bg-gray-200 dark:bg-zinc-600 border-gray-400 text-gray-500 dark:text-gray-300'}`}
                                                >
                                                    <div className="font-bold flex items-center gap-1"><Reply className="h-3 w-3" /> Reply</div>
                                                    <div className="truncate opacity-75">{stripHtml(msg.parent.content)?.substring(0, 50) || 'Attachment'}</div>
                                                </div>
                                            )}
                                            {(msg.type === 'text' || !msg.type) && (
                                                <div
                                                    className="prose dark:prose-invert max-w-none text-sm rich-text-content"
                                                    dangerouslySetInnerHTML={{ __html: msg.content || '' }}
                                                />
                                            )}
                                            {msg.type === 'image' && (
                                                <div className="mb-2">
                                                    <img src={msg.attachment_path} alt="Attachment" className="max-w-full rounded-lg" />
                                                    {msg.content && <div dangerouslySetInnerHTML={{ __html: msg.content }} className="text-sm mt-1" />}
                                                </div>
                                            )}
                                            {msg.type === 'audio' && (
                                                <div className="flex items-center gap-2">
                                                    <audio controls src={msg.attachment_path} className="h-8 w-48" />
                                                </div>
                                            )}
                                            {msg.type === 'file' && (
                                                <a href={msg.attachment_path} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 underline break-all ${msg.sender_id === user.id ? 'text-blue-100' : 'text-blue-600'}`}>
                                                    <Paperclip className="h-4 w-4 shrink-0" />
                                                    {decodeURIComponent(msg.attachment_path.split('/').pop() || 'Download File')}
                                                </a>
                                            )}

                                            <div className="flex justify-between items-end mt-1">
                                                <span className={`text-[10px] ${msg.sender_id === user.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <button onClick={() => toggleStar(msg.id)} title={msg.is_starred ? "Unstar" : "Star"}>
                                                        <Star className={`h-3 w-3 ${msg.is_starred ? 'fill-yellow-400 text-yellow-400' : (msg.sender_id === user.id ? 'text-blue-200' : 'text-gray-400')}`} />
                                                    </button>
                                                    <button onClick={() => setReplyTo(msg)} title="Reply">
                                                        <Reply className={`h-3 w-3 ${msg.sender_id === user.id ? 'text-blue-200' : 'text-gray-400'}`} />
                                                    </button>
                                                    {msg.sender_id === user.id && (
                                                        <span>
                                                            {msg.read_at ? <CheckCheck className="h-3 w-3 text-blue-200" /> : <Check className="h-3 w-3 text-blue-200" />}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                                {showJumpToLatest && (
                                    <button
                                        onClick={scrollToBottom}
                                        className="sticky bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all"
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                        Jump to Latest
                                    </button>
                                )}
                            </div>

                            {/* Attachments Preview */}
                            {(attachment || audioBlob) && (
                                <div className="p-2 mb-2 bg-gray-100 dark:bg-zinc-900 rounded-lg flex items-center justify-between">
                                    <div className="text-sm">
                                        {attachment && <span>Attached: {attachment.name}</span>}
                                        {audioBlob && <span>Audio Recording Ready</span>}
                                    </div>
                                    <button onClick={() => { setAttachment(null); setAudioBlob(null); }} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                {replyTo && (
                                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-zinc-900 border-l-4 border-blue-500 rounded text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-blue-600">Replying to message</span>
                                            <span className="text-gray-500 truncate max-w-xs">{stripHtml(replyTo.content)?.substring(0, 50) || 'Attachment'}</span>
                                        </div>
                                        <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-red-500">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700 text-black dark:text-black">
                                    <EditorProvider>
                                        <Editor
                                            value={newMessage}
                                            onChange={onEditorChange}
                                            containerProps={{ style: { height: '160px', borderRadius: '0.5rem' } }}
                                        >
                                            <Toolbar>
                                                <BtnBold />
                                                <BtnItalic />
                                                <BtnUnderline />
                                                <BtnStrikeThrough />
                                                <Separator />
                                                <BtnLink />
                                                <Separator />
                                                <BtnBulletList />
                                                <BtnNumberedList />
                                                <BtnClearFormatting />
                                            </Toolbar>
                                        </Editor>
                                    </EditorProvider>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300"
                                            title="Attach File"
                                        >
                                            <Paperclip className="h-5 w-5" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-300'}`}
                                            title={isRecording ? "Stop Recording" : "Record Audio"}
                                        >
                                            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    <button
                                        onClick={sendMessage}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                            <style>{`
                                .rich-text-content p { margin: 0; }
                                .rich-text-content a { text-decoration: underline; color: inherit; }
                            `}</style>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Select a client to start chatting
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
