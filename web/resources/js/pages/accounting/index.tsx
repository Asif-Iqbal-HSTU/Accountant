import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Building2,
    Users,
    Calculator,
    FileText,
    Receipt,
    User,
    ArrowRight
} from 'lucide-react';

export default function AccountingIndex() {
    const { auth } = usePage().props as any;
    const services = auth.user.services_config || {
        payroll: true,
        accounts: true,
        corporation_tax: true,
        vat: true,
        self_assessment: true,
    };

    const modules = [
        {
            title: 'Company Info',
            description: 'Company details & registration numbers',
            href: '/accounting/company-info',
            icon: Building2,
            color: 'bg-blue-500',
            gradient: 'from-blue-500 to-blue-600',
            id: 'company_info',
        },
        {
            title: 'Payroll',
            description: 'Hours, payslips, liabilities & P60/P45',
            href: '/accounting/payroll',
            icon: Users,
            color: 'bg-teal-500',
            gradient: 'from-teal-500 to-teal-600',
            id: 'payroll',
        },
        {
            title: 'Accounts',
            description: 'View & download yearly accounts',
            href: '/accounting/accounts',
            icon: Calculator,
            color: 'bg-purple-500',
            gradient: 'from-purple-500 to-purple-600',
            id: 'accounts',
        },
        {
            title: 'Corporation Tax',
            description: 'CT600, computations & liabilities',
            href: '/accounting/corporation-tax',
            icon: FileText,
            color: 'bg-amber-500',
            gradient: 'from-amber-500 to-amber-600',
            id: 'corporation_tax',
        },
        {
            title: 'VAT',
            description: 'Quarterly returns & liabilities',
            href: '/accounting/vat',
            icon: Receipt,
            color: 'bg-red-500',
            gradient: 'from-red-500 to-red-600',
            id: 'vat',
        },
        {
            title: 'Self Assessment',
            description: 'Tax returns & liabilities',
            href: '/accounting/self-assessment',
            icon: User,
            color: 'bg-sky-500',
            gradient: 'from-sky-500 to-sky-600',
            id: 'self_assessment',
        },
    ].filter(m => m.id === 'company_info' || services[m.id]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Accounting', href: '/accounting' }]}>
            <Head title="Accounting" />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Accounting</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your business finances and tax obligations</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module) => {
                        const isActive = module.id === 'company_info' || services[module.id] !== false;

                        return (
                            <Link
                                key={module.title}
                                href={isActive ? module.href : '#'}
                                onClick={(e) => !isActive && e.preventDefault()}
                                className={`group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 ${isActive
                                        ? 'hover:shadow-md hover:-translate-y-1 cursor-pointer'
                                        : 'opacity-50 grayscale-[0.5] cursor-not-allowed'
                                    } block`}
                            >
                                <div className={`absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity`}>
                                    <module.icon className={`w-32 h-32 ${module.color.replace('bg-', 'text-')}`} />
                                </div>

                                <div className="relative z-10">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${isActive ? module.gradient : 'from-slate-400 to-slate-500'} flex items-center justify-center shadow-lg mb-4 ${isActive ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
                                        <module.icon className="w-6 h-6 text-white" />
                                    </div>

                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className={`text-lg font-bold ${isActive ? 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400' : 'text-slate-400'} transition-colors`}>
                                            {module.title}
                                        </h3>
                                        {!isActive && (
                                            <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg text-slate-500 border border-slate-200 dark:border-slate-700">
                                                Disabled by Accountant
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 min-h-[40px]">
                                        {module.description}
                                    </p>

                                    {isActive ? (
                                        <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                            View Details <ArrowRight className="w-4 h-4 ml-1" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-xs font-medium text-slate-400 italic">
                                            Contact your accountant to enable this service
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
