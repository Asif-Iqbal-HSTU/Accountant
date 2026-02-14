import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Receipt, PoundSterling, Loader2, Download, CreditCard, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const YEARS = ['2023', '2024', '2025', '2026'];
const QUARTERS = [
    { id: 'Q1', label: 'Q1 (Jan-Mar)' },
    { id: 'Q2', label: 'Q2 (Apr-Jun)' },
    { id: 'Q3', label: 'Q3 (Jul-Sep)' },
    { id: 'Q4', label: 'Q4 (Oct-Dec)' },
];

export default function VAT() {
    const [selectedYear, setSelectedYear] = useState('2025');
    const [selectedQuarter, setSelectedQuarter] = useState('Q1');
    const [vatData, setVatData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedYear, selectedQuarter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/vat?year=${selectedYear}&quarter=${selectedQuarter}`);
            setVatData(res.data.length > 0 ? res.data[0] : null);
        } catch (error) {
            console.error('Error loading VAT data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Accounting', href: '/accounting' }, { title: 'VAT', href: '/accounting/vat' }]}>
            <Head title="VAT Returns" />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                            <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">VAT Returns</h1>
                            <p className="text-slate-500 dark:text-slate-400">Manage your quarterly VAT returns</p>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
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

                        <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Quarter" />
                            </SelectTrigger>
                            <SelectContent>
                                {QUARTERS.map((q) => (
                                    <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>
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
                        {/* VAT Return */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-red-100 text-red-600 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">VAT Return</h3>
                            <p className="text-slate-500 mb-6">{selectedQuarter} {selectedYear}</p>

                            {vatData?.return_file ? (
                                <>
                                    <p className="text-sm text-slate-500 mb-6">{vatData.filename || 'vat-return.pdf'}</p>
                                    <Button onClick={() => window.open(vatData.return_file, '_blank')} className="w-full max-w-xs">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Return
                                    </Button>
                                </>
                            ) : (
                                <div className="py-6 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl w-full">
                                    <p className="text-slate-500">No VAT return found for this period.</p>
                                </div>
                            )}
                        </div>

                        {/* VAT Liability */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-red-100 text-red-600 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                                <PoundSterling className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">VAT Liability</h3>
                            <p className="text-slate-500 mb-6">Amount due for {selectedQuarter} {selectedYear}</p>

                            {vatData?.liability_amount ? (
                                <div className="w-full max-w-xs space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                        <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">£{parseFloat(vatData.liability_amount).toFixed(2)}</p>
                                        <p className="text-xs text-slate-400 uppercase">Total Due</p>
                                    </div>

                                    <div className="text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Payment Reference</p>
                                        <p className="font-mono text-slate-900 dark:text-white select-all">{vatData.payment_reference || 'N/A'}</p>
                                    </div>

                                    {vatData.payment_link && (
                                        <Button onClick={() => window.open(vatData.payment_link, '_blank')} className="w-full bg-red-600 hover:bg-red-700">
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Pay Online
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="py-6 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl w-full">
                                    <p className="text-slate-500">No liability recorded for this period.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
