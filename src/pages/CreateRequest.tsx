import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Send } from 'lucide-react';

export function CreateRequest() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<'offer' | 'request'>('request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'requests'), {
        authorUid: user.uid,
        authorName: profile.displayName,
        authorPhoto: profile.photoURL,
        title: title.trim(),
        description: description.trim(),
        type,
        status: 'open',
        createdAt: serverTimestamp()
      });
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white min-h-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a Micro-Skill</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Selector */}
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType('request')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === 'request' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'
            }`}
          >
            I Need Help
          </button>
          <button
            type="button"
            onClick={() => setType('offer')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              type === 'offer' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'
            }`}
          >
            I Can Offer
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'request' ? "e.g., Help assembling an IKEA desk" : "e.g., I can teach you basic Spanish"}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you need or what you offer. Be specific about the time required (usually 1 hour)."
            className="w-full p-3 border border-gray-300 rounded-xl h-32 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            maxLength={1000}
            required
          />
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl flex items-start space-x-3">
          <div className="text-indigo-500 mt-0.5">ℹ️</div>
          <p className="text-sm text-indigo-800">
            {type === 'request' 
              ? "When someone accepts this, 1 TimeCoin will be held in escrow until the task is completed."
              : "When you complete this task for someone, you will earn 1 TimeCoin."}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim() || !description.trim()}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <span>Post to Local Feed</span>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
