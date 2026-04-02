import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send } from 'lucide-react';

export function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !chatId) return;

    // Fetch chat details to get other user info
    const fetchChatDetails = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          const otherUserId = data.participants.find((id: string) => id !== user.uid);
          if (otherUserId) {
            const userSnap = await getDoc(doc(db, 'users', otherUserId));
            if (userSnap.exists()) {
              setOtherUser(userSnap.data());
            }
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `chats/${chatId}`);
      }
    };

    fetchChatDetails();

    // Listen to messages
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      // Add message
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        chatId,
        senderUid: user.uid,
        text,
        createdAt: serverTimestamp()
      });

      // Update chat last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white p-4 border-b border-gray-100 flex items-center shadow-sm z-10 sticky top-0">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        {otherUser && (
          <div className="flex items-center">
            <img 
              src={otherUser.photoURL || `https://ui-avatars.com/api/?name=${otherUser.displayName}&background=random`} 
              alt={otherUser.displayName}
              className="w-10 h-10 rounded-full object-cover border border-gray-100"
              referrerPolicy="no-referrer"
            />
            <h2 className="ml-3 font-semibold text-gray-900">{otherUser.displayName}</h2>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderUid === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 p-1">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-4 py-2 outline-none text-sm"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-gray-400"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
