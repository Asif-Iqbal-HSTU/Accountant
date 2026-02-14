import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calculator, Download, FileText, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const YEARS = ['2023', '2024', '2025', '2026'];

interface Props {
    userId?: number;
    clientName?: string;
}

export default function Accounts({ userId, clientName }: Props) {
    const { auth } = usePage().props as any;
    const isAccountant = auth.user.role === 'accountant';

    const [selectedYear, setSelectedYear] = useState('2025');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Upload State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadYear, setUploadYear] = useState('2025');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadAccounts();
    }, [selectedYear, userId]);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const url = userId
                ? `/api/accounts?year=${selectedYear}&user_id=${userId}`
                : `/api/accounts?year=${selectedYear}`;
            const res = await axios.get(url);
            setAccounts(res.data);
        } catch (error) {
            console.error('Error loading accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !userId) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('user_id', userId.toString());
        formData.append('year', uploadYear);
        formData.append('file', selectedFile);

        try {
            await axios.post('/api/accounts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsUploadOpen(false);
            setSelectedFile(null);
            loadAccounts();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload accounts');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Accounting', href: '/accounting' },
            { title: 'Accounts', href: '/accounting/accounts' }
        ]}>
            <Head title={`Yearly Accounts${clientName ? ` - ${clientName}` : ''}`} />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Calculator className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Yearly Accounts
                                {clientName && <span className="text-purple-500"> - {clientName}</span>}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">View and download annual accounts</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAccountant && userId && (
                            <Button onClick={() => setIsUploadOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Accounts
                            </Button>
                        )}
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {YEARS.map((year) => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {accounts.length > 0 ? (
                            accounts.map((acc) => (
                                <div key={acc.id} className="flex justify-between items-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Accounts {acc.year}</h3>
                                            <p className="text-sm text-slate-500">{acc.filename || 'accounts.pdf'}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => window.open(acc.file_path, '_blank')}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No accounts found</h3>
                                <p className="text-slate-500">No accounts have been uploaded for {selectedYear} yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Yearly Accounts</DialogTitle>
                        <DialogDescription>Upload the annual accounts PDF for {clientName}.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpload} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label>Select Year</Label>
                            <Select value={uploadYear} onValueChange={setUploadYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>PDF File</Label>
                            <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isUploading}>
                                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                Upload Now
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
