import React from 'react';
import { AppView } from '../types';
import { FiSettings, FiUsers, FiHome, FiFileText, FiGrid, FiLayers, FiChevronDown, FiChevronRight, FiDatabase, FiPackage } from 'react-icons/fi';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(
    currentView.startsWith('settings')
  );

  React.useEffect(() => {
    if (currentView.startsWith('settings')) setSettingsOpen(true);
  }, [currentView]);

  return (
    <div className="w-64 bg-krone-800 border-r border-krone-700 flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-krone-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center font-bold text-krone-900 text-lg">
            K
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">KRONE</h1>
            <p className="text-xs text-krone-300">Gestion Commerciale</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`nav-item w-full flex items-center gap-3 px-5 py-3 text-sm ${
            currentView === 'dashboard' ? 'active' : 'text-krone-200'
          }`}
        >
          <FiHome size={18} />
          <span>Tableau de bord</span>
        </button>

        {/* Settings Section */}
        <div className="mt-2">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm text-krone-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <FiSettings size={18} />
              <span className="font-medium">Paramètres</span>
            </div>
            {settingsOpen ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>

          {settingsOpen && (
            <div className="ml-4 animate-fade-in">
              <button
                onClick={() => onNavigate('settings-variables')}
                className={`nav-item w-full flex items-center gap-3 px-5 py-2.5 text-sm ${
                  currentView === 'settings-variables' ? 'active' : 'text-krone-300'
                }`}
              >
                <FiGrid size={15} />
                <span>Gestion des variables</span>
              </button>
              <button
                onClick={() => onNavigate('settings-page-garde')}
                className={`nav-item w-full flex items-center gap-3 px-5 py-2.5 text-sm ${
                  currentView === 'settings-page-garde' ? 'active' : 'text-krone-300'
                }`}
              >
                <FiLayers size={15} />
                <span>Page de garde</span>
              </button>
              <button
                onClick={() => onNavigate('settings-fichiers')}
                className={`nav-item w-full flex items-center gap-3 px-5 py-2.5 text-sm ${
                  currentView.startsWith('settings-fichiers') ? 'active' : 'text-krone-300'
                }`}
              >
                <FiFileText size={15} />
                <span>Gestion des fichiers</span>
              </button>
              <button
                onClick={() => onNavigate('settings-marchandise')}
                className={`nav-item w-full flex items-center gap-3 px-5 py-2.5 text-sm ${
                  currentView === 'settings-marchandise' ? 'active' : 'text-krone-300'
                }`}
              >
                <FiPackage size={15} />
                <span>Gestion marchandise</span>
              </button>
              <button
                onClick={() => onNavigate('settings-configuration')}
                className={`nav-item w-full flex items-center gap-3 px-5 py-2.5 text-sm ${
                  currentView === 'settings-configuration' ? 'active' : 'text-krone-300'
                }`}
              >
                <FiDatabase size={15} />
                <span>Configuration</span>
              </button>
            </div>
          )}
        </div>

        {/* Clients */}
        <div className="mt-2">
          <button
            onClick={() => onNavigate('clients')}
            className={`nav-item w-full flex items-center gap-3 px-5 py-3 text-sm ${
              currentView === 'clients' || currentView === 'client-detail' || 
              currentView === 'expedition-detail' || currentView === 'expedition-page-garde' ||
              currentView === 'expedition-generate'
                ? 'active' : 'text-krone-200'
            }`}
          >
            <FiUsers size={18} />
            <span>Clients</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-krone-700">
        <p className="text-xs text-krone-400 text-center">Krone v4.2</p>
      </div>
    </div>
  );
}
