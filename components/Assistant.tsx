import React, { useState, useRef, useEffect } from 'react';
import { askAssistant } from '../services/geminiService';
import { Product, Transaction } from '../types';
import { Send, MessageSquare, Bot, User, Loader2 } from 'lucide-react';

interface AssistantProps {
    products: Product[];
    transactions: Transaction[];
}

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

export const Assistant: React.FC<AssistantProps> = ({ products, transactions }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', text: 'Olá! Sou o assistente virtual da Ecclesia. Posso ajudar com insights sobre vendas, estoque ou sugestões para eventos. O que você gostaria de saber?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        // Prepare context
        const context = `
            Resumo do Estoque: ${products.map(p => `${p.name} (${p.stock} un)`).join(', ')}.
            Últimas Vendas: Total de ${transactions.length} transações somando R$ ${transactions.reduce((a,b) => a + b.total, 0).toFixed(2)}.
            Produtos mais vendidos recentemente: ${transactions.slice(0, 5).flatMap(t => t.items).map(i => i.name).join(', ')}.
        `;

        const response = await askAssistant(userMsg, context);
        
        setMessages(prev => [...prev, { role: 'assistant', text: response || 'Desculpe, não consegui processar sua solicitação.' }]);
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <Bot size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Assistente Inteligente</h3>
                    <p className="text-xs text-slate-500">Pergunte sobre vendas e estoque</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-slate-800 text-white rounded-tr-none' 
                                : 'bg-slate-100 text-slate-700 rounded-tl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Bot size={14} />
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-500 text-sm">
                            <Loader2 size={14} className="animate-spin" /> Pensando...
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                    <input 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua pergunta..."
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-200"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
