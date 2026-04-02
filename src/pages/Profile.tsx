import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../firebase';
import { LogOut, Star, Clock, MapPin, Settings } from 'lucide-react';

export function Profile() {
  const { user, profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="bg-gray-50 min-h-full">
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
        <div className="grid grid-cols-2 gap-4 mb-8">
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
            <button className="px-3 py-1 border border-dashed border-gray-300 text-gray-500 rounded-full text-sm font-medium hover:bg-gray-50">
              + Add Skill
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
            <button className="px-3 py-1 border border-dashed border-gray-300 text-gray-500 rounded-full text-sm font-medium hover:bg-gray-50">
              + Add Need
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
