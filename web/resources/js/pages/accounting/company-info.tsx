import { Head } from '@inertiajs/react'; // Link removed
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Building2, Save, Loader2, Upload, FileText } from 'lucide-react';

export default function CompanyInfo({ userId, clientName }: { userId?: number, clientName?: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        company_number: '',
        auth_code: '',
        ct_reference: '',
        vat_registration: '',
        paye_registration: '',
        accounts_office_ref: '',
        incorporation_certificate: null as string | null,
        certificate_file: null as File | null,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadCompanyInfo();
    }, []);

    const loadCompanyInfo = async () => {
        try {
            const endpoint = userId ? `/api/company-info/${userId}` : '/api/company-info';
            const res = await axios.get(endpoint);
            if (res.data) {
                setForm({
                    company_number: res.data.company_number || '',
                    auth_code: res.data.auth_code || '',
                    ct_reference: res.data.ct_reference || '',
                    vat_registration: res.data.vat_registration || '',
                    paye_registration: res.data.paye_registration || '',
                    accounts_office_ref: res.data.accounts_office_ref || '',
                    incorporation_certificate: res.data.incorporation_certificate || null,
                    certificate_file: null,
                });
            }
        } catch (error) {
            console.error('Error loading company info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setForm({
                ...form,
                certificate_file: e.target.files[0],
            });
        }
    };

    const saveCompanyInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('company_number', form.company_number);
            formData.append('auth_code', form.auth_code);
            formData.append('ct_reference', form.ct_reference);
            formData.append('vat_registration', form.vat_registration);
            formData.append('paye_registration', form.paye_registration);
            formData.append('accounts_office_ref', form.accounts_office_ref);

            if (form.certificate_file) {
                formData.append('incorporation_certificate', form.certificate_file);
            }

            if (userId) {
                formData.append('user_id', userId.toString());
            }

            await axios.post('/api/company-info', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Company information saved successfully');
        } catch (error) {
            console.error('Error saving company info:', error);
            alert('Failed to save company information');
        } finally {
            setSaving(false);
        }
    };

    const fields = [
        { key: 'company_number', label: 'Company Number', placeholder: 'e.g. 12345678' },
        { key: 'auth_code', label: 'Company Authentication Code', placeholder: 'e.g. A1B2C3' },
        { key: 'ct_reference', label: 'Corporation Tax Reference', placeholder: 'e.g. 12345 67890' },
        { key: 'vat_registration', label: 'VAT Registration Number', placeholder: 'e.g. GB 123 4567 89' },
        { key: 'paye_registration', label: 'PAYE Registration Number', placeholder: 'e.g. 123/AB456' },
        { key: 'accounts_office_ref', label: 'Accounts Office Reference', placeholder: 'e.g. 123PX00123456' },
    ];

    if (loading) {
        return (
            <AppLayout breadcrumbs={[{ title: 'Accounting', href: '/accounting' }, { title: 'Company Info', href: '/accounting/company-info' }]}>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Accounting', href: '/accounting' }, { title: 'Company Info', href: '/accounting/company-info' }]}>
            <Head title="Company Information" />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {clientName ? `Company Info: ${clientName}` : 'Company Information'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            {clientName ? `Manage registration details for ${clientName}` : 'Manage your company registration details'}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/20">
                        <div className="flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                            <Building2 className="w-5 h-5 flex-shrink-0" />
                            <p>
                                Enter your company registration details below. Your accountant can also update these from their portal.
                                These details are used for filing your returns.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={saveCompanyInfo} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {fields.map((field) => (
                                <div key={field.key} className="space-y-2">
                                    <label htmlFor={field.key} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {field.label}
                                    </label>
                                    <input
                                        type="text"
                                        id={field.key}
                                        value={(form as any)[field.key]}
                                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/50"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Incorporation Certificate</h3>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                            >
                                {form.certificate_file ? (
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-slate-900 dark:text-white">New: {form.certificate_file.name}</p>
                                            <p className="text-xs text-slate-500">Ready to upload</p>
                                        </div>
                                    </div>
                                ) : form.incorporation_certificate ? (
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-slate-900 dark:text-white">Certificate Uploaded</p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(form.incorporation_certificate!, '_blank');
                                                }}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                View Document
                                            </button>
                                            <p className="text-xs text-slate-500 mt-1">Click box to replace</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <p className="font-medium">Click to upload certificate</p>
                                        <p className="text-xs">PDF, PNG or JPG up to 10MB</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
