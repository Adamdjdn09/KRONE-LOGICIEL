import { useState } from 'react';
import { Variable } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiSearch } from 'react-icons/fi';

interface Props {
  variables: Variable[];
  onSave: (variables: Variable[]) => void;
}

export default function VariablesManager({ variables, onSave }: Props) {
  const [vars, setVars] = useState<Variable[]>(variables);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newVar, setNewVar] = useState<Partial<Variable>>({
    name: '', key: '', type: 'text', defaultValue: '', category: 'Projet'
  });

  const categories = Array.from(new Set(vars.map(v => v.category)));
  const filtered = vars.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                        v.key.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || v.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const handleAdd = () => {
    if (!newVar.name || !newVar.key) return;
    const variable: Variable = {
      id: uuidv4(),
      name: newVar.name!,
      key: newVar.key!,
      type: newVar.type as Variable['type'] || 'text',
      defaultValue: newVar.defaultValue || '',
      category: newVar.category || 'Autre',
      options: newVar.type === 'dropdown' ? (newVar.options || []) : undefined,
    };
    const updated = [...vars, variable];
    setVars(updated);
    onSave(updated);
    setShowAdd(false);
    setNewVar({ name: '', key: '', type: 'text', defaultValue: '', category: 'Projet' });
  };

  const handleUpdate = (id: string, updates: Partial<Variable>) => {
    const updated = vars.map(v => v.id === id ? { ...v, ...updates } : v);
    setVars(updated);
    onSave(updated);
  };

  const handleDelete = (id: string) => {
    const updated = vars.filter(v => v.id !== id);
    setVars(updated);
    onSave(updated);
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des Variables</h1>
          <p className="text-krone-300 text-sm mt-1">Configurez les variables utilisées dans vos documents</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-lg font-medium transition-colors"
        >
          <FiPlus size={18} />
          Ajouter une variable
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-krone-400" />
          <input
            type="text"
            placeholder="Rechercher une variable..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-krone-800 border border-krone-600 rounded-lg text-white placeholder-krone-400 focus:border-accent-500 focus:outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-krone-800 border border-krone-600 rounded-lg text-white focus:border-accent-500 focus:outline-none"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-krone-800 rounded-xl border border-krone-600 p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Nouvelle variable</h3>
              <button onClick={() => setShowAdd(false)} className="text-krone-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-krone-300 mb-1">Nom</label>
                <input
                  type="text"
                  value={newVar.name || ''}
                  onChange={e => setNewVar({ ...newVar, name: e.target.value })}
                  className="w-full px-3 py-2 bg-krone-700 border border-krone-600 rounded-lg text-white focus:border-accent-500 focus:outline-none"
                  placeholder="Ex: Numéro de commande"
                />
              </div>
              <div>
                <label className="block text-sm text-krone-300 mb-1">Clé (identifiant)</label>
                <input
                  type="text"
                  value={newVar.key || ''}
                  onChange={e => setNewVar({ ...newVar, key: e.target.value.replace(/\s/g, '_').toLowerCase() })}
                  className="w-full px-3 py-2 bg-krone-700 border border-krone-600 rounded-lg text-white focus:border-accent-500 focus:outline-none font-mono"
                  placeholder="Ex: numero_commande"
                />
              </div>
              <div>
                <label className="block text-sm text-krone-300 mb-1">Type</label>
                <select
                  value={newVar.type || 'text'}
                  onChange={e => setNewVar({ ...newVar, type: e.target.value as Variable['type'] })}
                  className="w-full px-3 py-2 bg-krone-700 border border-krone-600 rounded-lg text-white focus:border-accent-500 focus:outline-none"
                >
                  <option value="text">Texte</option>
                  <option value="number">Nombre</option>
                  <option value="date">Date</option>
                  <option value="dropdown">Liste déroulante</option>
                  <option value="multiline">Texte multiligne</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-krone-300 mb-1">Catégorie</label>
                <input
                  type="text"
                  value={newVar.category || ''}
                  onChange={e => setNewVar({ ...newVar, category: e.target.value })}
                  className="w-full px-3 py-2 bg-krone-700 border border-krone-600 rounded-lg text-white focus:border-accent-500 focus:outline-none"
                  placeholder="Ex: Projet"
                />
              </div>
              <div>
                <label className="block text-sm text-krone-300 mb-1">Valeur par défaut</label>
                <input
                  type="text"
                  value={newVar.defaultValue || ''}
                  onChange={e => setNewVar({ ...newVar, defaultValue: e.target.value })}
                  className="w-full px-3 py-2 bg-krone-700 border border-krone-600 rounded-lg text-white focus:border-accent-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-lg font-medium transition-colors"
              >
                Créer la variable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variables Table */}
      <div className="bg-krone-800 rounded-xl border border-krone-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-krone-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-krone-400 uppercase">Nom</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-krone-400 uppercase">Clé</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-krone-400 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-krone-400 uppercase">Catégorie</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-krone-400 uppercase">Défaut</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-krone-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id} className="border-b border-krone-700/50 hover:bg-krone-700/30 transition-colors">
                <td className="px-4 py-3">
                  {editingId === v.id ? (
                    <input
                      type="text"
                      value={v.name}
                      onChange={e => handleUpdate(v.id, { name: e.target.value })}
                      className="px-2 py-1 bg-krone-700 border border-krone-500 rounded text-white text-sm w-full focus:outline-none"
                    />
                  ) : (
                    <span className="text-white text-sm">{v.name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-krone-700 px-2 py-1 rounded text-accent-400 font-mono">{`{{${v.key}}}`}</code>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    v.type === 'text' ? 'bg-blue-500/20 text-blue-400' :
                    v.type === 'number' ? 'bg-green-500/20 text-green-400' :
                    v.type === 'date' ? 'bg-purple-500/20 text-purple-400' :
                    v.type === 'dropdown' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-pink-500/20 text-pink-400'
                  }`}>
                    {v.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-krone-300">{v.category}</td>
                <td className="px-4 py-3">
                  {editingId === v.id ? (
                    <input
                      type="text"
                      value={v.defaultValue}
                      onChange={e => handleUpdate(v.id, { defaultValue: e.target.value })}
                      className="px-2 py-1 bg-krone-700 border border-krone-500 rounded text-white text-sm w-full focus:outline-none"
                    />
                  ) : (
                    <span className="text-krone-400 text-sm truncate block max-w-[150px]">{v.defaultValue || '—'}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === v.id ? (
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-success hover:bg-success/20 rounded">
                        <FiSave size={15} />
                      </button>
                    ) : (
                      <button onClick={() => setEditingId(v.id)} className="p-1.5 text-krone-400 hover:text-accent-400 hover:bg-krone-700 rounded">
                        <FiEdit2 size={15} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(v.id)} className="p-1.5 text-krone-400 hover:text-danger hover:bg-danger/20 rounded">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-krone-400">Aucune variable trouvée</div>
        )}
      </div>
    </div>
  );
}
