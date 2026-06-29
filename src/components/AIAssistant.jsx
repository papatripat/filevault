import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, X, MessageSquare, Loader2, Trash2 } from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hello! I am your FileVault AI Assistant. How can I help you manage your files today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // We don't strictly need to pass history back and forth if backend is stateful, 
  // but since we made a stateless backend, let's keep history in frontend to pass.
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Send to backend
      const res = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history })
      });

      if (!res.ok) throw new Error('Failed to communicate with AI');
      
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: data.text,
        actions: data.actions 
      }]);
      setHistory(data.history);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmDeletion = async (paths) => {
    const confirm = window.confirm(`Are you sure you want to delete ${paths.length} file(s)?`);
    if (!confirm) return;

    let successCount = 0;
    for (const path of paths) {
      try {
        const res = await fetch('http://localhost:3001/api/files/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
        });
        if (res.ok) successCount++;
      } catch (e) {
        console.error('Delete error', e);
      }
    }
    
    setMessages(prev => [...prev, { role: 'model', text: `Successfully deleted ${successCount} out of ${paths.length} files.` }]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className="ai-fab"
        onClick={() => setIsOpen(!isOpen)}
        title="Open AI Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <Bot size={20} />
            <span style={{ fontWeight: 600 }}>FileVault AI Assistant</span>
          </div>
          
          <div className="ai-chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-message-row ${msg.role === 'user' ? 'user' : 'model'}`}>
                <div className="ai-avatar">
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="ai-message-content">
                  <div className="ai-message-bubble">
                    {msg.text}
                  </div>
                  {msg.actions?.map((action, i) => {
                    if (action.type === 'deletion_proposal') {
                      return (
                        <div key={i} className="ai-action-card">
                          <div style={{ fontSize: 12, marginBottom: 8, color: 'var(--text-secondary)' }}>
                            {action.reason || 'Proposed for deletion:'}
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, marginBottom: 8 }}>
                            {action.paths.map((p, j) => <li key={j}>{p}</li>)}
                          </ul>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => handleConfirmDeletion(action.paths)}
                          >
                            <Trash2 size={12} /> Confirm Deletion
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message-row model">
                <div className="ai-avatar"><Bot size={16} /></div>
                <div className="ai-message-content">
                  <div className="ai-message-bubble"><Loader2 size={16} className="spin" /> Thinking...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-input-area">
            <textarea 
              className="ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to find or manage files..."
              rows={1}
            />
            <button className="btn-icon primary" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
