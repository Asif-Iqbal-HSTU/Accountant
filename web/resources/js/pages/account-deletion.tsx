import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function AccountDeletion() {
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/account/request-deletion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, reason }),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const data = await response.json();
                setError(data.message || 'Something went wrong. Please try again.');
            }
        } catch {
            setError('Network error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Request Account Deletion" />
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}>
                {/* Logo */}
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #3b82f6, #14b8a6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 32,
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
                }}>
                    <span style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>AC</span>
                </div>

                {/* Card */}
                <div style={{
                    width: '100%',
                    maxWidth: 480,
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 24,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '40px 32px',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
                }}>
                    {!submitted ? (
                        <>
                            {/* Header */}
                            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                <div style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 14,
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    fontSize: 24,
                                }}>
                                    🗑️
                                </div>
                                <h1 style={{
                                    color: '#f1f5f9',
                                    fontSize: 24,
                                    fontWeight: 700,
                                    margin: '0 0 8px',
                                }}>Request Account Deletion</h1>
                                <p style={{
                                    color: '#94a3b8',
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                    margin: 0,
                                }}>
                                    Submit a request to delete your Docklands Accountants account and all associated data.
                                    This action is permanent and cannot be undone.
                                </p>
                            </div>

                            {/* Warning */}
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: 12,
                                padding: '16px',
                                marginBottom: 24,
                            }}>
                                <p style={{
                                    color: '#fca5a5',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    margin: '0 0 8px',
                                }}>⚠️ What will be deleted:</p>
                                <ul style={{
                                    color: '#fca5a5',
                                    fontSize: 13,
                                    lineHeight: 1.8,
                                    margin: 0,
                                    paddingLeft: 20,
                                }}>
                                    <li>Your account profile and login credentials</li>
                                    <li>All messages and conversations</li>
                                    <li>All uploaded documents</li>
                                    <li>Company information and accounting records</li>
                                    <li>Meeting history</li>
                                </ul>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{
                                        display: 'block',
                                        color: '#cbd5e1',
                                        fontSize: 14,
                                        fontWeight: 500,
                                        marginBottom: 8,
                                    }}>Email Address *</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="Enter the email associated with your account"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: 12,
                                            color: '#f1f5f9',
                                            fontSize: 14,
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <label style={{
                                        display: 'block',
                                        color: '#cbd5e1',
                                        fontSize: 14,
                                        fontWeight: 500,
                                        marginBottom: 8,
                                    }}>Reason for Deletion (optional)</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Let us know why you'd like to delete your account..."
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: 12,
                                            color: '#f1f5f9',
                                            fontSize: 14,
                                            outline: 'none',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                {error && (
                                    <div style={{
                                        color: '#fca5a5',
                                        fontSize: 14,
                                        marginBottom: 16,
                                        padding: '10px 14px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        borderRadius: 8,
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: loading ? '#4b5563' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        border: 'none',
                                        borderRadius: 12,
                                        color: '#fff',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {loading ? 'Submitting...' : 'Submit Deletion Request'}
                                </button>
                            </form>

                            {/* Footer note */}
                            <p style={{
                                color: '#64748b',
                                fontSize: 12,
                                textAlign: 'center',
                                marginTop: 20,
                                lineHeight: 1.6,
                            }}>
                                You will receive a confirmation via email. Deletion requests are processed within 48 hours.
                                For immediate deletion, please log in and use the delete account option in your profile settings.
                            </p>
                        </>
                    ) : (
                        /* Success State */
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                fontSize: 28,
                            }}>
                                ✓
                            </div>
                            <h2 style={{
                                color: '#f1f5f9',
                                fontSize: 22,
                                fontWeight: 700,
                                margin: '0 0 12px',
                            }}>Request Submitted</h2>
                            <p style={{
                                color: '#94a3b8',
                                fontSize: 14,
                                lineHeight: 1.6,
                                margin: '0 0 24px',
                            }}>
                                If an account exists with the email you provided, you will receive a confirmation shortly.
                                Deletion requests are typically processed within 48 hours.
                            </p>
                            <a
                                href="/"
                                style={{
                                    display: 'inline-block',
                                    padding: '12px 24px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: 12,
                                    color: '#94a3b8',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                }}
                            >
                                Return to Home
                            </a>
                        </div>
                    )}
                </div>

                {/* Privacy Note */}
                <p style={{
                    color: '#475569',
                    fontSize: 12,
                    textAlign: 'center',
                    marginTop: 24,
                    maxWidth: 480,
                }}>
                    In accordance with data protection regulations, all personal data associated with your account
                    will be permanently removed from our systems upon confirmed deletion.
                </p>
            </div>
        </>
    );
}
