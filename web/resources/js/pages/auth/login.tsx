import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({
    status,
    canResetPassword,
}: Props) {
    return (
        <>
            <Head title="Log in">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6 py-12" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Animated background effects */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                </div>

                <div className="relative w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center mb-4">
                            <img
                                src="/docklands.png"
                                alt="Docklands Accountants"
                                className="h-16 w-auto object-contain"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
                        <p className="text-slate-400">Sign in to your account to continue</p>
                    </div>

                    {/* Login Card */}
                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-5">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="email@example.com"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                                        />
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                                Password
                                            </label>
                                            {canResetPassword && (
                                                <a
                                                    href={request()}
                                                    className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                                                    tabIndex={5}
                                                >
                                                    Forgot password?
                                                </a>
                                            )}
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                                        />
                                        {errors.password && (
                                            <p className="mt-2 text-sm text-red-400">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="border-white/20 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                                        />
                                        <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer">
                                            Remember me
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-teal-400 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && (
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        )}
                                        Sign In
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>

                    {status && (
                        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-sm font-medium text-emerald-400">
                            {status}
                        </div>
                    )}

                    {/* Security badge */}
                    <div className="mt-8 flex items-center justify-center gap-6 text-center">
                        {[
                            { icon: '🔒', label: 'Encrypted' },
                            { icon: '🛡️', label: 'Secure Login' },
                            { icon: '✓', label: '2FA Available' },
                        ].map((feature, i) => (
                            <div key={i} className="text-xs text-slate-500 flex items-center gap-1.5">
                                <span>{feature.icon}</span>
                                {feature.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
