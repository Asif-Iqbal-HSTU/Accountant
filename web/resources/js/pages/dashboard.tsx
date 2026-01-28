import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { useState, useEffect } from 'react';

// Use the globally configured axios instance (typically set up in bootstrap.ts/js)
// If typescript complains, we can cast or just use window.axios if configured.
// For now, let's stick to import but ensure we're not missing config.
// actually, if we use window.axios it is better for Sanctum SPA.
// Let's use standard import but usually we need 'withCredentials'.
import axios from 'axios';
axios.defaults.withCredentials = true; // Ensure cookies are sent


export default function Dashboard({ clients = [] }: { clients?: any[] }) {
    const user = usePage().props.auth.user;
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (selectedClient) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedClient]);

    const fetchMessages = async () => {
        if (!selectedClient) return;
        try {
            const response = await axios.get(`/api/messages/${selectedClient.id}`);
            setMessages(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const sendMessage = async (e: any) => {
        e.preventDefault();
        if (!newMessage || !selectedClient) return;

        try {
            await axios.post('/api/messages', {
                receiver_id: selectedClient.id,
                content: newMessage
            });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: dashboard().url }]}>
            <Head title="Dashboard" />
            <div className="flex h-[calc(100vh-65px)] p-4 gap-4">
                {/* Client List */}
                <div className="w-1/3 bg-white dark:bg-zinc-800 rounded-xl border border-sidebar-border/70 dark:border-sidebar-border shadow-sm p-4 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Clients</h2>

                    {user.role === 'accountant' && (
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 mb-4 border rounded-lg dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    )}

                    {user.role === 'client' ? (
                        <p>Search accountants on your mobile app.</p>
                    ) : (
                        <ul className="space-y-2">
                            {filteredClients.map(client => (
                                <li
                                    key={client.id}
                                    onClick={() => setSelectedClient(client)}
                                    className={`p-3 rounded cursor-pointer transition-colors ${selectedClient?.id === client.id ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-zinc-700/50'}`}
                                >
                                    <div className="font-bold">{client.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{client.email}</div>
                                </li>
                            ))}
                            {clients.length === 0 && <p className="text-gray-500">No clients found.</p>}
                        </ul>
                    )}
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white dark:bg-zinc-800 rounded-xl border border-sidebar-border/70 dark:border-sidebar-border shadow-sm p-4 flex flex-col">
                    {selectedClient ? (
                        <>
                            <div className="border-b dark:border-zinc-700 pb-2 mb-4">
                                <h2 className="text-xl font-bold">Chat with {selectedClient.name}</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 rounded-lg max-w-xs ${msg.sender_id === user.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-zinc-700'}`}>
                                            <p>{msg.content}</p>
                                            <span className={`text-[10px] block mt-1 ${msg.sender_id === user.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={sendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 p-2 border rounded-lg dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Send</button>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Select a client to start chatting
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
