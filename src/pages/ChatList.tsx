import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const chatsData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data();
          const otherUserId = data.participants.find((id: string) => id !== user.uid);
          
          let otherUser = { displayName: 'Unknown User', photoURL: '' };
          if (otherUserId) {
            const userSnap = await getDoc(doc(db, 'users', otherUserId));
            if (userSnap.exists()) {
              otherUser = userSnap.data() as any;
            }
          }

          return {
            id: chatDoc.id,
            ...data,
            otherUser
          };
        }));
        
        setChats(chatsData);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
      } finally {
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading chats...</div>;

  return (
    <div className="bg-white min-h-full">
      <header className="p-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      </header>

      <div className="divide-y divide-gray-50">
        {chats.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
              <MessageCircle size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
            <p className="text-gray-500 text-sm">Match with someone on the feed to start chatting!</p>
          </div>
        ) : (
          chats.map(chat => (
            <Link 
              key={chat.id} 
              to={`/chats/${chat.id}`}
              className="flex items-center p-4 hover:bg-gray-50 transition-colors"
            >
              <img 
                src={chat.otherUser.photoURL || `https://ui-avatars.com/api/?name=${chat.otherUser.displayName}&background=random`} 
                alt={chat.otherUser.displayName}
                className="w-14 h-14 rounded-full object-cover border border-gray-100"
                referrerPolicy="no-referrer"
              />
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{chat.otherUser.displayName}</h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {chat.updatedAt?.toDate ? formatDistanceToNow(chat.updatedAt.toDate(), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {chat.lastMessage || 'Start the conversation!'}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
