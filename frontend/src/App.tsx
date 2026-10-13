import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetails } from './pages/ProjectDetails';

export const App: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('Llama 3.2 11B (NVIDIA NIM)');
  const [activeView, setActiveView] = useState('home');
  const [newThreadTrigger, setNewThreadTrigger] = useState(0);

  // Global Search Modal State
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNewThread = () => {
    setNewThreadTrigger((prev) => prev + 1);
    setActiveView('home');
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  return (
    <Router>
      {/* 100% FULL SCREEN Viewport without outer margins or double scrollbars */}
      <div className="w-screen h-screen min-h-screen bg-white flex overflow-hidden font-sans antialiased selection:bg-purple-200 selection:text-purple-900">
        {/* Vertical Left Navigation Sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onNewThread={handleNewThread}
        />

        {/* Main Viewport Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          {/* Top Header Bar */}
          <Navbar
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onNewThread={handleNewThread}
            onSearchClick={() => setSearchOpen(true)}
          />

          {/* Main View Content */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    selectedModel={selectedModel}
                    activeView={activeView}
                    setActiveView={setActiveView}
                    searchOpen={searchOpen}
                    setSearchOpen={setSearchOpen}
                    key={newThreadTrigger}
                  />
                }
              />
              <Route path="/create" element={<CreateProject />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
