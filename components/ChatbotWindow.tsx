
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAirtableData } from '../contexts/AirtableDataContext';
import { useAuth } from '../contexts/AuthContext';
import useAirtableMutation from '../hooks/useAirtableMutation';
import { X, Send } from 'lucide-react';
import { ChatMessage, AirtableRecord, Matter, Task, CalendarEvent } from '../types';
import MatterCard from './MatterCard';
import './Chatbot.css';

interface ChatbotWindowProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: string) => void;
}

const TypingIndicator: React.FC = () => (
    <div className="message-bubble model">
        <div className="message-content">
            <div className="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    </div>
);

const StarterPrompts: React.FC<{ onSelect: (prompt: string) => void }> = ({ onSelect }) => {
    const prompts = [
        "Create task: 'Draft affidavit' for KPLC case due tomorrow",
        "Mark task 'File submission' as Done",
        "Show me all in-progress matters",
        "Delete task 'Follow up with client'",
    ];
    return (
        <div className="starter-prompts-container">
            <div className="starter-prompts-grid">
                {prompts.map(p => (
                    <button key={p} onClick={() => onSelect(p)} className="starter-prompt-btn">
                        {p}
                    </button>
                ))}
            </div>
        </div>
    );
};


const ChatbotWindow: React.FC<ChatbotWindowProps> = ({ isOpen, onClose, onNavigate }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { currentUser } = useAuth();
    const { matters, tasks, refetchTasks, refetchEvents } = useAirtableData();
    const { createRecord, updateRecord, deleteRecord } = useAirtableMutation();

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { id: 'initial', role: 'model', content: "Hello! I'm Ross. You can ask me to create, update, or find tasks and matters for you." }
            ]);
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const addMessage = (message: Omit<ChatMessage, 'id'>) => {
        setMessages(prev => [...prev, { ...message, id: Date.now().toString() }]);
    };

    // --- Data Resolution Helpers ---
    const findMatterByName = (name: string): AirtableRecord<Matter> | null => {
        if (!name) return null;
        const lowerName = name.toLowerCase();
        return matters.find(m => 
            m.fields['Matter Name']?.toLowerCase().includes(lowerName) || 
            m.fields['File Number']?.toLowerCase().includes(lowerName)
        ) || null;
    };
    
    const findTaskByNameAndUser = (name: string, userId: string): AirtableRecord<Task>[] => {
        if (!name) return [];
        const lowerName = name.toLowerCase();
        return tasks.filter(t => 
            t.fields['Task Name']?.toLowerCase().includes(lowerName) &&
            (t.fields.Assignee?.includes(userId) || t.fields['Brief Assistant']?.includes(userId))
        );
    };

    // --- Action Handler ---
    const handleActionClick = async (actionId: string, messageId: string) => {
        const originalMessage = messages.find(m => m.id === messageId);
        if (!originalMessage || !originalMessage.actionContext) return;

        setMessages(prev => prev.filter(m => m.id !== messageId));

        if (actionId === 'cancel') {
            addMessage({ role: 'model', content: "Okay, I've cancelled the request." });
            return;
        }

        const { type, recordId, context } = originalMessage.actionContext;

        setIsLoading(true);
        try {
            if (type === 'DELETE_TASK') {
                await deleteRecord('Tasks', recordId);
                await refetchTasks({ background: true });
                addMessage({ role: 'model', content: `I've deleted the task: "${context.taskName}".` });
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            addMessage({ role: 'model', content: `I ran into an error: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSendMessage = async (prompt?: string) => {
        const query = prompt || inputValue;
        if (!query.trim() || isLoading || !currentUser) return;

        addMessage({ role: 'user', content: query });
        setInputValue('');
        setIsLoading(true);

        const instruction = `You are Ross, an AI paralegal for the user, ${currentUser.fields.Name}.
Analyze the user's request and respond with a single, valid JSON object with "intent" and "entities".

--- INTENTS & ENTITIES (Your Capabilities) ---
1. CREATE_TASK: { task_name: string, matter_name?: string, due_date?: string, priority?: "High" | "Medium" | "Low" }
2. UPDATE_TASK_STATUS: { task_name: string, new_status: "To-Do" | "In-Progress" | "Done" }
3. DELETE_TASK: { task_name: string }
4. CREATE_EVENT: { subject: string, start_time: string, end_time?: string, matter_name?: string }
5. FIND_MY_MATTERS: { matter_status?: "In-progress" | "Closed" }
6. SUMMARIZE_MATTER: { matter_name: string }
7. UNKNOWN: Use this for any request that does not fit the intents above, or if critical information is missing.

--- RULES & CONTEXT ---
- Today's date is ${new Date().toISOString()}. Use this to interpret relative dates like "tomorrow" or "next Friday".
- The current user's ID is ${currentUser.id}. When creating a task or event, if no other assignee is mentioned, you must assume it is for the current user.
- Before identifying a DELETE intent, confirm the user's request seems certain.
- Your capabilities are strictly limited to the intents listed above. Do not invent new ones. If a request is ambiguous, default to the UNKNOWN intent.

--- USER REQUEST ---
"${query}"`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const intentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash', contents: instruction, config: { responseMimeType: "application/json" }
            });
            
            const resultJson = JSON.parse(intentResponse.text);
            const { intent, entities } = resultJson;

            switch(intent) {
                case 'CREATE_TASK': {
                    const matter = entities.matter_name ? findMatterByName(entities.matter_name) : null;
                    if (entities.matter_name && !matter) {
                        addMessage({ role: 'model', content: `I couldn't find a matter matching "${entities.matter_name}". I'll create the task without linking it.` });
                    }
                    const payload: Partial<Task> = {
                        'Task Name': entities.task_name,
                        'Matter': matter ? [matter.id] : undefined,
                        'Due Date': entities.due_date,
                        'Priority': entities.priority || 'Medium',
                        'Assignee': [currentUser.id],
                        'Brief Assistant': [currentUser.id],
                        'Status': 'To-Do'
                    };
                    await createRecord('Tasks', payload);
                    await refetchTasks({ background: true });
                    addMessage({ role: 'model', content: `Done. I've created the task: "${entities.task_name}".` });
                    break;
                }
                case 'UPDATE_TASK_STATUS': {
                    const matchingTasks = findTaskByNameAndUser(entities.task_name, currentUser.id);
                    if (matchingTasks.length === 0) {
                        addMessage({ role: 'model', content: `I couldn't find an open task named "${entities.task_name}" assigned to you.`});
                    } else if (matchingTasks.length > 1) {
                        addMessage({ role: 'model', content: `I found multiple tasks named "${entities.task_name}". Can you be more specific?`});
                    } else {
                        await updateRecord('Tasks', matchingTasks[0].id, { 'Status': entities.new_status });
                        await refetchTasks({ background: true });
                        addMessage({ role: 'model', content: `Okay, I've marked "${matchingTasks[0].fields['Task Name']}" as ${entities.new_status}.`});
                    }
                    break;
                }
                 case 'DELETE_TASK': {
                    const matchingTasks = findTaskByNameAndUser(entities.task_name, currentUser.id);
                    if (matchingTasks.length === 0) {
                        addMessage({ role: 'model', content: `I couldn't find a task named "${entities.task_name}" assigned to you.`});
                    } else if (matchingTasks.length > 1) {
                        addMessage({ role: 'model', content: `I found multiple tasks named "${entities.task_name}" for you. Please clarify which one.`});
                    } else {
                        const taskToDelete = matchingTasks[0];
                        addMessage({
                            role: 'model',
                            content: `Are you sure you want to delete the task "${taskToDelete.fields['Task Name']}"?`,
                            actions: [
                                { id: 'confirm', label: 'Yes, Delete', style: 'confirm' },
                                { id: 'cancel', label: 'Cancel' }
                            ],
                            actionContext: { type: 'DELETE_TASK', recordId: taskToDelete.id, context: { taskName: taskToDelete.fields['Task Name'] } }
                        });
                    }
                    break;
                }
                case 'CREATE_EVENT': {
                    const matter = entities.matter_name ? findMatterByName(entities.matter_name) : null;
                     if (entities.matter_name && !matter) {
                        addMessage({ role: 'model', content: `I couldn't find a matter matching "${entities.matter_name}", so I can't create the event.` });
                        break;
                    }
                    const payload: Partial<CalendarEvent> = {
                        'Subject': entities.subject,
                        'Start Time': entities.start_time,
                        'End Time': entities.end_time,
                        'Matter': matter ? [matter.id] : undefined,
                        'Assignee': [currentUser.id],
                        'Brief Assistant': [currentUser.id],
                        'Type': 'Misc'
                    };
                    await createRecord('Events', payload);
                    await refetchEvents({ background: true });
                    addMessage({ role: 'model', content: `I've scheduled the event: "${entities.subject}".` });
                    break;
                }
                case 'FIND_MY_MATTERS': {
                    const statusFilter = entities.matter_status || 'In-progress';
                    const myMatters = matters.filter(m => 
                        m.fields['Brief Assistant']?.includes(currentUser.id) &&
                        m.fields['Case Status'] === statusFilter
                    );

                    if (myMatters.length === 0) {
                        addMessage({ role: 'model', content: `You have no ${statusFilter.toLowerCase()} matters.` });
                    } else {
                        addMessage({ role: 'model', content: `Here are your ${statusFilter.toLowerCase()} matters:` });
                        myMatters.forEach(matter => {
                            addMessage({
                                role: 'model',
                                content: <MatterCard matter={matter} onClick={() => { onNavigate(`MatterDetail/${matter.id}`); onClose(); }} />
                            });
                        });
                    }
                    break;
                }
                default:
                    addMessage({ role: 'model', content: "I can help you create, update, or find tasks and matters. How can I assist?" });
            }
        } catch (error) {
            console.error("Chatbot error:", error);
            addMessage({ role: 'model', content: "I'm having trouble processing that request. Please try rephrasing it." });
        } finally {
            setIsLoading(false);
        }
    };
    

    return (
        <div className={`chatbot-window-container ${isOpen ? 'is-open' : ''}`}>
            <header className="chatbot-header">
                <h2 className="chatbot-title">Ross AI</h2>
                <button onClick={onClose} className="chatbot-close-btn" aria-label="Close chat">
                    <X className="w-6 h-6" />
                </button>
            </header>
            <div className="chatbot-messages" ref={messagesEndRef}>
                {messages.map(msg => (
                    <div key={msg.id} className={`message-bubble ${msg.role}`}>
                        <div className={`message-content ${typeof msg.content !== 'string' ? 'chatbot-rich-response' : ''}`}>
                            {msg.content}
                        </div>
                         {msg.actions && (
                            <div className="message-actions">
                                {msg.actions.map(action => (
                                    <button 
                                        key={action.id} 
                                        onClick={() => handleActionClick(action.id, msg.id)}
                                        className={`action-btn ${action.style || ''}`}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && <TypingIndicator />}
                 {messages.length <= 1 && !isLoading && <StarterPrompts onSelect={handleSendMessage} />}
            </div>
            <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="chatbot-input-form"
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask Ross anything..."
                    className="chatbot-input"
                    disabled={isLoading}
                />
                <button type="submit" className="chatbot-send-btn" disabled={!inputValue.trim() || isLoading}>
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatbotWindow;
