import { Head, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { useRef, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Editor, EditorProvider, Toolbar, BtnBold, BtnItalic, BtnUnderline, BtnStrikeThrough, BtnLink, BtnBulletList, BtnNumberedList, BtnClearFormatting, Separator } from 'react-simple-wysiwyg';
import { Paperclip, Mic, Square, Trash2, ArrowDown, Reply, Star, Check, CheckCheck, Search, X, Archive, Calendar, Filter, Send, MessageSquare, Users, Building2, Plus, Edit, PoundSterling, Calculator, FileText, Receipt, User, Settings, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import CompanyInfoForm from '@/components/accounting/company-info-form';

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
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);

    // New state for Company Info Modal
    const [editingCompanyInfoClientId, setEditingCompanyInfoClientId] = useState<number | null>(null);
    const [viewingChatClientId, setViewingChatClientId] = useState<number | null>(null);

    // If viewing chat, set selected client to that ID
    useEffect(() => {
        if (viewingChatClientId) {
            const client = clientsData.find(c => c.id === viewingChatClientId);
            if (client) setSelectedClient(client);
        } else {
            setSelectedClient(null);
        }
    }, [viewingChatClientId, clientsData]);

    // Helper to strip HTML tags for plain text preview
    const stripHtml = (html: string | null) => {
        if (!html) return '';
        return html.replace(/<[^>]+>/g, '').trim();
    };

    // Get initials from name
    const getInitials = (name: string) => {
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Get avatar gradient colors
    const getAvatarClasses = (name: string) => {
        const gradients = [
            'from-blue-500 to-teal-400',
            'from-purple-500 to-pink-400',
            'from-amber-500 to-red-400',
            'from-emerald-500 to-cyan-400',
            'from-indigo-500 to-purple-400',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return gradients[Math.abs(hash) % gradients.length];
    };

    // Poll for client list updates (for unread badges)
    const fetchClients = useCallback(async () => {
        try {
            const endpoint = user.role === 'accountant' ? '/api/clients' : '/api/accountants';
            const response = await axios.get(endpoint);
            setClientsData(response.data);
        } catch (error) {
            console.error(error);
        }
    }, [user.role]);

    useEffect(() => {
        fetchClients();
        const interval = setInterval(fetchClients, 10000);
        return () => clearInterval(interval);
    }, [fetchClients]);

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

    // Smart scroll: only scroll on new messages, not when browsing history
    useEffect(() => {
        if (messages.length > prevMessageCount.current) {
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
        setShowJumpToLatest(distanceFromBottom > 300);
    };

    const fetchMessages = async () => {
        if (!selectedClient) return;
        try {
            let url = `/api/messages/${selectedClient.id}`;
            const params = new URLSearchParams();
            if (messageSearch) params.append('q', messageSearch);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);
            if (params.toString()) url += '?' + params.toString();

            const response = await axios.get(url);
            setMessages(response.data);

            const unreadIds = response.data
                .filter((m: any) => m.receiver_id === user.id && !m.read_at)
                .map((m: any) => m.id);

            if (unreadIds.length > 0) {
                await axios.post(`/api/messages/read-all/${selectedClient.id}`);
            }

        } catch (error) {
            console.error(error);
        }
    };

    // Typing indicator functions
    const sendTypingStatus = async () => {
        if (!selectedClient) return;
        try {
            await axios.post(`/api/messages/typing/${selectedClient.id}`);
        } catch (error) {
            console.error(error);
        }
    };

    const pollTypingStatus = async () => {
        if (!selectedClient) return;
        try {
            const response = await axios.get(`/api/messages/typing/${selectedClient.id}`);
            setPartnerTyping(response.data.is_typing);
        } catch (error) {
            console.error(error);
        }
    };

    // Poll for typing status
    useEffect(() => {
        if (selectedClient) {
            const interval = setInterval(pollTypingStatus, 2000);
            return () => clearInterval(interval);
        }
    }, [selectedClient]);

    // Archive conversation
    const archiveConversation = async () => {
        if (!selectedClient) return;
        if (!confirm('Are you sure you want to archive this conversation? It will be hidden from both users.')) return;
        try {
            await axios.post(`/api/messages/archive/${selectedClient.id}`);
            setMessages([]);
            setSelectedClient(null);
            alert('Conversation archived successfully.');
        } catch (error) {
            console.error(error);
            alert('Failed to archive conversation.');
        }
    };

    // Handler for editor changes - triggers typing indicator
    const onEditorChange = (e: any) => {
        setNewMessage(e.target.value);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        sendTypingStatus();
        typingTimeoutRef.current = setTimeout(() => { }, 3000);
    };

    const toggleStar = async (msgId: number) => {
        try {
            await axios.post(`/api/messages/${msgId}/star`);
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
            setAudioBlob(null);
        }
    };

    const sendMessage = async (e: any) => {
        e.preventDefault();

        let type = 'text';
        if (audioBlob) type = 'audio';
        else if (attachment) type = 'file';

        if (attachment && attachment.type.startsWith('image/')) type = 'image';

        const stripped = newMessage.replace(/<[^>]+>/g, '').trim();

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


    if (user.role === 'accountant' && !viewingChatClientId) {
        return (
            <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard().url }]}>
                <Head title="Dashboard" />
                <div className="p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clients</h1>
                            <p className="text-slate-500">Manage your clients and their company information</p>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredClients.map(client => (
                            <div key={client.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-6 flex items-start justify-between border-b border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarClasses(client.name)} flex items-center justify-center font-bold text-white text-lg shadow-lg`}>
                                            {getInitials(client.name)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{client.name}</h3>
                                            <p className="text-sm text-slate-500">{client.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Header content removed, moving to message button */}
                                    </div>
                                </div>

                                <div className="p-6 flex-1">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Building2 className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium">Company Info:</span>
                                        </div>

                                        {/* We need to fetch company info for each client or have it included. 
                                            Assuming for now we might load it on demand or check if it exists if provided in prop.
                                            Ideally 'clients' prop should include 'company_info'. 
                                        */}
                                        {client.company_info ? (
                                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-2 border border-slate-100 dark:border-slate-700">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-500">Company Name/Number</span>
                                                    <span className="text-xs font-medium text-slate-900 dark:text-white">{client.company_info.company_number || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-500">VAT Reg</span>
                                                    <span className="text-xs font-medium text-slate-900 dark:text-white">{client.company_info.vat_registration || 'N/A'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-center border border-dashed border-slate-300 dark:border-slate-600">
                                                <p className="text-sm text-slate-500 mb-2">No company info added</p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Dialog open={editingCompanyInfoClientId === client.id} onOpenChange={(open) => setEditingCompanyInfoClientId(open ? client.id : null)}>
                                                <DialogTrigger asChild>
                                                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors">
                                                        {client.company_info ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                        {client.company_info ? 'Edit Info' : 'Add Info'}
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[600px]">
                                                    <DialogHeader>
                                                        <DialogTitle>Company Information - {client.name}</DialogTitle>
                                                        <DialogDescription>
                                                            Update company registration details for this client.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <CompanyInfoForm
                                                        userId={client.id}
                                                        initialData={client.company_info} // Pass existing data if any
                                                        onSuccess={() => {
                                                            setEditingCompanyInfoClientId(null);
                                                            fetchClients();
                                                        }}
                                                    />
                                                </DialogContent>
                                            </Dialog>

                                            <button
                                                onClick={() => setViewingChatClientId(client.id)}
                                                className="relative flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                Message
                                                {client.unread_count > 0 && (
                                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
                                                        {client.unread_count}
                                                    </span>
                                                )}
                                            </button>
                                        </div>

                                        <div className="pt-2 grid grid-cols-1 gap-3">
                                            {[
                                                { id: 'payroll', label: 'Payroll', href: `/clients/${client.id}/accounting/payroll`, icon: PoundSterling, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
                                                { id: 'accounts', label: 'Accounts', href: `/clients/${client.id}/accounting/accounts`, icon: Calculator, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                                                { id: 'corporation_tax', label: 'Corp Tax', href: `/clients/${client.id}/accounting/corporation-tax`, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                                                { id: 'vat', label: 'VAT', href: `/clients/${client.id}/accounting/vat`, icon: Receipt, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                                                { id: 'self_assessment', label: 'Self Assessment', href: `/clients/${client.id}/accounting/self-assessment`, icon: User, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20' },
                                            ].map((svc) => (
                                                <div key={svc.id} className="flex items-center gap-2 group/row">
                                                    <Link
                                                        href={svc.href}
                                                        className={`flex-1 flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all ${client.services_config?.[svc.id] === false
                                                            ? 'bg-slate-50 dark:bg-slate-800/50 grayscale opacity-75'
                                                            : 'bg-white dark:bg-slate-800 shadow-sm'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${svc.bg} ${svc.color}`}>
                                                                <svc.icon className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                                                    {svc.label}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                                                    Manage Data
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {client.services_config?.[svc.id] === false && (
                                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                                                    <X className="w-3 h-3 text-slate-400" />
                                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Hidden</span>
                                                                </div>
                                                            )}
                                                            <ArrowDown className="w-4 h-4 text-slate-300 dark:text-slate-600 -rotate-90" />
                                                        </div>
                                                    </Link>

                                                    <button
                                                        onClick={async (e) => {
                                                            e.preventDefault();
                                                            const currentConfig = client.services_config || {
                                                                payroll: true,
                                                                accounts: true,
                                                                corporation_tax: true,
                                                                vat: true,
                                                                self_assessment: true
                                                            };
                                                            const newConfig = {
                                                                ...currentConfig,
                                                                [svc.id]: currentConfig[svc.id] === false ? true : false
                                                            };
                                                            try {
                                                                await axios.post(`/api/clients/${client.id}/services`, { services: newConfig });
                                                                fetchClients();
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                        }}
                                                        title={client.services_config?.[svc.id] === false ? "Enable for client" : "Disable for client"}
                                                        className={`flex flex-col items-center justify-center gap-1 w-14 py-2 rounded-xl border transition-all ${client.services_config?.[svc.id] === false
                                                            ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-50'
                                                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50 text-blue-600'
                                                            }`}
                                                    >
                                                        <div className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${client.services_config?.[svc.id] === false ? 'bg-slate-300 dark:bg-slate-600' : 'bg-blue-600'
                                                            }`}>
                                                            <div className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${client.services_config?.[svc.id] === false ? 'translate-x-1' : 'translate-x-4.5'
                                                                }`} />
                                                        </div>
                                                        <span className="text-[9px] font-bold uppercase tracking-tighter">
                                                            {client.services_config?.[svc.id] === false ? 'OFF' : 'ON'}
                                                        </span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Existing Chat View Logic with 'Back' button added
    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard().url }]}>
            <Head title="Dashboard" />
            <div className="flex h-[calc(100vh-65px)] p-4 gap-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                {/* Client List - Hidden on mobile or if viewing specific chat in accountant view 
                    Actually, if we are in 'chat view' mode for accountant, maybe we show just the chat or the siderbar + chat?
                    Let's revert to original sidebar + chat layout if viewingChatClientId is set, 
                    OR if user is client (who only sees chat).
                */}

                {/* Back Button for Accountant */}
                {user.role === 'accountant' && viewingChatClientId && (
                    <div className="absolute top-20 left-4 z-10 md:hidden">
                        <button onClick={() => setViewingChatClientId(null)} className="p-2 bg-white shadow rounded-full">
                            <ArrowDown className="rotate-90" />
                        </button>
                    </div>
                )}

                {/* Client List Sidebar */}
                <div className={`w-80 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col overflow-hidden backdrop-blur-xl ${viewingChatClientId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-5 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-blue-500/5 to-teal-500/5">
                        <div className="flex items-center gap-3 mb-4">
                            {user.role === 'accountant' && (
                                <button onClick={() => setViewingChatClientId(null)} className="md:hidden mr-2">
                                    <ArrowDown className="h-5 w-5 rotate-90" />
                                </button>
                            )}
                            {/* ... existing header content ... */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Clients</h2>
                                {user.role === 'accountant' && <button onClick={() => setViewingChatClientId(null)} className="text-xs text-blue-500 hover:underline">Back to grid</button>}
                            </div>
                        </div>

                        {user.role === 'accountant' && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                />
                            </div>
                        )}
                    </div>
                    {/* Client List Content */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {user.role === 'client' ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 flex items-center justify-center mb-4">
                                    <MessageSquare className="h-8 w-8 text-blue-500" />
                                </div>
                                <p className="text-slate-500 text-sm">Contact your accountant using the chat.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredClients.map(client => (
                                    <button
                                        key={client.id}
                                        onClick={() => { setSelectedClient(client); setViewingChatClientId(client.id); }}
                                        className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center gap-3 text-left group ${selectedClient?.id === client.id
                                            ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg shadow-blue-500/25'
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${selectedClient?.id === client.id
                                            ? 'bg-white/20'
                                            : `bg-gradient-to-br ${getAvatarClasses(client.name)} text-white shadow-md`
                                            }`}>
                                            {getInitials(client.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-semibold truncate ${selectedClient?.id === client.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                {client.name}
                                            </div>
                                            <div className={`text-xs truncate ${selectedClient?.id === client.id ? 'text-white/70' : 'text-slate-500'}`}>
                                                {client.email}
                                            </div>
                                        </div>
                                        {client.unread_count > 0 && (
                                            <div className={`min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-bold ${selectedClient?.id === client.id
                                                ? 'bg-white text-blue-500'
                                                : 'bg-red-500 text-white'
                                                }`}>
                                                {client.unread_count}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col overflow-hidden backdrop-blur-xl ${viewingChatClientId || user.role === 'client' ? 'flex' : 'hidden md:flex'}`}>
                    {selectedClient ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-blue-500/5 to-teal-500/5">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarClasses(selectedClient.name)} flex items-center justify-center font-bold text-white shadow-lg`}>
                                            {getInitials(selectedClient.name)}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedClient.name}</h2>
                                            {partnerTyping ? (
                                                <p className="text-sm text-teal-500 font-medium flex items-center gap-1">
                                                    <span className="flex gap-0.5">
                                                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                    </span>
                                                    typing...
                                                </p>
                                            ) : (
                                                <p className="text-sm text-slate-500">{selectedClient.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search chat..."
                                                value={messageSearch}
                                                onChange={(e) => setMessageSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && fetchMessages()}
                                                className="pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-900/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-48"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowDateFilter(!showDateFilter)}
                                            className={`p-2.5 rounded-xl transition-all ${showDateFilter ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                            title="Filter by date"
                                        >
                                            <Filter className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={archiveConversation}
                                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 transition-all"
                                            title="Archive conversation"
                                        >
                                            <Archive className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                {showDateFilter && (
                                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="text-sm border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
                                        />
                                        <span className="text-slate-400">to</span>
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="text-sm border rounded-lg px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
                                        />
                                        <button
                                            onClick={fetchMessages}
                                            className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Apply
                                        </button>
                                        {(dateFrom || dateTo) && (
                                            <button
                                                onClick={() => { setDateFrom(''); setDateTo(''); fetchMessages(); }}
                                                className="text-sm text-slate-500 hover:text-red-500"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div ref={messagesContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-800/50">
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        id={`msg-${msg.id}`}
                                        className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'} transition-all duration-300 ${highlightedMessageId === msg.id ? 'scale-[1.02]' : ''}`}
                                    >
                                        <div className={`max-w-lg rounded-2xl p-4 transition-all duration-300 ${msg.sender_id === user.id
                                            ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-br-md shadow-lg shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-bl-md shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-slate-700/50'
                                            } ${highlightedMessageId === msg.id ? 'ring-2 ring-yellow-400' : ''}`}>
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
                                                    className={`text-xs mb-3 p-2 rounded-lg border-l-2 cursor-pointer transition-all hover:opacity-80 ${msg.sender_id === user.id
                                                        ? 'bg-white/10 border-white/50'
                                                        : 'bg-slate-100 dark:bg-slate-600/50 border-slate-300 dark:border-slate-500'
                                                        }`}
                                                >
                                                    <div className="font-semibold flex items-center gap-1"><Reply className="h-3 w-3" /> Reply</div>
                                                    <div className="truncate opacity-80">{stripHtml(msg.parent.content)?.substring(0, 50) || 'Attachment'}</div>
                                                </div>
                                            )}
                                            {(msg.type === 'text' || !msg.type) && (
                                                <div
                                                    className="prose prose-sm dark:prose-invert max-w-none rich-text-content"
                                                    dangerouslySetInnerHTML={{ __html: msg.content || '' }}
                                                />
                                            )}
                                            {msg.type === 'image' && (
                                                <div className="mb-2">
                                                    <img src={msg.attachment_path} alt="Attachment" className="max-w-full rounded-lg" />
                                                    {msg.content && <div dangerouslySetInnerHTML={{ __html: msg.content }} className="text-sm mt-2" />}
                                                </div>
                                            )}
                                            {msg.type === 'audio' && (
                                                <div className="flex items-center gap-2">
                                                    <audio controls src={msg.attachment_path} className="h-8 w-48" />
                                                </div>
                                            )}
                                            {msg.type === 'file' && (
                                                <a href={msg.attachment_path} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 underline break-all ${msg.sender_id === user.id ? 'text-white/90' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    <Paperclip className="h-4 w-4 shrink-0" />
                                                    {decodeURIComponent(msg.attachment_path.split('/').pop() || 'Download File')}
                                                </a>
                                            )}

                                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-white/10 dark:border-slate-600/50">
                                                <span className={`text-[10px] ${msg.sender_id === user.id ? 'text-white/70' : 'text-slate-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => toggleStar(msg.id)} title={msg.is_starred ? "Unstar" : "Star"} className="opacity-60 hover:opacity-100 transition-opacity">
                                                        <Star className={`h-3.5 w-3.5 ${msg.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                    </button>
                                                    <button onClick={() => setReplyTo(msg)} title="Reply" className="opacity-60 hover:opacity-100 transition-opacity">
                                                        <Reply className="h-3.5 w-3.5" />
                                                    </button>
                                                    {msg.sender_id === user.id && (
                                                        <span className="opacity-70">
                                                            {msg.read_at ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
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
                                        className="sticky bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-5 py-2.5 rounded-full shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:shadow-blue-500/40"
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                        Jump to Latest
                                    </button>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/50">
                                {/* Attachments Preview */}
                                {(attachment || audioBlob) && (
                                    <div className="mb-3 p-3 bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                            <Paperclip className="h-4 w-4 text-blue-500" />
                                            {attachment && <span>{attachment.name}</span>}
                                            {audioBlob && <span>Audio Recording Ready</span>}
                                        </div>
                                        <button onClick={() => { setAttachment(null); setAudioBlob(null); }} className="text-red-500 hover:text-red-600 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}

                                {replyTo && (
                                    <div className="mb-3 flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 border-l-4 border-blue-500 rounded-lg text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">Replying to message</span>
                                            <span className="text-slate-500 truncate max-w-xs">{stripHtml(replyTo.content)?.substring(0, 50) || 'Attachment'}</span>
                                        </div>
                                        <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-red-500 transition-colors">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}

                                <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <EditorProvider>
                                        <Editor
                                            value={newMessage}
                                            onChange={onEditorChange}
                                            containerProps={{ style: { minHeight: '100px', borderRadius: '0.5rem' } }}
                                        >
                                            <Toolbar style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', padding: '8px 12px' }}>
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

                                <div className="flex justify-between items-center mt-3">
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
                                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                                            title="Attach File"
                                        >
                                            <Paperclip className="h-5 w-5" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={`p-2.5 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                            title={isRecording ? "Stop Recording" : "Record Audio"}
                                        >
                                            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    <button
                                        onClick={sendMessage}
                                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2"
                                    >
                                        <Send className="h-4 w-4" />
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
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 flex items-center justify-center mb-6">
                                <MessageSquare className="h-12 w-12 text-blue-500/50" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Select a conversation</h3>
                            <p className="text-slate-500 max-w-sm">Choose a client from the list to start messaging and collaborating on their documents.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
