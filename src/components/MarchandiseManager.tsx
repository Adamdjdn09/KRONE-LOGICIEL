import { useState, useEffect } from 'react';
import { MerchandiseData, MerchandiseOption } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { FiPlus, FiEdit2, FiTrash2, FiTruck, FiTag, FiAward, FiCheck, FiX, FiPackage } from 'react-icons/fi';

interface Props {
  data: MerchandiseData;
  onSave: (data: MerchandiseData) => void;
}

type CategoryKey = 'vehicules' | 'types' | 'marques';

interface CategoryConfig {
  key: CategoryKey;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
}

const categories: CategoryConfig[] = [
  { 
    key: 'vehicules', 
    title: 'Véhicules', 
    icon: FiTruck, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20',
    description: 'Types de véhicules (semi-remorque, clark, etc.)'
  },
  { 
    key: 'types', 
    title: 'Types', 
    icon: FiTag, 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20',
    description: 'Types de produits (Profi Liner, Cool Liner, etc.)'
  },
  { 
    key: 'marques', 
    title: 'Marques', 
    icon: FiAward, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/20',
    description: 'Marques des produits (KRONE, etc.)'
  },
];

export default function MarchandiseManager({ data, onSave }: Props) {
  const [marchandise, setMarchandise] = useState<MerchandiseData>(data);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('vehicules');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [saved, setSaved] = useState(false);

  // Auto-save on change
  useEffect(() => {
    const timer = setTimeout(() => {
      onSave(marchandise);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 500);
    return () => clearTimeout(timer);
  }, [marchandise, onSave]);

  const currentCategory = categories.find(c => c.key === activeCategory)!;
  const currentItems = marchandise[activeCategory];

  const handleAdd = () => {
    if (!newName.trim()) return;
    
    const newItem: MerchandiseOption = {
      id: uuidv4(),
      name: newName.trim(),
      createdAt: new Date().toISOString(),
    };

    setMarchandise({
      ...marchandise,
      [activeCategory]: [...marchandise[activeCategory], newItem],
    });

    setNewName('');
    setShowAdd(false);
  };

  const handleUpdate = (id: string) => {
    if (!editingName.trim()) return;

    setMarchandise({
      ...marchandise,
      [activeCategory]: marchandise[activeCategory].map(item =>
        item.id === id ? { ...item, name: editingName.trim() } : item
      ),
    });

    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    setMarchandise({
      ...marchandise,
      [activeCategory]: marchandise[activeCategory].filter(item => item.id !== id),
    });
  };

  const startEdit = (item: MerchandiseOption) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <FiPackage size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestion de la Marchandise</h1>
            <p className="text-krone-300 text-sm">Gérez vos véhicules, types et marques</p>
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-400 text-sm animate-fade-in">
            <FiCheck size={16} />
            <span>Sauvegardé automatiquement</span>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              activeCategory === cat.key
                ? `${cat.bgColor} ${cat.color} border-2 border-current`
                : 'bg-krone-800 text-krone-300 border-2 border-transparent hover:bg-krone-700'
            }`}
          >
            <cat.icon size={18} />
            <span>{cat.title}</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              activeCategory === cat.key ? 'bg-white/20' : 'bg-krone-700'
            }`}>
              {marchandise[cat.key].length}
            </span>
          </button>
        ))}
      </div>

      {/* Current Category */}
      <div className="bg-krone-800 rounded-2xl border border-krone-700 overflow-hidden">
        {/* Category Header */}
        <div className="p-5 border-b border-krone-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${currentCategory.bgColor} rounded-lg flex items-center justify-center`}>
              <currentCategory.icon size={20} className={currentCategory.color} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{currentCategory.title}</h2>
              <p className="text-xs text-krone-400">{currentCategory.description}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className={`flex items-center gap-2 px-4 py-2 ${currentCategory.bgColor} ${currentCategory.color} rounded-lg font-medium text-sm hover:opacity-80 transition-opacity`}
          >
            <FiPlus size={16} />
            Ajouter
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="p-4 bg-krone-700/30 border-b border-krone-700 animate-fade-in">
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder={`Nom du ${currentCategory.title.slice(0, -1).toLowerCase()}`}
                  className="w-full px-4 py-2.5 bg-krone-700 border border-krone-600 rounded-lg text-white placeholder-krone-400 focus:border-accent-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <button
                onClick={handleAdd}
                className="px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-lg font-medium transition-colors"
              >
                Ajouter
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewName(''); }}
                className="px-4 py-2.5 bg-krone-600 text-krone-300 hover:text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="divide-y divide-krone-700/50">
          {currentItems.length === 0 ? (
            <div className="p-8 text-center">
              <currentCategory.icon size={40} className="mx-auto text-krone-600 mb-3" />
              <p className="text-krone-400">Aucun élément dans cette catégorie</p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-4 text-sm text-accent-400 hover:text-accent-300"
              >
                Ajouter un élément
              </button>
            </div>
          ) : (
            currentItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-krone-700/20 transition-colors group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${currentCategory.bgColor} rounded-lg flex items-center justify-center`}>
                    <span className="text-lg font-bold text-white">{item.name.charAt(0).toUpperCase()}</span>
                  </div>
                  
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdate(item.id);
                          if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                        }}
                        className="px-3 py-1.5 bg-krone-700 border border-krone-500 rounded-lg text-white focus:border-accent-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                      >
                        <FiCheck size={16} />
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditingName(''); }}
                        className="p-1.5 text-krone-400 hover:text-white hover:bg-krone-700 rounded"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-krone-400">{item.description}</p>
                      )}
                    </div>
                  )}
                </div>

                {editingId !== item.id && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-krone-500 mr-2">
                      {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 text-krone-400 hover:text-accent-400 hover:bg-krone-700 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-krone-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.key} className={`${cat.bgColor} rounded-xl p-4 flex items-center gap-3`}>
            <cat.icon size={20} className={cat.color} />
            <div>
              <p className="text-2xl font-bold text-white">{marchandise[cat.key].length}</p>
              <p className={`text-xs ${cat.color}`}>{cat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Info */}
      <div className="mt-6 p-4 bg-krone-800/50 rounded-xl border border-krone-700">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <FiPackage size={14} className="text-accent-400" />
          Comment utiliser ces données ?
        </h3>
        <ul className="text-xs text-krone-400 space-y-1">
          <li>• Les <strong className="text-blue-400">véhicules</strong> sont utilisés pour définir le type de transport</li>
          <li>• Les <strong className="text-purple-400">types</strong> correspondent aux modèles de produits (Profi Liner, Cool Liner...)</li>
          <li>• Les <strong className="text-amber-400">marques</strong> identifient le fabricant des produits</li>
          <li>• Ces données peuvent être utilisées dans les variables et les templates de documents</li>
        </ul>
      </div>
    </div>
  );
}
