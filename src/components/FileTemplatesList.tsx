import { FileTemplate, TemplateElement } from '../types';
import { FiPlus, FiEdit2, FiTrash2, FiFileText, FiCopy, FiPackage, FiX, FiSearch, FiGrid, FiLayers, FiClock, FiCheck } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from 'react';

interface Props {
  templates: FileTemplate[];
  onSave: (templates: FileTemplate[]) => void;
  onEdit: (templateId: string) => void;
}

const templateTypes = [
  { value: 'facture', label: 'Facture', icon: '🧾', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30' },
  { value: 'certificat_garantie', label: 'Certificat de garantie', icon: '📜', color: 'from-green-500/20 to-green-600/10 border-green-500/30' },
  { value: 'note_poids', label: 'Note de poids', icon: '⚖️', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
  { value: 'packing_list', label: 'Packing List', icon: '📦', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30' },
  { value: 'certificat_origine', label: "Certificat d'origine", icon: '🌍', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' },
  { value: 'bill_of_lading', label: 'Bill of Lading', icon: '🚢', color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30' },
  { value: 'certificat_conformite', label: 'Certificat de conformité', icon: '✅', color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30' },
  { value: 'eur1', label: 'EUR.1', icon: '🇪🇺', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30' },
  { value: 'certificat_vente', label: 'Certificat de vente', icon: '📝', color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30' },
  { value: 'autre', label: 'Autre', icon: '📄', color: 'from-krone-500/20 to-krone-600/10 border-krone-500/30' },
];

type TabId = 'templates' | 'composants' | 'groupes';

interface SavedComponent {
  id: string;
  name: string;
  desc: string;
  element: TemplateElement;
}

interface SavedGroup {
  id: string;
  name: string;
  desc: string;
  elements: TemplateElement[];
  isGroup: true;
  createdAt: string;
}

export default function FileTemplatesList({ templates, onSave, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('templates');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('facture');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Load saved components & groups from localStorage
  const [savedComponents, setSavedComponents] = useState<SavedComponent[]>([]);
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([]);

  const loadFromStorage = () => {
    try { setSavedComponents(JSON.parse(localStorage.getItem('krone_saved_components') || '[]')); } catch { setSavedComponents([]); }
    try { setSavedGroups(JSON.parse(localStorage.getItem('krone_saved_groups') || '[]')); } catch { setSavedGroups([]); }
  };

  useEffect(() => {
    loadFromStorage();
    // Poll for changes every 2s (auto-registration from TemplateEditor)
    const interval = setInterval(loadFromStorage, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = () => {
    if (!newName) return;
    const template: FileTemplate = {
      id: uuidv4(),
      name: newName,
      type: newType,
      elements: [],
      pageSize: { width: 794, height: 1123 },
      margins: { top: 40, right: 40, bottom: 40, left: 40 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave([...templates, template]);
    setShowAdd(false);
    setNewName('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;
    onSave(templates.filter(t => t.id !== id));
  };

  const handleDuplicate = (template: FileTemplate) => {
    const dup: FileTemplate = {
      ...template,
      id: uuidv4(),
      name: `${template.name} (copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave([...templates, dup]);
  };

  const deleteComponent = (id: string) => {
    if (!confirm('Supprimer ce composant ?')) return;
    const updated = savedComponents.filter(c => c.id !== id);
    localStorage.setItem('krone_saved_components', JSON.stringify(updated));
    setSavedComponents(updated);
  };

  const deleteGroup = (id: string) => {
    if (!confirm('Supprimer ce groupe ?')) return;
    const updated = savedGroups.filter(g => g.id !== id);
    localStorage.setItem('krone_saved_groups', JSON.stringify(updated));
    setSavedGroups(updated);
  };

  // Filtered results
  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterType === 'all' || t.type === filterType)
  );
  const filteredComponents = savedComponents.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredGroups = savedGroups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalElements = templates.reduce((sum, t) => sum + t.elements.length, 0);
  const recentTemplate = templates.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count: number; color: string }[] = [
    { id: 'templates', label: 'Templates', icon: <FiFileText size={14} />, count: templates.length, color: 'text-accent-400 border-accent-400' },
    { id: 'composants', label: 'Composants', icon: <FiLayers size={14} />, count: savedComponents.length, color: 'text-purple-400 border-purple-400' },
    { id: 'groupes', label: 'Groupes', icon: <FiPackage size={14} />, count: savedGroups.length, color: 'text-blue-400 border-blue-400' },
  ];

  return (
    <div className="h-full flex flex-col bg-krone-900 animate-fade-in">
      
      {/* ═══ PAGE HEADER ═══ */}
      <div className="px-8 pt-8 pb-0 bg-krone-900">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Gestion des Fichiers</h1>
            <p className="text-krone-400 text-sm mt-1">Créez, organisez et réutilisez vos templates et composants</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-accent-500/20"
          >
            <FiPlus size={16} />
            Nouveau template
          </button>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Templates', value: templates.length, icon: '📄', sub: `${totalElements} éléments au total`, color: 'border-accent-500/20 bg-accent-500/5' },
            { label: 'Composants', value: savedComponents.length, icon: '🧩', sub: 'Blocs réutilisables', color: 'border-purple-500/20 bg-purple-500/5' },
            { label: 'Groupes', value: savedGroups.length, icon: '📦', sub: 'Groupes multi-éléments', color: 'border-blue-500/20 bg-blue-500/5' },
            { label: 'Dernier modifié', value: recentTemplate ? new Date(recentTemplate.updatedAt).toLocaleDateString('fr-FR') : '—', icon: '🕐', sub: recentTemplate?.name || 'Aucun template', color: 'border-krone-600/40 bg-krone-800/50', isText: true },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-krone-400 font-medium">{stat.label}</span>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <div className={`font-bold ${(stat as any).isText ? 'text-sm text-white truncate' : 'text-2xl text-white'}`}>
                {stat.value}
              </div>
              <p className="text-[10px] text-krone-500 mt-0.5 truncate">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ─── Tab Navigation ─── */}
        <div className="flex items-center gap-0 border-b border-krone-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? `${tab.color} bg-krone-800/50`
                  : 'text-krone-400 border-transparent hover:text-krone-200 hover:bg-krone-800/30'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-current/20 text-current' : 'bg-krone-700 text-krone-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}

          {/* Search + Filter aligned right */}
          <div className="ml-auto flex items-center gap-2 pb-2">
            <div className="relative">
              <FiSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-krone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="pl-8 pr-3 py-1.5 bg-krone-800 border border-krone-700 rounded-lg text-white text-xs focus:border-accent-500 focus:outline-none w-44"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-krone-500 hover:text-white">
                  <FiX size={11} />
                </button>
              )}
            </div>
            {activeTab === 'templates' && (
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-krone-800 border border-krone-700 rounded-lg text-krone-300 text-xs focus:border-accent-500 focus:outline-none"
              >
                <option value="all">Tous les types</option>
                {templateTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ─────────────────────────────────────────
            TAB: TEMPLATES
        ───────────────────────────────────────── */}
        {activeTab === 'templates' && (
          <div>
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-krone-800 border border-krone-700 flex items-center justify-center mb-4">
                  <FiFileText size={32} className="text-krone-600" />
                </div>
                <p className="text-krone-300 font-medium mb-1">
                  {searchQuery ? 'Aucun résultat' : 'Aucun template'}
                </p>
                <p className="text-krone-500 text-sm mb-4">
                  {searchQuery ? `Aucun template pour "${searchQuery}"` : 'Créez votre premier template de document professionnel'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 rounded-xl text-sm font-medium transition-colors border border-accent-500/20"
                  >
                    <FiPlus size={14} /> Créer un template
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredTemplates.map(template => {
                  const typeInfo = templateTypes.find(t => t.value === template.type) || templateTypes[templateTypes.length - 1];
                  return (
                    <div key={template.id} className="bg-krone-800 rounded-2xl border border-krone-700 overflow-hidden group hover:border-krone-600 transition-all hover:shadow-xl hover:shadow-black/30 flex flex-col">
                      {/* Preview area */}
                      <div className={`h-36 bg-gradient-to-br ${typeInfo.color} flex items-center justify-center relative border-b border-krone-700`}>
                        <span className="text-5xl drop-shadow">{typeInfo.icon}</span>
                        {/* Hover actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => onEdit(template.id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-accent-500 text-krone-900 rounded-lg text-xs font-bold shadow-lg"
                          >
                            <FiEdit2 size={12} /> Éditer
                          </button>
                          <button
                            onClick={() => handleDuplicate(template)}
                            className="p-2 bg-krone-700/90 text-krone-200 hover:text-white rounded-lg"
                          >
                            <FiCopy size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-2 bg-krone-700/90 text-krone-400 hover:text-red-400 rounded-lg"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                        {/* Element count badge */}
                        <span className="absolute bottom-2 right-2 text-[10px] bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                          {template.elements.length} éléments
                        </span>
                      </div>

                      {/* Card body */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm mb-0.5 line-clamp-1">{template.name}</h3>
                          <span className="inline-flex items-center gap-1 text-[10px] bg-krone-700 text-krone-300 px-2 py-0.5 rounded-full">
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-krone-700">
                          <div className="flex items-center gap-1 text-[10px] text-krone-500">
                            <FiClock size={10} />
                            {new Date(template.updatedAt).toLocaleDateString('fr-FR')}
                          </div>
                          <button
                            onClick={() => onEdit(template.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 rounded-lg text-xs font-medium transition-colors"
                          >
                            <FiEdit2 size={11} /> Modifier
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add new card */}
                <button
                  onClick={() => setShowAdd(true)}
                  className="h-full min-h-[220px] rounded-2xl border-2 border-dashed border-krone-700 hover:border-accent-500/50 hover:bg-accent-500/5 flex flex-col items-center justify-center gap-3 text-krone-500 hover:text-accent-400 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-krone-800 group-hover:bg-accent-500/10 flex items-center justify-center transition-colors">
                    <FiPlus size={22} />
                  </div>
                  <span className="text-sm font-medium">Nouveau template</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────
            TAB: COMPOSANTS
        ───────────────────────────────────────── */}
        {activeTab === 'composants' && (
          <div>
            <div className="flex items-center gap-3 mb-5 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
              <span className="text-2xl">🧩</span>
              <div>
                <p className="text-sm font-medium text-white">Composants réutilisables</p>
                <p className="text-xs text-krone-400">Éléments sauvegardés depuis l'éditeur de template. Cliquez <kbd className="px-1.5 py-0.5 bg-krone-700 rounded text-[10px]">Sauvegarder</kbd> dans l'éditeur pour en ajouter.</p>
              </div>
              <button onClick={loadFromStorage} className="ml-auto p-2 text-krone-400 hover:text-white hover:bg-krone-700 rounded-lg transition-colors" title="Actualiser">
                <FiCheck size={14} />
              </button>
            </div>

            {filteredComponents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <FiLayers size={32} className="text-purple-500/50" />
                </div>
                <p className="text-krone-300 font-medium mb-1">
                  {searchQuery ? 'Aucun résultat' : 'Aucun composant enregistré'}
                </p>
                <p className="text-krone-500 text-sm max-w-xs">
                  {searchQuery
                    ? `Aucun composant pour "${searchQuery}"`
                    : 'Ouvrez un template, sélectionnez un élément et cliquez "Sauvegarder" dans la barre d\'outils'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredComponents.map(comp => {
                  const typeColors: Record<string, string> = {
                    text: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    variable: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    table: 'bg-green-500/10 text-green-400 border-green-500/20',
                    image: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                    shape: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                    line: 'bg-krone-500/10 text-krone-400 border-krone-500/20',
                  };
                  const typeIcons: Record<string, string> = { text: '📝', variable: '🔢', table: '📊', image: '🖼️', shape: '⬜', line: '➖' };
                  const colorClass = typeColors[comp.element.type] || typeColors.text;
                  return (
                    <div key={comp.id} className="bg-krone-800 rounded-xl border border-krone-700 p-4 group hover:border-krone-600 transition-all">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border shrink-0 ${colorClass}`}>
                          {typeIcons[comp.element.type] || '📄'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">{comp.name}</h3>
                          {comp.desc && <p className="text-xs text-krone-400 truncate mt-0.5">{comp.desc}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${colorClass}`}>
                              {comp.element.type}
                            </span>
                            <span className="text-[10px] text-krone-500">{Math.round(comp.element.width)}×{Math.round(comp.element.height)}px</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-krone-700">
                        <p className="text-[10px] text-krone-500">Enregistré automatiquement</p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteComponent(comp.id)}
                            className="p-1.5 text-krone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Supprimer"
                          >
                            <FiTrash2 size={12} />
                          </button>
                          <span className="text-[10px] text-green-400 flex items-center gap-1"><FiCheck size={10} /> Disponible dans l'éditeur</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────
            TAB: GROUPES
        ───────────────────────────────────────── */}
        {activeTab === 'groupes' && (
          <div>
            <div className="flex items-center gap-3 mb-5 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-sm font-medium text-white">Groupes d'éléments</p>
                <p className="text-xs text-krone-400">
                  Groupes de plusieurs éléments sauvegardés ensemble. Dans l'éditeur, sélectionnez plusieurs éléments (<kbd className="px-1.5 py-0.5 bg-krone-700 rounded text-[10px]">Ctrl+clic</kbd>) puis cliquez <kbd className="px-1.5 py-0.5 bg-krone-700 rounded text-[10px]">Enreg. Groupe</kbd>.
                </p>
              </div>
              <button onClick={loadFromStorage} className="ml-auto p-2 text-krone-400 hover:text-white hover:bg-krone-700 rounded-lg transition-colors" title="Actualiser">
                <FiCheck size={14} />
              </button>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                  <FiPackage size={32} className="text-blue-500/50" />
                </div>
                <p className="text-krone-300 font-medium mb-1">
                  {searchQuery ? 'Aucun résultat' : 'Aucun groupe enregistré'}
                </p>
                <p className="text-krone-500 text-sm max-w-xs">
                  {searchQuery
                    ? `Aucun groupe pour "${searchQuery}"`
                    : 'Sélectionnez plusieurs éléments avec Ctrl+clic dans l\'éditeur, puis cliquez "Enreg. Groupe"'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map(grp => {
                  const typeCount: Record<string, number> = {};
                  grp.elements.forEach(el => { typeCount[el.type] = (typeCount[el.type] || 0) + 1; });
                  return (
                    <div key={grp.id} className="bg-krone-800 rounded-xl border border-krone-700 p-4 group hover:border-blue-500/40 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <span className="text-2xl font-bold text-blue-400 text-lg">{grp.elements.length}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">{grp.name}</h3>
                          {grp.desc && <p className="text-xs text-krone-400 truncate mt-0.5">{grp.desc}</p>}
                          <div className="flex items-center gap-1 flex-wrap mt-2">
                            {Object.entries(typeCount).map(([type, count]) => (
                              <span key={type} className="text-[10px] px-1.5 py-0.5 rounded bg-krone-700 text-krone-300 capitalize">
                                {count}× {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-krone-700">
                        <div className="flex items-center gap-1 text-[10px] text-krone-500">
                          <FiClock size={10} />
                          {new Date(grp.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteGroup(grp.id)}
                            className="p-1.5 text-krone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Supprimer"
                          >
                            <FiTrash2 size={12} />
                          </button>
                          <span className="text-[10px] text-blue-400 flex items-center gap-1"><FiPackage size={10} /> Importable dans l'éditeur</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ NEW TEMPLATE MODAL ═══ */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-krone-800 rounded-2xl border border-krone-600 p-6 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Nouveau template</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 text-krone-400 hover:text-white hover:bg-krone-700 rounded-lg">
                <FiX size={18} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-krone-300 mb-2">Nom du template</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="w-full px-4 py-3 bg-krone-700 border border-krone-600 rounded-xl text-white focus:border-accent-500 focus:outline-none text-sm"
                  placeholder="Ex: Facture commerciale, Packing List standard..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-krone-300 mb-2">Type de document</label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {templateTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewType(type.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-sm text-left transition-all ${
                        newType === type.value
                          ? 'border-accent-500 bg-accent-500/10 text-accent-400 shadow-sm shadow-accent-500/20'
                          : 'border-krone-600 bg-krone-700/30 text-krone-300 hover:border-krone-500 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className="font-medium">{type.label}</span>
                      {newType === type.value && <FiCheck size={14} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="flex-1 py-3 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-krone-900 rounded-xl font-bold text-sm transition-colors"
                >
                  Créer le template
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-5 py-3 bg-krone-700 text-krone-300 hover:bg-krone-600 rounded-xl text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
