import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Image, File, Trash2, Eye, Filter, Search, X, CheckCircle, Clock, AlertCircle, MoreVertical, Download, MessageSquare } from 'lucide-react';

axios.defaults.withCredentials = true;

interface Document {
    id: number;
    user_id: number;
    uploaded_by_id: number;
    filename: string;
    filepath: string;
    type: string;
    category: string | null;
    status: 'pending' | 'reviewed' | 'processed';
    notes: string | null;
    accountant_comment: string | null;
    amount: number | null;
    document_date: string | null;
    merchant: string | null;
    file_size: number | null;
    mime_type: string | null;
    created_at: string;
}

interface DocumentStats {
    total: number;
    pending: number;
    reviewed: number;
    processed: number;
}

export default function Documents({ clients = [] }: { clients?: any[] }) {
    const user = (usePage().props as any).auth.user;
    const [documents, setDocuments] = useState<Document[]>([]);
    const [stats, setStats] = useState<DocumentStats | null>(null);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAccountant = user.role === 'accountant';

    useEffect(() => {
        if (isAccountant) {
            if (selectedClient) {
                fetchDocuments(selectedClient.id);
                fetchStats(selectedClient.id);
            }
        } else {
            fetchDocuments();
            fetchStats();
        }
    }, [selectedClient]);

    const fetchDocuments = async (userId?: number) => {
        try {
            let url = userId ? `/api/documents/user/${userId}` : '/api/documents';
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (filterStatus) params.append('status', filterStatus);
            if (filterCategory) params.append('category', filterCategory);
            if (params.toString()) url += '?' + params.toString();

            const response = await axios.get(url);
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const fetchStats = async (userId?: number) => {
        try {
            const url = userId ? `/api/documents/stats/${userId}` : '/api/documents/stats';
            const response = await axios.get(url);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();

        for (let i = 0; i < e.target.files.length; i++) {
            formData.append('files[]', e.target.files[i]);
        }

        if (isAccountant && selectedClient) {
            formData.append('user_id', selectedClient.id);
        }

        try {
            await axios.post('/api/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchDocuments(isAccountant && selectedClient ? selectedClient.id : undefined);
            fetchStats(isAccountant && selectedClient ? selectedClient.id : undefined);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Failed to upload files');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const deleteDocument = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await axios.delete(`/api/documents/${id}`);
            setDocuments(prev => prev.filter(d => d.id !== id));
            fetchStats(isAccountant && selectedClient ? selectedClient.id : undefined);
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            await axios.post(`/api/documents/${id}/status`, { status });
            setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: status as any } : d));
            fetchStats(isAccountant && selectedClient ? selectedClient.id : undefined);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'reviewed': return <AlertCircle className="h-4 w-4 text-blue-500" />;
            case 'processed': return <CheckCircle className="h-4 w-4 text-green-500" />;
            default: return null;
        }
    };

    const getFileIcon = (mimeType: string | null) => {
        if (!mimeType) return <File className="h-8 w-8 text-gray-400" />;
        if (mimeType.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
        if (mimeType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
        return <File className="h-8 w-8 text-gray-500" />;
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'Unknown';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Documents', href: '/documents' }]}>
            <Head title="Documents" />
            <div className="flex h-[calc(100vh-65px)] p-4 gap-4">
                {/* Client List (for accountants) */}
                {isAccountant && (
                    <div className="w-1/4 bg-white dark:bg-zinc-800 rounded-xl border border-sidebar-border/70 dark:border-sidebar-border shadow-sm p-4 overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Clients</h2>
                        <ul className="space-y-2">
                            {clients.map(client => (
                                <li
                                    key={client.id}
                                    onClick={() => setSelectedClient(client)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedClient?.id === client.id
                                            ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                                            : 'hover:bg-gray-50 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    <div className="font-medium">{client.name}</div>
                                    <div className="text-xs text-gray-500">{client.email}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Main Documents Area */}
                <div className={`${isAccountant ? 'flex-1' : 'w-full'} bg-white dark:bg-zinc-800 rounded-xl border border-sidebar-border/70 dark:border-sidebar-border shadow-sm p-4 flex flex-col`}>
                    {(!isAccountant || selectedClient) ? (
                        <>
                            {/* Header */}
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {isAccountant ? `Documents - ${selectedClient?.name}` : 'My Documents'}
                                    </h2>
                                    {stats && (
                                        <div className="flex gap-4 mt-2 text-sm">
                                            <span className="text-gray-500">Total: {stats.total}</span>
                                            <span className="text-yellow-600 flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Pending: {stats.pending}
                                            </span>
                                            <span className="text-blue-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> Reviewed: {stats.reviewed}
                                            </span>
                                            <span className="text-green-600 flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" /> Processed: {stats.processed}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search documents..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && fetchDocuments(isAccountant && selectedClient ? selectedClient.id : undefined)}
                                            className="pl-8 pr-3 py-2 text-sm border rounded-lg dark:bg-zinc-900 dark:border-zinc-700"
                                        />
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    </div>
                                    <button
                                        onClick={() => setShowFilter(!showFilter)}
                                        className={`p-2 rounded-lg ${showFilter ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                                    >
                                        <Filter className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {isUploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                    />
                                </div>
                            </div>

                            {/* Filter Panel */}
                            {showFilter && (
                                <div className="flex items-center gap-4 p-3 mb-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="text-sm border rounded px-3 py-1.5 dark:bg-zinc-800 dark:border-zinc-700"
                                    >
                                        <option value="">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="processed">Processed</option>
                                    </select>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="text-sm border rounded px-3 py-1.5 dark:bg-zinc-800 dark:border-zinc-700"
                                    >
                                        <option value="">All Categories</option>
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                        <option value="tax_document">Tax Document</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <button
                                        onClick={() => fetchDocuments(isAccountant && selectedClient ? selectedClient.id : undefined)}
                                        className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-600"
                                    >
                                        Apply
                                    </button>
                                    {(filterStatus || filterCategory) && (
                                        <button
                                            onClick={() => { setFilterStatus(''); setFilterCategory(''); fetchDocuments(isAccountant && selectedClient ? selectedClient.id : undefined); }}
                                            className="text-gray-500 hover:text-red-500 text-sm"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Documents Grid */}
                            <div className="flex-1 overflow-y-auto">
                                {documents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <FileText className="h-16 w-16 mb-4" />
                                        <p className="text-lg">No documents found</p>
                                        <p className="text-sm">Upload your first document to get started</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {documents.map(doc => (
                                            <div
                                                key={doc.id}
                                                className="border dark:border-zinc-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-zinc-800"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        {getFileIcon(doc.mime_type)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate" title={doc.filename}>
                                                                {doc.filename}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatFileSize(doc.file_size)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {getStatusIcon(doc.status)}
                                                    </div>
                                                </div>

                                                {doc.merchant && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                        Merchant: {doc.merchant}
                                                    </p>
                                                )}
                                                {doc.amount && (
                                                    <p className="text-sm font-semibold text-green-600 mb-2">
                                                        ${doc.amount.toFixed(2)}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t dark:border-zinc-700">
                                                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                                    <div className="flex gap-1">
                                                        <a
                                                            href={doc.filepath}
                                                            target="_blank"
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                                                            title="View"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </a>
                                                        <a
                                                            href={doc.filepath}
                                                            download
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                                                            title="Download"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                        {isAccountant && (
                                                            <select
                                                                value={doc.status}
                                                                onChange={(e) => updateStatus(doc.id, e.target.value)}
                                                                className="text-xs border rounded px-1 py-0.5 dark:bg-zinc-800 dark:border-zinc-700"
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="reviewed">Reviewed</option>
                                                                <option value="processed">Processed</option>
                                                            </select>
                                                        )}
                                                        <button
                                                            onClick={() => deleteDocument(doc.id)}
                                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {doc.accountant_comment && (
                                                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                                                        <MessageSquare className="h-3 w-3 inline mr-1" />
                                                        {doc.accountant_comment}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                                <FileText className="h-16 w-16 mx-auto mb-4" />
                                <p className="text-lg">Select a client to view their documents</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
