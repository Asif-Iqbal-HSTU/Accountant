import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calculator, PoundSterling, Loader2, Download, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const YEARS = ['2023', '2024', '2025', '2026'];

export default function CorporationTax() {
    const [selectedYear, setSelectedYear] = useState('2025');
    const [taxData, setTaxData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/corporation-tax?year=${selectedYear}`);
            setTaxData(res.data.length > 0 ? res.data[0] : null);
        } catch (error) {
            console.error('Error loading corporation tax:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Accounting', href: '/accounting' }, { title: 'Corporation Tax', href: '/accounting/corporation-tax' }]}>
            <Head title="Corporation Tax" />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Corporation Tax</h1>
                            <p className="text-slate-500 dark:text-slate-400">View your tax returns and liabilities</p>
                        </div>
                    </div>

                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {YEARS.map((year) => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* CT600 */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">CT600 Return</h3>

                            {taxData?.ct600_file ? (
                                <>
                                    <p className="text-sm text-slate-500 mb-6">{taxData.ct600_filename || 'ct600.pdf'}</p>
                                    <Button onClick={() => window.open(taxData.ct600_file, '_blank')} className="w-full">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Return
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500 py-4">No CT600 filed for {selectedYear}</p>
                            )}
                        </div>

                        {/* Tax Computation */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                                <Calculator className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tax Computation</h3>

                            {taxData?.tax_computation_file ? (
                                <>
                                    <p className="text-sm text-slate-500 mb-6">{taxData.tax_computation_filename || 'computation.pdf'}</p>
                                    <Button onClick={() => window.open(taxData.tax_computation_file, '_blank')} className="w-full">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Computation
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500 py-4">No computation available for {selectedYear}</p>
                            )}
                        </div>

                        {/* Liability */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                                <PoundSterling className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tax Liability</h3>

                            {taxData?.liability_amount ? (
                                <>
                                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">£{parseFloat(taxData.liability_amount).toFixed(2)}</p>
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Payment Reference</p>
                                    <p className="font-mono bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded text-sm mb-6">{taxData.payment_reference || 'N/A'}</p>

                                    {taxData.payment_link && (
                                        <Button onClick={() => window.open(taxData.payment_link, '_blank')} className="w-full bg-amber-600 hover:bg-amber-700">
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Pay Now
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-slate-500 py-4">No liability recorded for {selectedYear}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
