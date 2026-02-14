import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Users, ChevronRight, CheckCircle2, Clock, Upload,
    Download, FileText, PoundSterling, Calendar as CalendarIcon,
    Loader2, Plus, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
const TAX_YEARS_P60 = ['2023/2024', '2024/2025', '2025/2026'];

interface PayrollProps {
    userId?: number;
    clientName?: string;
}

export default function Payroll({ userId, clientName }: PayrollProps) {
    const user = (usePage().props as any).auth.user;
    const isAccountant = user.role === 'accountant';
    // If userId provided (viewing specific client), use it. Otherwise use auth user (client view).
    // If accountant views the page without userId, they might see nothing or a prompt to select client. 
    // Assuming this page is either Client View (userId undefined) or Accountant View of Client (userId defined).
    const targetUserId = userId || user.id;

    const [activeTab, setActiveTab] = useState('submissions');
    const [selectedYear, setSelectedYear] = useState('2024/2025');
    const [loading, setLoading] = useState(false);

    // Data
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [payslips, setPayslips] = useState<any[]>([]);
    const [liabilities, setLiabilities] = useState<any[]>([]);
    const [starterForm, setStarterForm] = useState<any>(null);
    const [p60p45s, setP60p45s] = useState<any[]>([]);
    const [selectedP60Year, setSelectedP60Year] = useState('2024/2025');

    // Submit Modal (Client)
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [submitForm, setSubmitForm] = useState({ name: '', hours: '', holidays: '', notes: '' });

    // Upload Modals (Accountant)
    const [isUploadPayslipOpen, setIsUploadPayslipOpen] = useState(false);
    const [uploadPayslipForm, setUploadPayslipForm] = useState<{ month: string, file: File | null, submissionId?: number }>({ month: '', file: null });

    const [isLiabilityOpen, setIsLiabilityOpen] = useState(false);
    const [liabilityForm, setLiabilityForm] = useState({ month: '', amount: '', payment_link: '', payment_reference: '' });

    const [isUploadStarterOpen, setIsUploadStarterOpen] = useState(false);
    const [starterFile, setStarterFile] = useState<File | null>(null);

    const [isUploadP60Open, setIsUploadP60Open] = useState(false);
    const [uploadP60Form, setUploadP60Form] = useState({ type: 'p60', file: null as File | null });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadTabData();
    }, [activeTab, selectedYear, selectedP60Year, targetUserId]);

    const loadTabData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab === 'submissions' || activeTab === 'payslips' || activeTab === 'liabilities') {
                params.append('year', selectedYear);
            }
            if (activeTab === 'p60-p45') {
                params.append('tax_year', selectedP60Year);
            }
            if (userId) {
                params.append('user_id', userId.toString());
            }

            let endpoint = '';
            switch (activeTab) {
                case 'submissions': endpoint = '/api/payroll/submissions'; break;
                case 'payslips': endpoint = '/api/payroll/payslips'; break;
                case 'liabilities': endpoint = '/api/payroll/liabilities'; break;
                case 'starter-form': endpoint = '/api/payroll/starter-form'; break;
                case 'p60-p45': endpoint = '/api/payroll/p60-p45'; break;
            }

            if (endpoint) {
                const res = await axios.get(`${endpoint}?${params.toString()}`);
                switch (activeTab) {
                    case 'submissions': setSubmissions(res.data); break;
                    case 'payslips': setPayslips(res.data); break;
                    case 'liabilities': setLiabilities(res.data); break;
                    case 'starter-form': setStarterForm(res.data); break;
                    case 'p60-p45': setP60p45s(res.data); break;
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleSubmitHours = async () => {
        try {
            await axios.post('/api/payroll/submissions', {
                month: selectedMonth,
                year: selectedYear,
                user_id: targetUserId, // Ensure we submit for correct user (though backend validates)
                ...submitForm,
            });
            setIsSubmitOpen(false);
            loadTabData();
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to submit hours.');
        }
    };

    const handleUploadPayslip = async () => {
        if (!uploadPayslipForm.file) return;

        // If submissionId is present, we are uploading for a specific employee submission
        if (uploadPayslipForm.submissionId) {
            const formData = new FormData();
            formData.append('file', uploadPayslipForm.file);
            try {
                await axios.post(`/api/payroll/submissions/${uploadPayslipForm.submissionId}/payslip`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setIsUploadPayslipOpen(false);
                loadTabData();
            } catch (error) {
                console.error(error);
                alert('Failed to upload employee payslip');
            }
        } else {
            // Fallback for generic bulk/monthly upload (legacy or bulk feature)
            if (!uploadPayslipForm.month) return;
            const formData = new FormData();
            formData.append('user_id', targetUserId.toString());
            formData.append('month', uploadPayslipForm.month);
            formData.append('year', selectedYear);
            formData.append('file', uploadPayslipForm.file);

            try {
                await axios.post('/api/payroll/payslips', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setIsUploadPayslipOpen(false);
                loadTabData();
            } catch (error) {
                console.error(error);
                alert('Failed to upload payslip');
            }
        }
    };

    const handleSaveLiability = async () => {
        if (!liabilityForm.month || !liabilityForm.amount) return;
        try {
            await axios.post('/api/payroll/liabilities', {
                user_id: targetUserId,
                year: selectedYear,
                ...liabilityForm
            });
            setIsLiabilityOpen(false);
            loadTabData();
        } catch (error) {
            console.error(error);
            alert('Failed to save liability');
        }
    };

    const handleUploadStarter = async () => {
        if (!starterFile) return;
        const formData = new FormData();
        formData.append('user_id', targetUserId.toString());
        formData.append('file', starterFile);

        try {
            await axios.post('/api/payroll/starter-form', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setIsUploadStarterOpen(false);
            loadTabData();
        } catch (error) {
            console.error(error);
            alert('Failed to upload starter form');
        }
    };

    const handleUploadP60 = async () => {
        if (!uploadP60Form.file) return;
        const formData = new FormData();
        formData.append('user_id', targetUserId.toString());
        formData.append('tax_year', selectedP60Year);
        formData.append('type', uploadP60Form.type);
        formData.append('file', uploadP60Form.file);

        try {
            await axios.post('/api/payroll/p60-p45', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setIsUploadP60Open(false);
            loadTabData();
        } catch (error) {
            console.error(error);
            alert('Failed to upload document');
        }
    };

    // --- Renderers ---

    const renderSubmissions = () => (
        <div className="space-y-6">
            {isAccountant && (
                <div className="flex items-center gap-4 mb-4">
                    <Label className="font-semibold text-slate-700 dark:text-slate-200">Select Month:</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {!isAccountant ? (
                // Client View: Month Cards
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MONTHS.map((month) => {
                        // Filter submissions for this month
                        const monthSubmissions = submissions.filter((s) => s.month === month);
                        const hasSubmissions = monthSubmissions.length > 0;
                        const allProcessed = hasSubmissions && monthSubmissions.every(s => s.status === 'processed');

                        return (
                            <div
                                key={month}
                                onClick={() => {
                                    setSelectedMonth(month);
                                    setSubmitForm({ name: '', hours: '', holidays: '', notes: '' });
                                    setIsSubmitOpen(true);
                                }}
                                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md bg-white border-slate-200 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">{month}</h3>
                                    {allProcessed ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    ) : hasSubmissions ? (
                                        <Clock className="w-5 h-5 text-amber-500" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                                <p className="text-sm text-slate-500">
                                    {hasSubmissions ? `${monthSubmissions.length} Employees Submitted` : 'Click to submit hours'}
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Accountant View: List of Employees for Selected Month
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {submissions.filter(s => s.month === selectedMonth).length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No submissions found for {selectedMonth}</p>
                        </div>
                    ) : (
                        submissions.filter(s => s.month === selectedMonth).map((submission) => (
                            <div key={submission.id} className="p-4 rounded-xl border bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{submission.name}</h3>
                                        <p className="text-xs text-slate-500">Submitted: {new Date(submission.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {submission.status === 'processed' ? (
                                            <div className="flex gap-1">
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(submission.payslip_file_path, '_blank')}>
                                                    <Download className="w-4 h-4 text-blue-500" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-medium">Pending</div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                                    <p>Hours: <span className="font-mono font-medium">{submission.hours}</span></p>
                                    <p>Holidays: <span className="font-mono font-medium">{submission.holidays || '0'}</span></p>
                                    {submission.notes && (
                                        <p className="text-xs italic text-slate-500 mt-2 bg-slate-50 dark:bg-slate-900 p-2 rounded">"{submission.notes}"</p>
                                    )}
                                </div>

                                {/* Upload Action */}
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            setUploadPayslipForm({ ...uploadPayslipForm, month: selectedMonth, submissionId: submission.id });
                                            setIsUploadPayslipOpen(true);
                                        }}
                                    >
                                        <Upload className="w-3 h-3 mr-2" />
                                        {submission.status === 'processed' ? 'Re-upload Payslip' : 'Upload Payslip'}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );

    const renderPayslips = () => (
        <div className="space-y-4">
            {isAccountant && (
                <div className="flex justify-end mb-4">
                    <Button onClick={() => {
                        setUploadPayslipForm({ month: '', file: null });
                        setIsUploadPayslipOpen(true);
                    }}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Payslip
                    </Button>
                </div>
            )}
            {MONTHS.map((month) => {
                const payslip = payslips.find((p) => p.month === month);
                return (
                    <div key={month} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${payslip ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white">{month}</h4>
                                <p className="text-xs text-slate-500">{payslip ? payslip.filename : 'No payslip available'}</p>
                            </div>
                        </div>
                        {payslip && (
                            <Button variant="outline" size="sm" onClick={() => window.open(payslip.file_path, '_blank')}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderLiabilities = () => (
        <div className="space-y-4">
            {isAccountant && (
                <div className="flex justify-end mb-4">
                    <Dialog open={isLiabilityOpen} onOpenChange={setIsLiabilityOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Liability
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Payroll Liability</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Month</Label>
                                    <Select onValueChange={(v) => setLiabilityForm({ ...liabilityForm, month: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Amount (£)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        onChange={(e) => setLiabilityForm({ ...liabilityForm, amount: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Payment Link (Optional)</Label>
                                    <Input
                                        placeholder="https://..."
                                        onChange={(e) => setLiabilityForm({ ...liabilityForm, payment_link: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Payment Reference</Label>
                                    <Input
                                        placeholder="Ref Number"
                                        onChange={(e) => setLiabilityForm({ ...liabilityForm, payment_reference: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveLiability}>Save Liability</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
            {MONTHS.map((month) => {
                const liability = liabilities.find((l) => l.month === month);
                return (
                    <div key={month} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${liability ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                    <PoundSterling className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white">{month}</span>
                            </div>
                            {liability ? (
                                <span className="text-xl font-bold text-teal-600 dark:text-teal-400">£{parseFloat(liability.amount).toFixed(2)}</span>
                            ) : (
                                <span className="text-sm text-slate-400">No liability</span>
                            )}
                        </div>
                        {liability && (
                            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 uppercase">Payment Reference</p>
                                    <p className="font-mono text-slate-900 dark:text-white">{liability.payment_reference || 'N/A'}</p>
                                </div>
                                {liability.payment_link && (
                                    <Button size="sm" onClick={() => window.open(liability.payment_link, '_blank')}>
                                        Pay Now
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderStarterForm = () => (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center bg-slate-50 dark:bg-slate-800/50">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Starter Checklist</h3>
                <p className="text-slate-500 mb-6">Download the starter checklist form for new employees.</p>

                {starterForm ? (
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => window.open(starterForm.file_path, '_blank')}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Form
                        </Button>
                    </div>
                ) : (
                    <p className="text-amber-600 text-sm">Form not available yet. Please contact your accountant.</p>
                )}

                {isAccountant && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="outline" onClick={() => setIsUploadStarterOpen(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload New Form
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={isUploadStarterOpen} onOpenChange={setIsUploadStarterOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Starter Form</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input type="file" onChange={(e) => setStarterFile(e.target.files?.[0] || null)} />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUploadStarter}>Upload</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    const renderP60P45 = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                {isAccountant && (
                    <Button onClick={() => setIsUploadP60Open(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                    </Button>
                )}
                <Select value={selectedP60Year} onValueChange={setSelectedP60Year}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tax Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {TAX_YEARS_P60.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {p60p45s.length > 0 ? (
                <div className="grid gap-4">
                    {p60p45s.map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{doc.type.toUpperCase()}</h4>
                                    <p className="text-sm text-slate-500">Tax Year: {doc.tax_year}</p>
                                </div>
                            </div>
                            <Button variant="outline" onClick={() => window.open(doc.file_path, '_blank')}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No documents found for {selectedP60Year}</p>
                </div>
            )}

            <Dialog open={isUploadP60Open} onOpenChange={setIsUploadP60Open}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload P60/P45</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Document Type</Label>
                            <Select onValueChange={(v) => setUploadP60Form({ ...uploadP60Form, type: v })} defaultValue="p60">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="p60">P60</SelectItem>
                                    <SelectItem value="p45">P45</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>File</Label>
                            <Input type="file" onChange={(e) => setUploadP60Form({ ...uploadP60Form, file: e.target.files?.[0] || null })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUploadP60}>Upload</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

    return (
        <AppLayout breadcrumbs={[{ title: 'Accounting', href: '/accounting' }, { title: 'Payroll', href: '/accounting/payroll' }]}>
            <Head title="Payroll" />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Payroll
                                {clientName && <span className="text-teal-500"> - {clientName}</span>}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">Manage submissions, payslips and P60s</p>
                        </div>
                    </div>
                    {/* Annual Year Selector for general tabs */}
                    {['submissions', 'payslips', 'liabilities'].includes(activeTab) && (
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {['2023/2024', '2024/2025', '2025/2026'].map(y => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Tabs Navigation */}
                <div className="flex overflow-x-auto pb-4 gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
                    {[
                        { id: 'submissions', label: 'Submit Hours' },
                        { id: 'payslips', label: 'Payslips' },
                        { id: 'liabilities', label: 'Liabilities' },
                        { id: 'starter-form', label: 'Starter Form' },
                        { id: 'p60-p45', label: 'P60 & P45' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    </div>
                ) : (
                    <div className="min-h-[400px]">
                        {activeTab === 'submissions' && renderSubmissions()}
                        {activeTab === 'payslips' && renderPayslips()}
                        {activeTab === 'liabilities' && renderLiabilities()}
                        {activeTab === 'starter-form' && renderStarterForm()}
                        {activeTab === 'p60-p45' && renderP60P45()}
                    </div>
                )}

                {/* Upload Payslip Modal (Accountant) */}
                <Dialog open={isUploadPayslipOpen} onOpenChange={setIsUploadPayslipOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Payslip</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {!uploadPayslipForm.submissionId && (
                                <div className="grid gap-2">
                                    <Label>Select Month</Label>
                                    <Select onValueChange={(v) => setUploadPayslipForm({ ...uploadPayslipForm, month: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label>Payslip File</Label>
                                <Input type="file" onChange={(e) => setUploadPayslipForm({ ...uploadPayslipForm, file: e.target.files?.[0] || null })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleUploadPayslip}>Upload</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Submit Modal (Client Only) */}
                <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Submit Payroll Hours</DialogTitle>
                            <DialogDescription>
                                For {selectedMonth} {selectedYear}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Employee Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter name"
                                    value={submitForm.name}
                                    onChange={(e) => setSubmitForm({ ...submitForm, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="hours">Hours Worked</Label>
                                    <Input
                                        id="hours"
                                        placeholder="0.00"
                                        type="number"
                                        value={submitForm.hours}
                                        onChange={(e) => setSubmitForm({ ...submitForm, hours: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="holidays">Holiday Hours</Label>
                                    <Input
                                        id="holidays"
                                        placeholder="0.00"
                                        type="number"
                                        value={submitForm.holidays}
                                        onChange={(e) => setSubmitForm({ ...submitForm, holidays: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes</Label>
                                <textarea
                                    id="notes"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Any additional notes..."
                                    value={submitForm.notes}
                                    onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={handleSubmitHours}>Submit Hours</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
