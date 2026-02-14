import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calculator, PoundSterling, Loader2, Download, CreditCard, Upload, ExternalLink } from 'lucide-react';
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

export default function CorporationTax({ userId, clientName }: Props) {
    const { auth } = usePage().props as any;
    const isAccountant = auth.user.role === 'accountant';

    const [selectedYear, setSelectedYear] = useState('2025');
    const [taxData, setTaxData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Accountant Management State
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [manageForm, setManageForm] = useState({
        liability_amount: '',
        payment_link: '',
        payment_reference: '',
        ct600_file: null as File | null,
        tax_computation_file: null as File | null,
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedYear, userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const url = userId
                ? `/api/corporation-tax?year=${selectedYear}&user_id=${userId}`
                : `/api/corporation-tax?year=${selectedYear}`;
            const res = await axios.get(url);
            setTaxData(res.data.length > 0 ? res.data[0] : null);

            if (res.data.length > 0) {
                const data = res.data[0];
                setManageForm({
                    liability_amount: data.liability_amount?.toString() || '',
                    payment_link: data.payment_link || '',
                    payment_reference: data.payment_reference || '',
                    ct600_file: null,
                    tax_computation_file: null,
                });
            } else {
                setManageForm({
                    liability_amount: '',
                    payment_link: '',
                    payment_reference: '',
                    ct600_file: null,
                    tax_computation_file: null,
                });
            }
        } catch (error) {
            console.error('Error loading corporation tax:', error);
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
        formData.append('liability_amount', manageForm.liability_amount);
        formData.append('payment_link', manageForm.payment_link);
        formData.append('payment_reference', manageForm.payment_reference);

        if (manageForm.ct600_file) formData.append('ct600_file', manageForm.ct600_file);
        if (manageForm.tax_computation_file) formData.append('tax_computation_file', manageForm.tax_computation_file);

        try {
            await axios.post('/api/corporation-tax', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsManageOpen(false);
            loadData();
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save corporation tax data');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Accounting', href: '/accounting' },
            { title: 'Corporation Tax', href: '/accounting/corporation-tax' }
        ]}>
            <Head title={`Corporation Tax${clientName ? ` - ${clientName}` : ''}`} />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Corporation Tax
                                {clientName && <span className="text-amber-500"> - {clientName}</span>}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">View tax returns and liabilities</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAccountant && userId && (
                            <Button onClick={() => setIsManageOpen(true)} className="bg-amber-600 hover:bg-amber-700">
                                <Upload className="w-4 h-4 mr-2" />
                                Manage Tax Return
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
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* CT600 */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-20 h-20 bg-amber-100 text-amber-600 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">CT600 Return</h3>

                            {taxData?.ct600_file ? (
                                <>
                                    <p className="text-sm text-slate-500 mb-8">{taxData.ct600_filename || 'ct600.pdf'}</p>
                                    <Button onClick={() => window.open(taxData.ct600_file, '_blank')} className="w-full" variant="outline">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Return
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500 py-6">No CT600 filed for {selectedYear}</p>
                            )}
                        </div>

                        {/* Tax Computation */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-20 h-20 bg-amber-100 text-amber-600 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
                                <Calculator className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tax Computation</h3>

                            {taxData?.tax_computation_file ? (
                                <>
                                    <p className="text-sm text-slate-500 mb-8">{taxData.tax_computation_filename || 'computation.pdf'}</p>
                                    <Button onClick={() => window.open(taxData.tax_computation_file, '_blank')} className="w-full" variant="outline">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Computation
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500 py-6">No computation available for {selectedYear}</p>
                            )}
                        </div>

                        {/* Liability */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm lg:shadow-md transition-shadow ring-2 ring-amber-500/20">
                            <div className="w-20 h-20 bg-amber-600 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-600/20">
                                <PoundSterling className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tax Liability</h3>

                            {taxData?.liability_amount ? (
                                <>
                                    <p className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-4">£{parseFloat(taxData.liability_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    <div className="w-full space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 text-left">Payment Reference</p>
                                            <p className="font-mono bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 text-left border border-slate-200 dark:border-slate-700">{taxData.payment_reference || 'N/A'}</p>
                                        </div>

                                        {taxData.payment_link && (
                                            <Button onClick={() => window.open(taxData.payment_link, '_blank')} className="w-full bg-amber-600 hover:bg-amber-700 mt-4 shadow-lg shadow-amber-600/20">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Pay Online
                                            </Button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500 py-6">No liability recorded for {selectedYear}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Manage Modal for Accountant */}
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Manage Corporation Tax - {clientName}</DialogTitle>
                        <DialogDescription>Update tax files and liability details for {selectedYear}.</DialogDescription>
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
                                    placeholder="HMRC Reference..."
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Payment Link</Label>
                                <Input
                                    value={manageForm.payment_link}
                                    onChange={e => setManageForm({ ...manageForm, payment_link: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t space-y-4">
                            <div className="space-y-2">
                                <Label>CT600 Return (PDF)</Label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setManageForm({ ...manageForm, ct600_file: e.target.files?.[0] || null })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tax Computation (PDF)</Label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setManageForm({ ...manageForm, tax_computation_file: e.target.files?.[0] || null })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <Button type="button" variant="outline" onClick={() => setIsManageOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={isSaving}>
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
