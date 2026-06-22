import { useState } from 'react';
import { Client, Expedition } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiX, FiTruck, FiChevronRight, FiFileText, FiLayers } from 'react-icons/fi';

interface Props {
  client: Client;
  onUpdateClient: (client: Client) => void;
  onBack: () => void;
  onSelectExpedition: (expeditionId: string) => void;
}

export default function ClientDetail({ client, onUpdateClient, onBack, onSelectExpedition }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddExpedition = () => {
    if (!newName.trim()) return;
    const expedition: Expedition = {
      id: uuidv4(),
      name: newName.trim(),
      clientId: client.id,
      createdAt: new Date().toISOString(),
      pageGardeData: {},
      marchandises: [],
      generatedFiles: [],
    };
    onUpdateClient({
      ...client,
      expeditions: [...client.expeditions, expedition],
    });
    setNewName('');
    setShowAdd(false);
  };

  const handleDeleteExpedition = (expId: string) => {
    onUpdateClient({
      ...client,
      expeditions: client.expeditions.filter(e => e.id !== expId),
    });
  };

  const handleRenameExpedition = (expId: string) => {
    if (!editName.trim()) return;
    onUpdateClient({
      ...client,
      expeditions: client.expeditions.map(e =>
        e.id === expId ? { ...e, name: editName.trim() } : e
      ),
    });
    setEditingId(null);
  };

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 text-krone-300 hover:text-white hover:bg-krone-700 rounded-lg">
          <FiArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-krone-400 to-krone-600 rounded-lg flex items-center justify-center">
              <FiTruck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{client.name}</h1>
              <p className="text-krone-400 text-sm">
                {client.expeditions.length} expédition(s) • Créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-lg font-medium transition-colors"
        >
          <FiPlus size={18} />
          Nouvelle expédition
        </button>
      </div>

      {/* Expeditions */}
      <div className="space-y-4">
        {client.expeditions.map(exp => (
          <div
            key={exp.id}
            className="card-hover bg-krone-800 rounded-xl border border-krone-700 p-5 cursor-pointer group"
            onClick={() => onSelectExpedition(exp.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl flex items-center justify-center">
                  <FiTruck size={24} className="text-green-400" />
                </div>
                <div>
                  {editingId === exp.id ? (
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRenameExpedition(exp.id)}
                        className="px-2 py-1 bg-krone-700 border border-krone-500 rounded text-white focus:outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleRenameExpedition(exp.id)} className="px-2 py-1 bg-accent-500 text-krone-900 rounded text-sm">OK</button>
                    </div>
                  ) : (
                    <h3 className="text-lg font-semibold text-white">Expédition {exp.name}</h3>
                  )}
                  <p className="text-sm text-krone-400">
                    Créée le {new Date(exp.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-sm text-krone-400">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-krone-700/50 rounded">
                    <FiLayers size={13} />
                    <span>Page de garde</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-krone-700/50 rounded">
                    <FiFileText size={13} />
                    <span>{exp.generatedFiles.length} fichiers</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => { setEditingId(exp.id); setEditName(exp.name); }}
                    className="p-1.5 text-krone-400 hover:text-accent-400 rounded hover:bg-krone-700"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteExpedition(exp.id)}
                    className="p-1.5 text-krone-400 hover:text-danger rounded hover:bg-krone-700"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
                <FiChevronRight className="text-krone-500 group-hover:text-accent-400 transition-colors" size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {client.expeditions.length === 0 && (
        <div className="text-center py-16 bg-krone-800 rounded-xl border border-krone-700">
          <FiTruck size={48} className="mx-auto text-krone-600 mb-4" />
          <p className="text-krone-400 mb-4">Aucune expédition pour ce client</p>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-accent-500 text-krone-900 rounded-lg text-sm font-medium">
            Créer une expédition
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-krone-800 rounded-xl border border-krone-600 p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Nouvelle expédition</h3>
              <button onClick={() => setShowAdd(false)} className="text-krone-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-krone-300 mb-1">Nom de l'expédition</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddExpedition()}
                  className="w-full px-3 py-2.5 bg-krone-700 border border-krone-600 rounded-lg text-white focus:border-accent-500 focus:outline-none text-lg"
                  placeholder="Ex: 2025"
                  autoFocus
                />
              </div>
              <button
                onClick={handleAddExpedition}
                className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-lg font-medium transition-colors"
              >
                Créer l'expédition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
