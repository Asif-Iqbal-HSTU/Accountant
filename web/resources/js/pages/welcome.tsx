import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';
import type { SharedData } from '@/types';
import { useState, useEffect } from 'react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: '💬',
            title: 'Real-Time Messaging',
            description: 'Instant communication with your clients through secure, encrypted messaging with rich text support.'
        },
        {
            icon: '📁',
            title: 'Document Sharing',
            description: 'Share and manage documents securely. Track document status and get instant notifications.'
        },
        {
            icon: '📱',
            title: 'White-Label Mobile App',
            description: 'Provide your clients with a branded mobile app featuring your firm\'s identity.'
        },
        {
            icon: '🔒',
            title: 'Bank-Level Security',
            description: 'Enterprise-grade encryption ensures your client data stays private and protected.'
        },
        {
            icon: '⚡',
            title: 'Instant Notifications',
            description: 'Never miss a message or document update with real-time push notifications.'
        },
        {
            icon: '📊',
            title: 'Client Dashboard',
            description: 'Manage all your clients from a single, intuitive dashboard with powerful search.'
        }
    ];

    const testimonials = [
        {
            name: 'Sarah Mitchell',
            role: 'Partner, Mitchell & Associates',
            quote: 'AccountantConnect transformed how we interact with our clients. Response times improved by 80%.',
            avatar: 'SM'
        },
        {
            name: 'James Robertson',
            role: 'Director, Robertson Accounting',
            quote: 'The white-label app makes us look incredibly professional. Our clients love it.',
            avatar: 'JR'
        },
        {
            name: 'Emma Thompson',
            role: 'Founder, Thompson Tax Services',
            quote: 'Document management has never been easier. This platform is a game-changer.',
            avatar: 'ET'
        }
    ];

    return (
        <>
            <Head title="AccountantConnect - The Platform for Modern Accountants">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Animated background elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500" />
                </div>

                {/* Navigation */}
                <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-slate-900/95 backdrop-blur-md shadow-xl' : ''}`}>
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/25">
                                AC
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                AccountantConnect
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="px-5 py-2 text-slate-300 hover:text-white transition-colors font-medium"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/setup"
                                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105"
                                    >
                                        Get Started Free
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-6">
                    <div className="max-w-7xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
                            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                            <span className="text-sm text-slate-300">Trusted by 500+ accounting firms in London</span>
                        </div>

                        {/* Main headline */}
                        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                                The Future of{' '}
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                                Client Communication
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                            Empower your accounting practice with a powerful platform for seamless client
                            communication, document sharing, and a branded mobile app your clients will love.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                            <Link
                                href="/setup"
                                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-400 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 flex items-center gap-3"
                            >
                                Start Free Trial
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <button className="px-8 py-4 border border-white/20 rounded-2xl font-semibold text-lg hover:bg-white/5 transition-all flex items-center gap-3 backdrop-blur-sm">
                                <svg className="w-6 h-6 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Watch Demo
                            </button>
                        </div>

                        {/* Hero Image/Preview */}
                        <div className="relative max-w-5xl mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-teal-500/20 blur-3xl" />
                            <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                                <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                    <span className="ml-4 text-sm text-slate-500">AccountantConnect Dashboard</span>
                                </div>
                                <div className="p-8">
                                    <div className="grid grid-cols-3 gap-6">
                                        {/* Sidebar preview */}
                                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
                                            <div className="text-sm font-semibold text-slate-400 mb-4">Clients</div>
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-sm font-bold">
                                                        {['JD', 'SM', 'AR'][i - 1]}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-white">{['John Doe', 'Sarah Miller', 'Alex Ross'][i - 1]}</div>
                                                        <div className="text-xs text-slate-500">Last message: 2h ago</div>
                                                    </div>
                                                    {i === 1 && <div className="w-5 h-5 bg-teal-500 rounded-full text-xs flex items-center justify-center">2</div>}
                                                </div>
                                            ))}
                                        </div>
                                        {/* Chat preview */}
                                        <div className="col-span-2 bg-slate-800/50 rounded-2xl p-4 border border-white/5">
                                            <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center font-bold">JD</div>
                                                <div>
                                                    <div className="font-semibold">John Doe</div>
                                                    <div className="text-xs text-teal-400">Online</div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-start">
                                                    <div className="bg-slate-700/50 rounded-2xl rounded-tl-none px-4 py-2 max-w-xs">
                                                        <p className="text-sm">Hi, I've uploaded my tax documents for review.</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl rounded-tr-none px-4 py-2 max-w-xs">
                                                        <p className="text-sm">Thank you! I'll review them today and get back to you. 📄</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 px-6 relative">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-teal-400 font-semibold text-sm uppercase tracking-wider">Features</span>
                            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                                Everything You Need to
                                <br />
                                <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Delight Your Clients</span>
                            </h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                                Built specifically for accounting professionals who want to provide exceptional client service.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="group p-8 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-teal-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1"
                                >
                                    <div className="text-4xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-bold mb-3 group-hover:text-teal-400 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-20 px-6 bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-emerald-500/10 border-y border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-8 text-center">
                            {[
                                { value: '500+', label: 'Accounting Firms' },
                                { value: '50K+', label: 'Messages Sent' },
                                { value: '99.9%', label: 'Uptime' },
                                { value: '4.9★', label: 'Customer Rating' }
                            ].map((stat, index) => (
                                <div key={index} className="p-6">
                                    <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-slate-400 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-24 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-teal-400 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
                            <h2 className="text-4xl md:text-5xl font-bold mt-4">
                                Loved by Accountants
                                <br />
                                <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Across London</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {testimonials.map((testimonial, index) => (
                                <div
                                    key={index}
                                    className="p-8 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-white/20 transition-all"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center font-bold text-lg">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{testimonial.name}</div>
                                            <div className="text-sm text-slate-400">{testimonial.role}</div>
                                        </div>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed italic">"{testimonial.quote}"</p>
                                    <div className="flex gap-1 mt-4">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="relative p-12 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-3xl border border-white/10 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-teal-500/10 blur-3xl" />
                            <div className="relative z-10">
                                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                    Ready to Transform Your
                                    <br />
                                    <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Client Experience?</span>
                                </h2>
                                <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                                    Join 500+ accounting firms already using AccountantConnect to provide exceptional service to their clients.
                                </p>
                                <Link
                                    href="/setup"
                                    className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-500 to-teal-400 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
                                >
                                    Start Your Free Trial
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <p className="mt-4 text-sm text-slate-500">No credit card required • 14-day free trial</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 px-6 border-t border-white/10">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center font-bold shadow-lg">
                                    AC
                                </div>
                                <span className="text-lg font-bold">AccountantConnect</span>
                            </div>
                            <div className="flex gap-8 text-sm text-slate-400">
                                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                                <a href="#" className="hover:text-white transition-colors">Contact</a>
                            </div>
                            <div className="text-sm text-slate-500">
                                © 2026 AccountantConnect. Made for London Accountants.
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
