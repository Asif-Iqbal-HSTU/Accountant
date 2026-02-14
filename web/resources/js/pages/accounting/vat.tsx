import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Receipt, PoundSterling, Loader2, Download, CreditCard, Calendar, FileText, Upload, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const YEARS = ['2023', '2024', '2025', '2026'];
const QUARTERS = [
    { id: 1, label: 'Q1 (Jan-Mar)' },
    { id: 2, label: 'Q2 (Apr-Jun)' },
    { id: 3, label: 'Q3 (Jul-Sep)' },
    { id: 4, label: 'Q4 (Oct-Dec)' },
];

interface Props {
    userId?: number;
    clientName?: string;
}

export default function VAT({ userId, clientName }: Props) {
    const { auth } = usePage().props as any;
    const isAccountant = auth.user.role === 'accountant';

    const [selectedYear, setSelectedYear] = useState('2025');
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [vatData, setVatData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Management State
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [manageForm, setManageForm] = useState({
        liability_amount: '',
        payment_link: '',
        payment_reference: '',
        vat_return_file: null as File | null,
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedYear, selectedQuarter, userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const url = userId
                ? `/api/vat?year=${selectedYear}&quarter=${selectedQuarter}&user_id=${userId}`
                : `/api/vat?year=${selectedYear}&quarter=${selectedQuarter}`;
            const res = await axios.get(url);
            setVatData(res.data.length > 0 ? res.data[0] : null);

            if (res.data.length > 0) {
                const data = res.data[0];
                setManageForm({
                    liability_amount: data.liability_amount?.toString() || '',
                    payment_link: data.payment_link || '',
                    payment_reference: data.payment_reference || '',
                    vat_return_file: null,
                });
            } else {
                setManageForm({
                    liability_amount: '',
                    payment_link: '',
                    payment_reference: '',
                    vat_return_file: null,
                });
            }
        } catch (error) {
            console.error('Error loading VAT data:', error);
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
        formData.append('year', selectedYear);
        formData.append('quarter', selectedQuarter.toString());
        formData.append('liability_amount', manageForm.liability_amount);
        formData.append('payment_link', manageForm.payment_link);
        formData.append('payment_reference', manageForm.payment_reference);

        if (manageForm.vat_return_file) {
            formData.append('vat_return_file', manageForm.vat_return_file);
        }

        try {
            await axios.post('/api/vat', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsManageOpen(false);
            loadData();
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save VAT data');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Accounting', href: '/accounting' },
            { title: 'VAT', href: '/accounting/vat' }
        ]}>
            <Head title={`VAT Returns${clientName ? ` - ${clientName}` : ''}`} />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                            <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                VAT Returns
                                {clientName && <span className="text-red-500"> - {clientName}</span>}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">Quarterly VAT compliance documents</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {isAccountant && userId && (
                            <Button onClick={() => setIsManageOpen(true)} className="bg-red-600 hover:bg-red-700">
                                <Upload className="w-4 h-4 mr-2" />
                                Manage Return
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

                        <Select value={selectedQuarter.toString()} onValueChange={(val) => setSelectedQuarter(parseInt(val))}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Quarter" />
                            </SelectTrigger>
                            <SelectContent>
                                {QUARTERS.map((q) => (
                                    <SelectItem key={q.id} value={q.id.toString()}>{q.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* VAT Return Document */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all">
                            <div className="w-20 h-20 bg-red-100 text-red-600 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">VAT Return Statement</h3>
                            <p className="text-slate-500 mb-6">Statement for {QUARTERS.find(q => q.id === selectedQuarter)?.label} {selectedYear}</p>

                            {vatData?.vat_return_file ? (
                                <>
                                    <p className="text-sm text-slate-500 mb-8">{vatData.vat_return_filename || 'vat-return.pdf'}</p>
                                    <Button onClick={() => window.open(vatData.vat_return_file, '_blank')} className="w-full max-w-xs" variant="outline">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF
                                    </Button>
                                </>
                            ) : (
                                <div className="py-8 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 w-full mb-4">
                                    <p className="text-slate-500">No return document uploaded for this period.</p>
                                </div>
                            )}
                        </div>

                        {/* VAT Liability & Payment */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm lg:shadow-md transition-all ring-2 ring-red-500/10">
                            <div className="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-600/20">
                                <PoundSterling className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">VAT Liability</h3>
                            <p className="text-slate-500 mb-6">Financial obligation for the selected period</p>

                            {vatData?.liability_amount ? (
                                <div className="w-full max-w-xs space-y-6">
                                    <div className="bg-red-50 dark:bg-red-900/20 py-4 px-2 rounded-2xl">
                                        <p className="text-4xl font-bold text-red-600 dark:text-red-400 mb-1">
                                            £{parseFloat(vatData.liability_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-red-500 uppercase font-bold tracking-widest">Total VAT Due</p>
                                    </div>

                                    <div className="text-left space-y-2">
                                        <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Payment Reference</Label>
                                        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{vatData.payment_reference || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {vatData.payment_link && (
                                        <Button onClick={() => window.open(vatData.payment_link, '_blank')} className="w-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 h-12">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Pay HMRC Now
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 w-full">
                                    <p className="text-slate-500">No liability recorded for this period.</p>
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
                        <DialogTitle>Manage VAT Return - {clientName}</DialogTitle>
                        <DialogDescription>Update VAT files and liability for {selectedYear} Quarter {selectedQuarter}.</DialogDescription>
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
                            <div className="space-y-2 col-span-2">
                                <Label>Payment Reference</Label>
                                <Input
                                    value={manageForm.payment_reference}
                                    onChange={e => setManageForm({ ...manageForm, payment_reference: e.target.value })}
                                    placeholder="VAT Number + Reference..."
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Payment Link</Label>
                                <Input
                                    value={manageForm.payment_link}
                                    onChange={e => setManageForm({ ...manageForm, payment_link: e.target.value })}
                                    placeholder="https://www.gov.uk/pay-vat..."
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t space-y-4">
                            <div className="space-y-2">
                                <Label>VAT Return Document (PDF)</Label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setManageForm({ ...manageForm, vat_return_file: e.target.files?.[0] || null })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <Button type="button" variant="outline" onClick={() => setIsManageOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSaving}>
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
