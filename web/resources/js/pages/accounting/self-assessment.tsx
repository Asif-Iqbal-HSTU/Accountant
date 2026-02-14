import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, FileText, PoundSterling, Loader2, Download, CreditCard, Copy, Upload, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const YEARS = ['2023/2024', '2024/2025', '2025/2026'];

interface Props {
    userId?: number;
    clientName?: string;
}

export default function SelfAssessment({ userId, clientName }: Props) {
    const { auth } = usePage().props as any;
    const isAccountant = auth.user.role === 'accountant';

    const [selectedYear, setSelectedYear] = useState('2024/2025');
    const [taxData, setTaxData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Management State
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [manageForm, setManageForm] = useState({
        liability_amount: '',
        payment_link: '',
        utr_number: '',
        tax_return_file: null as File | null,
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedYear, userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const url = userId
                ? `/api/self-assessment?tax_year=${selectedYear}&user_id=${userId}`
                : `/api/self-assessment?tax_year=${selectedYear}`;
            const res = await axios.get(url);
            setTaxData(res.data.length > 0 ? res.data[0] : null);

            if (res.data.length > 0) {
                const data = res.data[0];
                setManageForm({
                    liability_amount: data.liability_amount?.toString() || '',
                    payment_link: data.payment_link || '',
                    utr_number: data.utr_number || '',
                    tax_return_file: null,
                });
            } else {
                setManageForm({
                    liability_amount: '',
                    payment_link: '',
                    utr_number: '',
                    tax_return_file: null,
                });
            }
        } catch (error) {
            console.error('Error loading Self Assessment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setIsSaving(true);
        const formData = new FormData();
        formData.append('user_id', userId.toString());
        formData.append('tax_year', selectedYear);
        formData.append('liability_amount', manageForm.liability_amount);
        formData.append('payment_link', manageForm.payment_link);
        formData.append('utr_number', manageForm.utr_number);

        if (manageForm.tax_return_file) {
            formData.append('tax_return_file', manageForm.tax_return_file);
        }

        try {
            await axios.post('/api/self-assessment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsManageOpen(false);
            loadData();
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save Self Assessment data');
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Simple feedback
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Accounting', href: '/accounting' },
            { title: 'Self Assessment', href: '/accounting/self-assessment' }
        ]}>
            <Head title={`Self Assessment${clientName ? ` - ${clientName}` : ''}`} />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Self Assessment
                                {clientName && <span className="text-sky-500"> - {clientName}</span>}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">Personal tax returns and liabilities</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {isAccountant && userId && (
                            <Button onClick={() => setIsManageOpen(true)} className="bg-sky-600 hover:bg-sky-700">
                                <Upload className="w-4 h-4 mr-2" />
                                Manage Return
                            </Button>
                        )}
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Tax Year" />
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
                        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tax Return Document */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all">
                            <div className="w-20 h-20 bg-sky-100 text-sky-600 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tax Return (SA100)</h3>
                            <p className="text-slate-500 mb-6">Return for tax year {selectedYear}</p>

                            {taxData?.tax_return_file ? (
                                <>
                                    <p className="text-sm text-slate-500 mb-8">{taxData.tax_return_filename || 'tax-return.pdf'}</p>
                                    <Button onClick={() => window.open(taxData.tax_return_file, '_blank')} className="w-full max-w-xs" variant="outline">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF
                                    </Button>
                                </>
                            ) : (
                                <div className="py-8 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 w-full mb-4">
                                    <p className="text-slate-500">No tax return document uploaded for this year.</p>
                                </div>
                            )}
                        </div>

                        {/* Tax Liability & Payment */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm lg:shadow-md transition-all ring-2 ring-sky-500/10">
                            <div className="w-20 h-20 bg-sky-600 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-sky-600/20">
                                <PoundSterling className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Personal Tax Liability</h3>
                            <p className="text-slate-500 mb-6">Financial obligation for {selectedYear}</p>

                            {taxData?.liability_amount ? (
                                <div className="w-full max-w-xs space-y-6">
                                    <div className="bg-sky-50 dark:bg-sky-900/20 py-4 px-2 rounded-2xl">
                                        <p className="text-4xl font-bold text-sky-600 dark:text-sky-400 mb-1">
                                            £{parseFloat(taxData.liability_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-sky-500 uppercase font-bold tracking-widest">Balance Due</p>
                                    </div>

                                    <div className="text-left space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">UTR Number</Label>
                                            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 group">
                                                <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{taxData.utr_number || 'N/A'}</p>
                                                {taxData.utr_number && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(taxData.utr_number)}>
                                                        <Copy className="w-3 h-3 text-sky-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {taxData.payment_link && (
                                        <Button onClick={() => window.open(taxData.payment_link, '_blank')} className="w-full bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-600/20 h-12">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Pay HMRC Online
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 w-full text-center">
                                    <div className="mb-4">
                                        <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Your UTR Number</Label>
                                        <p className="font-mono text-lg text-slate-400 mt-1">{taxData?.utr_number || 'Not Provided'}</p>
                                    </div>
                                    <p className="text-slate-500 px-4">No liability calculation found for this tax year.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Manage Modal for Accountant */}
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Manage Self Assessment - {clientName}</DialogTitle>
                        <DialogDescription>Update tax files and liability for {selectedYear}.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Liability Amount (£)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={manageForm.liability_amount}
                                    onChange={e => setManageForm({ ...manageForm, liability_amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>UTR Number</Label>
                                <Input
                                    value={manageForm.utr_number}
                                    onChange={e => setManageForm({ ...manageForm, utr_number: e.target.value })}
                                    placeholder="10 digit UTR..."
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Payment Link</Label>
                                <Input
                                    value={manageForm.payment_link}
                                    onChange={e => setManageForm({ ...manageForm, payment_link: e.target.value })}
                                    placeholder="https://www.gov.uk/pay-self-assessment..."
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t space-y-4">
                            <div className="space-y-2">
                                <Label>Self Assessment Return (PDF)</Label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setManageForm({ ...manageForm, tax_return_file: e.target.files?.[0] || null })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <Button type="button" variant="outline" onClick={() => setIsManageOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-sky-600 hover:bg-sky-700" disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                Save & Upload
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
