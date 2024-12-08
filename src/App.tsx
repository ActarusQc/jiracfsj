import React, { useState } from 'react';
import { KanbanBoard } from './components/KanbanBoard';
import { Layout, Settings as SettingsIcon, Plus, LayoutGrid, Calendar } from 'lucide-react';
import { NotificationToast } from './components/NotificationToast';
import { SearchBar } from './components/SearchBar';
import { Settings } from './components/Settings';
import { ProjectForm } from './components/ProjectForm';
import { ProjectList } from './components/ProjectList';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'board'>('timeline');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Layout className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                Gestionnaire de Projets
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-96">
                <SearchBar />
              </div>
              {!showProjects && !showSettings && (
                <button
                  onClick={() => setViewMode(viewMode === 'timeline' ? 'board' : 'timeline')}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  {viewMode === 'timeline' ? (
                    <>
                      <LayoutGrid className="w-4 h-4" />
                      Vue tableau
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Vue calendrier
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowProjects(!showProjects)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                {showProjects ? 'Voir le tableau' : 'Voir les projets'}
              </button>
              <button
                onClick={() => setShowProjectForm(true)}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Nouveau projet
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                title="Paramètres"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full py-8">
          {showSettings ? (
            <Settings />
          ) : showProjects ? (
            <ProjectList />
          ) : (
            <KanbanBoard viewMode={viewMode} />
          )}
        </div>
      </main>
      {showProjectForm && <ProjectForm onClose={() => setShowProjectForm(false)} />}
      <NotificationToast />
    </div>
  );
}

export default App;