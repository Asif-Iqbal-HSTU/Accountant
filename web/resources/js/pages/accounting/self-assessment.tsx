import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, FileText, PoundSterling, Loader2, Download, CreditCard, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const YEARS = ['2023', '2024', '2025', '2026'];

export default function SelfAssessment() {
    const [selectedYear, setSelectedYear] = useState('2025');
    const [taxData, setTaxData] = useState<any>(null);
    const [utrNumber, setUtrNumber] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/self-assessment?year=${selectedYear}`);
            if (res.data && res.data.length > 0) {
                setTaxData(res.data[0]);
                if (res.data[0].utr_number) {
                    setUtrNumber(res.data[0].utr_number);
                }
            } else {
                setTaxData(null);
            }
        } catch (error) {
            console.error('Error loading Self Assessment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyUtr = () => {
        navigator.clipboard.writeText(utrNumber);
        alert('UTR copied to clipboard');
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Accounting', href: '/accounting' }, { title: 'Self Assessment', href: '/accounting/self-assessment' }]}>
            <Head title="Self Assessment" />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Self Assessment</h1>
                            <p className="text-slate-500 dark:text-slate-400">View your personal tax returns</p>
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

                {utrNumber && (
                    <div className="mb-6 bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/20 rounded-xl p-4 flex items-center justify-between max-w-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/30 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold uppercase">UTR Number</p>
                                <p className="font-mono font-bold text-slate-900 dark:text-white">{utrNumber}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={copyUtr}>
                            <Copy className="w-4 h-4 text-sky-500" />
                        </Button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tax Return */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-sky-100 text-sky-600 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-6">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tax Return</h3>
                            <p className="text-slate-500 mb-6">SA100 for {selectedYear}</p>

                            {taxData?.return_file ? (
                                <>
                                    <p className="text-sm text-slate-500 mb-6">{taxData.filename || 'tax-return.pdf'}</p>
                                    <Button onClick={() => window.open(taxData.return_file, '_blank')} className="w-full max-w-xs">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Return
                                    </Button>
                                </>
                            ) : (
                                <div className="py-6 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl w-full">
                                    <p className="text-slate-500">No tax return filed for this year.</p>
                                </div>
                            )}
                        </div>

                        {/* Tax Liability */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-16 h-16 bg-sky-100 text-sky-600 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-6">
                                <PoundSterling className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tax Liability</h3>
                            <p className="text-slate-500 mb-6">Amount due for {selectedYear}</p>

                            {taxData?.liability_amount ? (
                                <div className="w-full max-w-xs space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                        <p className="text-3xl font-bold text-sky-600 dark:text-sky-400 mb-1">£{parseFloat(taxData.liability_amount).toFixed(2)}</p>
                                        <p className="text-xs text-slate-400 uppercase">Total Due</p>
                                    </div>

                                    <div className="text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Payment Reference</p>
                                        <p className="font-mono text-slate-900 dark:text-white select-all">{taxData.payment_reference || 'N/A'}</p>
                                    </div>

                                    {taxData.payment_link && (
                                        <Button onClick={() => window.open(taxData.payment_link, '_blank')} className="w-full bg-sky-600 hover:bg-sky-700">
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Pay Online
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="py-6 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl w-full">
                                    <p className="text-slate-500">No liability recorded for this year.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
