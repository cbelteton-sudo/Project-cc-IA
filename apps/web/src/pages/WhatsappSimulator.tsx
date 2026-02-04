import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare, Bot } from 'lucide-react';

export const WhatsappSimulator = () => {
    const { token } = useAuth();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ text: string, isBot: boolean }[]>([
        { text: "Hello! I am the Construction Bot. Send me a message to create a request.", isBot: true }
    ]);

    const mutation = useMutation({
        mutationFn: async (text: string) => {
            return axios.post('http://localhost:4180/whatsapp/webhook', {
                text,
                sender: '+15550123456',
                // Optional: projectId can be omitted to test auto-detection
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: (data) => {
            setMessages(prev => [
                ...prev,
                { text: `✅ ${data.data.message} (Ticket: ${data.data.ticketId})`, isBot: true }
            ]);
        },
        onError: () => {
            setMessages(prev => [...prev, { text: "❌ Error processing request.", isBot: true }]);
        }
    });

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { text: input, isBot: false }]);
        mutation.mutate(input);
        setInput('');
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-[#075E54] p-4 text-white flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                    <MessageSquare size={20} />
                </div>
                <div>
                    <h2 className="font-bold">WhatsApp Simulator</h2>
                    <p className="text-xs opacity-80">Online</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="h-[500px] bg-[#E5DDD5] p-4 overflow-y-auto space-y-3 flex flex-col">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`max-w-[80%] p-3 rounded-lg text-sm shadow-sm ${msg.isBot
                                ? 'bg-white self-start rounded-tl-none'
                                : 'bg-[#DCF8C6] self-end rounded-tr-none'
                            }`}
                    >
                        {msg.text}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#F0F0F0] flex gap-2">
                <input
                    type="text"
                    className="flex-1 bg-white rounded-full px-4 py-2 text-sm focus:outline-none"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                    onClick={handleSend}
                    disabled={mutation.isPending}
                    className="bg-[#075E54] text-white p-2 rounded-full hover:bg-[#128C7E] disabled:opacity-50"
                >
                    <Send size={20} />
                </button>
            </div>

            <div className="bg-yellow-50 p-2 text-xs text-center text-yellow-700 border-t border-yellow-100">
                Try: "Need 50 bags of cement for PRJ-001"
            </div>
        </div>
    );
};
