import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { Calendar, Video, Phone, Users, Clock, AlertCircle, MessageSquare, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';

export default function MeetingsIndex() {
    const user = (usePage().props as any).auth.user;
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Negotiation Modal State
    const [isNegotiating, setIsNegotiating] = useState(false);
    const [currentMeetingId, setCurrentMeetingId] = useState<number | null>(null);
    const [negotiationDate, setNegotiationDate] = useState('');
    const [negotiationNote, setNegotiationNote] = useState('');

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const response = await axios.get('/api/meetings');
            setMeetings(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (meetingId: number, slot: string) => {
        if (!confirm(`Confirm meeting for ${format(parseISO(slot), 'PP p')}?`)) return;

        setActionLoading(meetingId);
        try {
            await axios.put(`/api/meetings/${meetingId}`, {
                status: 'confirmed',
                confirmed_at: slot,
                meeting_link: 'https://meet.google.com/generated-link',
            });
            fetchMeetings();
        } catch (error) {
            console.error(error);
            alert('Failed to confirm meeting');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (meetingId: number) => {
        if (!confirm('Are you sure you want to decline this request entirely?')) return;

        setActionLoading(meetingId);
        try {
            await axios.put(`/api/meetings/${meetingId}`, {
                status: 'declined',
            });
            fetchMeetings();
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const openNegotiationModal = (meetingId: number) => {
        setCurrentMeetingId(meetingId);
        setNegotiationDate('');
        setNegotiationNote('');
        setIsNegotiating(true);
    };

    const submitNegotiation = async () => {
        if (!currentMeetingId || !negotiationDate) return;

        setActionLoading(currentMeetingId);
        setIsNegotiating(false);

        try {
            await axios.put(`/api/meetings/${currentMeetingId}`, {
                status: 'pending_client',
                proposed_slots: [negotiationDate],
                latest_negotiation_note: negotiationNote
            });
            fetchMeetings();
        } catch (error) {
            console.error(error);
            alert('Failed to submit counter-proposal');
        } finally {
            setActionLoading(null);
        }
    };

    const navigateToChat = (clientId: number) => {
        // Redirect to dashboard with client_id query param
        router.visit(dashboard.url({ query: { client_id: clientId } }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-400';
            case 'pending_accountant': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
            case 'pending_client': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
            case 'declined': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
            default: return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-4 w-4" />;
            case 'phone': return <Phone className="h-4 w-4" />;
            case 'in_person': return <Users className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getTypeLabel = (type: string) => type.replace('_', ' ').toUpperCase();

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending_accountant': return 'Action Required';
            case 'pending_client': return 'Waiting for Client';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Meetings', href: '/meetings' }]}>
            <Head title="Meetings" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meetings & Calls</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your appointment schedule</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Action Required / Pending */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                Pending & Requests
                            </h3>

                            {meetings.filter(m => ['pending_accountant', 'pending_client'].includes(m.status)).length === 0 && (
                                <p className="text-slate-500 italic">No pending requests.</p>
                            )}

                            {meetings.filter(m => ['pending_accountant', 'pending_client'].includes(m.status)).map(meeting => (
                                <div key={meeting.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                {meeting.client?.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-white">{meeting.title}</h4>
                                                <p className="text-sm text-slate-500">{meeting.client?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(meeting.status)}`}>
                                                {getStatusLabel(meeting.status)}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                {getTypeIcon(meeting.type)} {getTypeLabel(meeting.type)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Meeting Details */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 mb-4 text-sm text-slate-600 dark:text-slate-300">
                                        <p className="font-medium mb-1 text-slate-900 dark:text-white">Agenda:</p>
                                        <p className="italic">{meeting.agenda || 'No agenda provided.'}</p>

                                        {meeting.latest_negotiation_note && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                <p className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3" /> Note:
                                                </p>
                                                <p className="text-slate-600 dark:text-slate-400">{meeting.latest_negotiation_note}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Area */}
                                    {meeting.status === 'pending_accountant' ? (
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proposed Times (Select to Confirm)</p>
                                            <div className="grid gap-2">
                                                {meeting.proposed_slots?.map((slot: string, idx: number) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleConfirm(meeting.id, slot)}
                                                        disabled={actionLoading === meeting.id}
                                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                                                    >
                                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                            <Calendar className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                                                            <span>{format(parseISO(slot), 'PPP p')}</span>
                                                        </div>
                                                        <span className="text-blue-600 opacity-0 group-hover:opacity-100 text-sm font-medium">Accept</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigateToChat(meeting.client_id)}
                                                    className="text-slate-600"
                                                >
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    Chat
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => openNegotiationModal(meeting.id)}
                                                >
                                                    <History className="h-4 w-4 mr-2" />
                                                    Propose New Time
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={actionLoading === meeting.id}
                                                    onClick={() => handleDecline(meeting.id)}
                                                >
                                                    Decline
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-slate-50 dark:bg-slate-900/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                            <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">Waiting for Client</p>
                                            <p className="text-xs text-slate-500 mt-1">You proposed a new time. Waiting for confirmation.</p>
                                            <div className="mt-3 flex justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigateToChat(meeting.client_id)}
                                                >
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    Chat
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Confirmed Schedule */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                Scheduled Meetings
                            </h3>
                            {meetings.filter(m => m.status === 'confirmed').length === 0 && (
                                <p className="text-slate-500 italic">No scheduled meetings.</p>
                            )}
                            {meetings.filter(m => m.status === 'confirmed').map(meeting => (
                                <div key={meeting.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">{meeting.title}</h4>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(meeting.status)}`}>
                                            Confirmed
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 mb-4">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium">{format(parseISO(meeting.confirmed_at), 'PPP p')}</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                            {meeting.client?.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">with {meeting.client?.name}</p>
                                            <div className="flex gap-2 mt-1">
                                                <button onClick={() => navigateToChat(meeting.client_id)} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3" /> Message
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {meeting.meeting_link && (
                                        <a
                                            href={meeting.meeting_link}
                                            target="_blank"
                                            className="mt-4 block w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Join Meeting
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Negotiation Modal */}
                <Dialog open={isNegotiating} onOpenChange={setIsNegotiating}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Propose Alternative Time</DialogTitle>
                            <DialogDescription>
                                Suggest a new time for this meeting. The client will be notified to confirm.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="datetime">New Date & Time</Label>
                                <Input
                                    id="datetime"
                                    type="datetime-local"
                                    value={negotiationDate}
                                    onChange={(e) => setNegotiationDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="note">Message (Optional)</Label>
                                <textarea
                                    id="note"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="e.g. I have a conflict then, how about this time?"
                                    value={negotiationNote}
                                    onChange={(e) => setNegotiationNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNegotiating(false)}>Cancel</Button>
                            <Button onClick={submitNegotiation} disabled={!negotiationDate}>Send Proposal</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
