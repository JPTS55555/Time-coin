import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout, db, handleFirestoreError, OperationType } from '../firebase';
import { LogOut, Star, Clock, MapPin, Share2, PlaySquare } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { AdBanner } from '../components/AdBanner';

export function Profile() {
  const { user, profile } = useAuth();
  const [watchingAd, setWatchingAd] = useState(false);

  if (!profile || !user) return null;

  const handleWatchAd = async () => {
    setWatchingAd(true);
    // Simulate watching an ad for 3 seconds
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          credits: (profile.credits || 0) + 1
        });
        alert("Thanks for watching! You earned 1 TimeCoin.");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      } finally {
        setWatchingAd(false);
      }
    }, 3000);
  };

  const handleInvite = async () => {
    const shareData = {
      title: 'Join TimeCoin',
      text: 'Join me on TimeCoin and let\'s exchange skills for free!',
      url: window.location.origin,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log('Share failed', err); }
    } else {
      alert('Share this link: ' + window.location.origin);
    }
  };

  return (
    <div className="bg-gray-50 min-h-full pb-8">
      {/* Header */}
      <div className="bg-indigo-600 pt-12 pb-24 px-6 rounded-b-3xl relative">
        <div className="flex justify-between items-center text-white mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button onClick={logout} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <LogOut size={20} />
          </button>
        </div>
        
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <img 
            src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=random`} 
            alt={profile.displayName}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Body */}
      <div className="pt-20 px-6 pb-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{profile.displayName}</h2>
          <div className="flex items-center justify-center text-gray-500 mt-1 space-x-1">
            <MapPin size={16} />
            <span>Lisbon, Portugal</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-2 text-indigo-600">
              <Clock size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{profile.credits}</span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">TimeCoins</span>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-2 text-amber-500">
              <Star size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{profile.rating || 'New'}</span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Rating</span>
          </div>
        </div>

        {/* Monetization & Growth Actions */}
        <div className="space-y-3 mb-8">
          <button 
            onClick={handleWatchAd}
            disabled={watchingAd}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <div className="flex items-center space-x-3">
              <PlaySquare size={24} />
              <div className="text-left">
                <div className="font-bold">{watchingAd ? 'Watching Ad...' : 'Watch Ad to Earn'}</div>
                <div className="text-xs text-emerald-100">Get +1 TimeCoin instantly</div>
              </div>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">+1</div>
          </button>

          <button 
            onClick={handleInvite}
            className="w-full bg-white border-2 border-indigo-100 text-indigo-600 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:bg-indigo-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Share2 size={24} />
              <div className="text-left">
                <div className="font-bold">Invite Friends</div>
                <div className="text-xs text-indigo-400">Grow your local network</div>
              </div>
            </div>
          </button>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">I can offer</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skillsOffered?.length ? (
              profile.skillsOffered.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm italic">No skills added yet.</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">I need help with</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skillsNeeded?.length ? (
              profile.skillsNeeded.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100">
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm italic">No needs added yet.</span>
            )}
          </div>
        </div>

        {/* Ad Placeholder */}
        <AdBanner format="banner" />
      </div>
    </div>
  );
}
