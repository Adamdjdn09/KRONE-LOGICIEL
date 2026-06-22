import { useState, useEffect } from 'react';
import { FiFolder, FiDownload, FiUpload, FiSave, FiCheck, FiAlertCircle, FiDatabase, FiHardDrive, FiRefreshCw } from 'react-icons/fi';
import { getStorageInfo } from '../store';

interface Props {
  onExportData: () => string;
  onImportData: (data: string) => boolean;
}

export default function ConfigurationPanel({ onExportData, onImportData }: Props) {
  const [storagePath, setStoragePath] = useState<string>('');
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [storageSize, setStorageSize] = useState<string>('0 KB');
  const [storageBreakdown, setStorageBreakdown] = useState<{ label: string; size: string; count: number }[]>([]);

  useEffect(() => {
    const savedPath = localStorage.getItem('krone_storage_path') || 'Stockage local (navigateur)';
    const savedAutoSave = localStorage.getItem('krone_auto_save') !== 'false';
    const savedInterval = parseInt(localStorage.getItem('krone_auto_save_interval') || '30');
    const savedLastSaved = localStorage.getItem('krone_last_saved');
    
    setStoragePath(savedPath);
    setAutoSave(savedAutoSave);
    setAutoSaveInterval(savedInterval);
    setLastSaved(savedLastSaved);

    const info = getStorageInfo();
    setStorageSize(info.totalSize);
    setStorageBreakdown(info.breakdown);
  }, []);



  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = async () => {
    try {
      const data = onExportData();
      const blob = new Blob([data], { type: 'application/json' });
      
      // Try to use File System Access API
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: `krone_backup_${new Date().toISOString().split('T')[0]}.json`,
            types: [{
              description: 'Fichier JSON',
              accept: { 'application/json': ['.json'] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          setStoragePath(handle.name);
          localStorage.setItem('krone_storage_path', handle.name);
          showMessage('success', 'Données exportées avec succès !');
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            fallbackDownload(blob);
          }
        }
      } else {
        fallbackDownload(blob);
      }
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'exportation');
    }
  };

  const fallbackDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krone_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('success', 'Données exportées avec succès !');
  };

  const handleImport = async () => {
    try {
      // Try to use File System Access API
      if ('showOpenFilePicker' in window) {
        try {
          const [handle] = await (window as any).showOpenFilePicker({
            types: [{
              description: 'Fichier JSON',
              accept: { 'application/json': ['.json'] },
            }],
          });
          const file = await handle.getFile();
          const text = await file.text();
          
          if (onImportData(text)) {
            setStoragePath(handle.name);
            localStorage.setItem('krone_storage_path', handle.name);
            showMessage('success', 'Données importées avec succès !');
            setTimeout(() => window.location.reload(), 1000);
          } else {
            showMessage('error', 'Fichier invalide');
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            fallbackImport();
          }
        }
      } else {
        fallbackImport();
      }
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'importation');
    }
  };

  const fallbackImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        if (onImportData(text)) {
          showMessage('success', 'Données importées avec succès !');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showMessage('error', 'Fichier invalide');
        }
      }
    };
    input.click();
  };

  const handleChooseFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        setStoragePath(handle.name);
        localStorage.setItem('krone_storage_path', handle.name);
        showMessage('success', `Dossier sélectionné: ${handle.name}`);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          showMessage('error', 'Impossible de sélectionner le dossier');
        }
      }
    } else {
      showMessage('error', 'Cette fonctionnalité nécessite un navigateur moderne (Chrome, Edge)');
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('krone_auto_save', String(autoSave));
    localStorage.setItem('krone_auto_save_interval', String(autoSaveInterval));
    const now = new Date().toISOString();
    localStorage.setItem('krone_last_saved', now);
    setLastSaved(now);
    showMessage('success', 'Paramètres sauvegardés');
  };

  const handleClearData = () => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les données ? Cette action est irréversible !')) {
      if (confirm('Dernière confirmation: Toutes vos données (clients, templates, configurations) seront supprimées définitivement.')) {
        for (const key in localStorage) {
          if (key.startsWith('krone_')) {
            localStorage.removeItem(key);
          }
        }
        showMessage('success', 'Toutes les données ont été supprimées');
        setTimeout(() => window.location.reload(), 1500);
      }
    }
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Configuration</h1>
        <p className="text-krone-300 text-sm">Gérez le stockage de vos données et les paramètres de l'application</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-fade-in ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.type === 'success' ? <FiCheck size={18} /> : <FiAlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Section */}
        <div className="bg-krone-800 rounded-xl border border-krone-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FiHardDrive size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Stockage des données</h2>
              <p className="text-xs text-krone-400">Emplacement et sauvegarde</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-krone-300 mb-2">Emplacement actuel</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={storagePath}
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-krone-700 border border-krone-600 rounded-lg text-white text-sm"
                />
                <button
                  onClick={handleChooseFolder}
                  className="px-4 py-2.5 bg-krone-600 hover:bg-krone-500 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
                >
                  <FiFolder size={16} />
                  Choisir
                </button>
              </div>
              <p className="text-xs text-krone-500 mt-1">
                Les données sont stockées localement dans votre navigateur
              </p>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-krone-700">
              <div>
                <p className="text-sm text-white">Taille totale</p>
                <p className="text-xs text-krone-400">Espace utilisé par Krone</p>
              </div>
              <div className="flex items-center gap-2">
                <FiDatabase size={16} className="text-krone-400" />
                <span className="text-lg font-semibold text-accent-400">{storageSize}</span>
              </div>
            </div>

            {/* Storage breakdown */}
            {storageBreakdown.length > 0 && (
              <div className="py-3 border-t border-krone-700">
                <p className="text-xs text-krone-500 uppercase font-semibold mb-2">Détails du stockage</p>
                <div className="space-y-1.5">
                  {storageBreakdown.map(item => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-krone-300">{item.label} <span className="text-krone-500">({item.count})</span></span>
                      <span className="text-krone-400 font-mono text-xs">{item.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastSaved && (
              <div className="py-3 border-t border-krone-700">
                <p className="text-xs text-krone-400">
                  Dernière sauvegarde: {new Date(lastSaved).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Import/Export Section */}
        <div className="bg-krone-800 rounded-xl border border-krone-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <FiRefreshCw size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Sauvegarde & Restauration</h2>
              <p className="text-xs text-krone-400">Exporter et importer vos données</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-green-500/20"
            >
              <FiDownload size={20} />
              <div className="text-left">
                <p>Exporter les données</p>
                <p className="text-xs text-green-200 font-normal">Sauvegarder sur votre PC</p>
              </div>
            </button>

            <button
              onClick={handleImport}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-blue-500/20"
            >
              <FiUpload size={20} />
              <div className="text-left">
                <p>Importer les données</p>
                <p className="text-xs text-blue-200 font-normal">Restaurer depuis un fichier</p>
              </div>
            </button>

            <div className="pt-4 border-t border-krone-700">
              <p className="text-xs text-krone-400 mb-3">
                💡 Conseil: Exportez régulièrement vos données pour éviter toute perte
              </p>
            </div>
          </div>
        </div>

        {/* Auto-save Settings */}
        <div className="bg-krone-800 rounded-xl border border-krone-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FiSave size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Sauvegarde automatique</h2>
              <p className="text-xs text-krone-400">Configuration de l'auto-save</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-white">Activer la sauvegarde automatique</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={e => setAutoSave(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-krone-600 peer-checked:bg-accent-500 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>

            {autoSave && (
              <div>
                <label className="block text-sm text-krone-300 mb-2">Intervalle (secondes)</label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={autoSaveInterval}
                  onChange={e => setAutoSaveInterval(+e.target.value)}
                  className="w-full px-3 py-2 bg-krone-700 border border-krone-600 rounded-lg text-white text-sm"
                />
              </div>
            )}

            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-lg font-medium text-sm transition-colors"
            >
              Sauvegarder les paramètres
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-krone-800 rounded-xl border border-red-500/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <FiAlertCircle size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-400">Zone dangereuse</h2>
              <p className="text-xs text-krone-400">Actions irréversibles</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-sm text-red-300 mb-3">
                ⚠️ Attention: La suppression des données est définitive et ne peut pas être annulée.
              </p>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Supprimer toutes les données
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
