import { useState } from 'react';
import { Client } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiX, FiSearch, FiChevronRight, FiTruck } from 'react-icons/fi';

interface Props {
  clients: Client[];
  onSave: (clients: Client[]) => void;
  onSelectClient: (clientId: string) => void;
}

export default function ClientsManager({ clients, onSave, onSelectClient }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newName.trim()) return;
    const client: Client = {
      id: uuidv4(),
      name: newName.trim(),
      createdAt: new Date().toISOString(),
      expeditions: [],
    };
    onSave([...clients, client]);
    setNewName('');
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    onSave(clients.filter(c => c.id !== id));
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) return;
    onSave(clients.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
    setEditingId(null);
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-krone-300 text-sm mt-1">Gérez vos clients et leurs expéditions</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-lg font-medium transition-colors"
        >
          <FiPlus size={18} />
          Nouveau client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-krone-400" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-krone-800 border border-krone-600 rounded-lg text-white placeholder-krone-400 focus:border-accent-500 focus:outline-none"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(client => (
          <div
            key={client.id}
            className="card-hover bg-krone-800 rounded-xl border border-krone-700 p-5 cursor-pointer group"
            onClick={() => onSelectClient(client.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-krone-400 to-krone-600 rounded-lg flex items-center justify-center">
                <FiUsers size={22} className="text-white" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => { setEditingId(client.id); setEditName(client.name); }}
                  className="p-1.5 text-krone-400 hover:text-accent-400 rounded hover:bg-krone-700"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-1.5 text-krone-400 hover:text-danger rounded hover:bg-krone-700"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
            
            {editingId === client.id ? (
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRename(client.id)}
                  className="flex-1 px-2 py-1 bg-krone-700 border border-krone-500 rounded text-white text-sm focus:outline-none"
                  autoFocus
                />
                <button onClick={() => handleRename(client.id)} className="px-2 py-1 bg-accent-500 text-krone-900 rounded text-sm">OK</button>
              </div>
            ) : (
              <h3 className="text-lg font-semibold text-white mb-1">{client.name}</h3>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5 text-sm text-krone-400">
                <FiTruck size={14} />
                <span>{client.expeditions.length} expédition(s)</span>
              </div>
              <FiChevronRight className="text-krone-500 group-hover:text-accent-400 transition-colors" />
            </div>
            <p className="text-xs text-krone-500 mt-2">
              Créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !showAdd && (
        <div className="text-center py-16">
          <FiUsers size={48} className="mx-auto text-krone-600 mb-4" />
          <p className="text-krone-400">Aucun client trouvé</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 bg-accent-500 text-krone-900 rounded-lg text-sm font-medium">
            Créer un client
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-krone-800 rounded-xl border border-krone-600 p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Nouveau client</h3>
              <button onClick={() => setShowAdd(false)} className="text-krone-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-krone-300 mb-1">Nom du client</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="w-full px-3 py-2.5 bg-krone-700 border border-krone-600 rounded-lg text-white focus:border-accent-500 focus:outline-none text-lg"
                  placeholder="Ex: Bejaia Logistique"
                  autoFocus
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-lg font-medium transition-colors"
              >
                Créer le client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
