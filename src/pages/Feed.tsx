import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ThumbsUp, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Feed() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'requests'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter((req: any) => req.authorUid !== user.uid); // Don't show own requests
      setRequests(reqs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'requests');
    });

    return () => unsubscribe();
  }, [user]);

  const handleMatch = async (request: any, accepted: boolean) => {
    if (!accepted) {
      setCurrentIndex(prev => prev + 1);
      return;
    }

    if (!user) return;

    try {
      // 1. Update request status
      await updateDoc(doc(db, 'requests', request.id), {
        status: 'matched',
        matchedWithUid: user.uid
      });

      // 2. Create a chat
      const chatId = `${request.id}_${user.uid}`;
      await setDoc(doc(db, 'chats', chatId), {
        requestId: request.id,
        participants: [request.authorUid, user.uid],
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      navigate(`/chats/${chatId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requests/${request.id}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading nearby requests...</div>;

  const currentRequest = requests[currentIndex];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-indigo-600">TimeCoin</h1>
        <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1 rounded-full">
          <Clock size={16} className="text-indigo-600" />
          <span className="font-semibold text-indigo-700">{profile?.credits || 0}</span>
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col items-center justify-center relative overflow-hidden">
        {!currentRequest ? (
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-gray-400" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No more requests nearby</h2>
            <p className="text-gray-500 text-sm">Check back later or post your own offer to earn credits!</p>
            <button 
              onClick={() => navigate('/create')}
              className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors"
            >
              Post an Offer
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[70vh]">
            {/* Card Header */}
            <div className={`p-4 text-white font-medium flex justify-between items-center ${
              currentRequest.type === 'offer' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}>
              <span className="uppercase tracking-wider text-xs font-bold">
                {currentRequest.type === 'offer' ? 'Offering' : 'Requesting'}
              </span>
              <span className="text-xs opacity-90">
                {currentRequest.createdAt?.toDate ? formatDistanceToNow(currentRequest.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
              </span>
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center space-x-4 mb-6">
                <img 
                  src={currentRequest.authorPhoto || `https://ui-avatars.com/api/?name=${currentRequest.authorName}&background=random`} 
                  alt={currentRequest.authorName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{currentRequest.authorName}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin size={14} className="mr-1" />
                    <span>Nearby (1.2 km)</span>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4">{currentRequest.title}</h2>
              <p className="text-gray-600 flex-1 overflow-y-auto">{currentRequest.description}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>Cost: 1 TimeCoin</span>
                <span>Duration: ~1 hour</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 flex justify-center space-x-6">
              <button 
                onClick={() => handleMatch(currentRequest, false)}
                className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors border border-gray-100"
              >
                <X size={32} />
              </button>
              <button 
                onClick={() => handleMatch(currentRequest, true)}
                className="w-16 h-16 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-colors"
              >
                <Check size={32} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
