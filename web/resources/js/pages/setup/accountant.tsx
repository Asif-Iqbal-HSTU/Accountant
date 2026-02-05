import { Head, router } from '@inertiajs/react';
import { useState, FormEvent } from 'react';
import axios from 'axios';

export default function AccountantSetup() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        firmName: '',
        email: '',
        phone: '',
        bio: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Use web route instead of API to create proper session
            const response = await axios.post('/setup', {
                name: formData.name,
                email: formData.email,
                firm_name: formData.firmName,
                phone: formData.phone,
                bio: formData.bio,
            });

            if (response.data.success) {
                // Redirect to dashboard - session is now active
                window.location.href = response.data.redirect || '/dashboard';
            }
        } catch (err: any) {
            const message = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Something went wrong. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head title="Get Started - AccountantConnect">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6 py-12" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Background effects */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
                </div>

                <div className="relative w-full max-w-xl">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/25">
                                AC
                            </div>
                            <span className="text-2xl font-bold text-white">AccountantConnect</span>
                        </div>
                        <p className="text-slate-400">Set up your account in just a few steps</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex justify-center mb-8">
                        <div className="flex items-center gap-4">
                            {[1, 2].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s
                                        ? 'bg-gradient-to-r from-blue-500 to-teal-400 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white/10 text-slate-400 border border-white/20'
                                        }`}>
                                        {step > s ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : s}
                                    </div>
                                    {s < 2 && (
                                        <div className={`w-12 h-1 mx-2 rounded ${step > s ? 'bg-teal-400' : 'bg-white/10'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Card */}
                    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h2>
                                    <p className="text-slate-400">We'll use this to personalize your experience</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Your Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                                            placeholder="John Smith"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Firm Name *</label>
                                        <input
                                            type="text"
                                            name="firmName"
                                            required
                                            value={formData.firmName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                                            placeholder="Smith & Associates Accounting"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                                            placeholder="john@smithaccounting.co.uk"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={!formData.name || !formData.firmName || !formData.email}
                                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-teal-400 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    Continue
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-white mb-2">Almost there!</h2>
                                    <p className="text-slate-400">Add some optional details about your practice</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                                            placeholder="+44 20 1234 5678"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">About Your Practice</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all resize-none"
                                            placeholder="Tell your clients a bit about your accounting practice..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-4 border border-white/20 rounded-xl font-semibold text-white hover:bg-white/5 transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-teal-400 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Setting up...
                                            </>
                                        ) : (
                                            <>
                                                Complete Setup
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Login link */}
                        <div className="mt-6 text-center">
                            <span className="text-slate-400">Already have an account? </span>
                            <a href="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                                Sign in
                            </a>
                        </div>
                    </form>

                    {/* Features */}
                    <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                        {[
                            { icon: '🔒', label: 'Bank-level security' },
                            { icon: '⚡', label: 'Setup in 2 minutes' },
                            { icon: '🎁', label: '14-day free trial' },
                        ].map((feature, i) => (
                            <div key={i} className="text-sm text-slate-400">
                                <div className="text-2xl mb-1">{feature.icon}</div>
                                {feature.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
