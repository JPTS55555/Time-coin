import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Layouts
import { MainLayout } from './layouts/MainLayout';

// Pages
import { Login } from './pages/Login';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import { CreateRequest } from './pages/CreateRequest';
import { ChatList } from './pages/ChatList';
import { Chat } from './pages/Chat';
import { AIAssistant } from './pages/AIAssistant';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Feed />} />
              <Route path="create" element={<CreateRequest />} />
              <Route path="chats" element={<ChatList />} />
              <Route path="chats/:chatId" element={<Chat />} />
              <Route path="profile" element={<Profile />} />
              <Route path="ai" element={<AIAssistant />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
