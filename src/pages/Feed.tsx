import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, X, Check, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AdBanner } from '../components/AdBanner';

export function Feed() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

  const visibleRequests = requests.filter(req => !dismissedIds.has(req.id));
  const currentRequest = visibleRequests[0];

  const handleMatch = async (request: any, accepted: boolean) => {
    if (!accepted) {
      setDismissedIds(prev => new Set(prev).add(request.id));
      return;
    }

    if (!user || !profile) return;

    try {
      const requesterUid = request.type === 'request' ? request.authorUid : user.uid;
      
      if (requesterUid === user.uid && (profile.credits || 0) < 1) {
        alert("You need at least 1 TimeCoin to accept an offer. Watch an ad on your profile to earn one!");
        return;
      }
      
      if (request.type === 'request') {
        const authorSnap = await getDoc(doc(db, 'users', request.authorUid));
        const authorData = authorSnap.data() as any;
        if ((authorData?.credits || 0) < 1) {
          alert("This user no longer has enough TimeCoins for this request.");
          setDismissedIds(prev => new Set(prev).add(request.id));
          return;
        }
      }

      await updateDoc(doc(db, 'requests', request.id), {
        status: 'matched',
        matchedWithUid: user.uid
      });

      const chatId = `${request.id}_${user.uid}`;
      await setDoc(doc(db, 'chats', chatId), {
        requestId: request.id,
        participants: [request.authorUid, user.uid],
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      navigate(`/chats/${chatId}`);
    } catch (error: any) {
      console.error("Match error:", error);
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
        alert("Oops! This request is no longer available or was already taken.");
        setDismissedIds(prev => new Set(prev).add(request.id));
      } else {
        alert("An error occurred while matching. Please try again.");
      }
    }
  };

  const handleShare = async () => {
    if (!currentRequest) return;
    const shareData = {
      title: `TimeCoin: ${currentRequest.title}`,
      text: `Can you help with this? "${currentRequest.title}" in exchange for TimeCoins!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log('Share failed', err); }
    } else {
      alert('Share this link to invite friends: ' + window.location.href);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading nearby requests...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-indigo-600">TimeCoin</h1>
        <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => navigate('/profile')}>
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
            <p className="text-gray-500 text-sm mb-6">Invite friends to your neighborhood to get more matches!</p>
            <button 
              onClick={() => navigate('/create')}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors mb-4"
            >
              Post an Offer
            </button>
            <AdBanner format="rectangle" />
          </div>
        ) : (
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[70vh]">
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

            <div className="p-4 bg-gray-50 flex justify-center items-center space-x-4">
              <button 
                onClick={() => handleMatch(currentRequest, false)}
                className="w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors border border-gray-100"
              >
                <X size={28} />
              </button>
              <button 
                onClick={handleShare}
                className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors border border-gray-100"
              >
                <Share2 size={24} />
              </button>
              <button 
                onClick={() => handleMatch(currentRequest, true)}
                className="w-14 h-14 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-colors"
              >
                <Check size={28} />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Global Ad Banner at the bottom of the feed */}
      <div className="px-4 pb-4">
        <AdBanner format="banner" />
      </div>
    </div>
  );
}
