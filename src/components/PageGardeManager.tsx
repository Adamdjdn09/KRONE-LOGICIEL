import { useState } from 'react';
import { PageGardeStructure, PageGardeSection, PageGardeField } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiChevronDown, FiChevronRight, FiLayers, FiColumns, FiArrowDown, FiInfo } from 'react-icons/fi';

interface Props {
  structure: PageGardeStructure;
  onSave: (structure: PageGardeStructure) => void;
}

type Col = 'colonne_gauche' | 'colonne_droite' | 'centre_bas';

const COL_INFO: Record<Col, { label: string; icon: React.ElementType; color: string; desc: string }> = {
  colonne_gauche: { label: 'Colonne Gauche', icon: FiColumns, color: 'text-blue-400', desc: 'Projet, banque, références...' },
  colonne_droite: { label: 'Colonne Droite', icon: FiColumns, color: 'text-purple-400', desc: 'Client, transport, commercial...' },
  centre_bas: { label: 'Centre / Bas', icon: FiArrowDown, color: 'text-amber-400', desc: 'Marchandise, origine, poids...' },
};

const FIELD_TYPES: { value: PageGardeField['type']; label: string; desc: string }[] = [
  { value: 'text', label: 'Texte', desc: 'Champ simple sur une ligne' },
  { value: 'multiline', label: 'Multiligne', desc: 'Zone de texte sur plusieurs lignes' },
  { value: 'dropdown', label: 'Liste déroulante', desc: 'Choix dans une liste d’options' },
  { value: 'date', label: 'Date', desc: 'Champ de date' },
  { value: 'number', label: 'Nombre', desc: 'Valeur numérique' },
  { value: 'quantity_single_line', label: 'Quantité', desc: 'Champ quantité lié à la marchandise' },
  { value: 'dynamic_chassis', label: 'Châssis dynamique', desc: 'Bloc lié aux châssis et marchandises' },
  { value: 'calculated', label: 'Calculé', desc: 'Valeur calculée automatiquement' },
];

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-blue-500/20 text-blue-400',
  multiline: 'bg-pink-500/20 text-pink-400',
  dropdown: 'bg-amber-500/20 text-amber-400',
  date: 'bg-purple-500/20 text-purple-400',
  number: 'bg-green-500/20 text-green-400',
  quantity_single_line: 'bg-cyan-500/20 text-cyan-400',
  dynamic_chassis: 'bg-orange-500/20 text-orange-400',
  calculated: 'bg-teal-500/20 text-teal-400',
};

export default function PageGardeManager({ structure, onSave }: Props) {
  const [data, setData] = useState<PageGardeStructure>(structure);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState<Col | null>(null);
  const [showAddField, setShowAddField] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState('📋');
  const [newField, setNewField] = useState<Partial<PageGardeField>>({ label: '', type: 'text', id: '' });
  const [fieldModal, setFieldModal] = useState<{
    col: Col;
    secId: string;
    field: PageGardeField;
    mode: 'edit' | 'add';
  } | null>(null);

  const save = (d: PageGardeStructure) => {
    setData(d);
    onSave(d);
  };

  const addSection = (col: Col) => {
    if (!newSectionName.trim()) return;
    const sec: PageGardeSection = {
      id: uuidv4(),
      name: newSectionName.trim(),
      icon: newSectionIcon,
      position: col,
      fields: [],
    };
    save({ ...data, sections: { ...data.sections, [col]: [...data.sections[col], sec] } });
    setShowAddSection(null);
    setNewSectionName('');
    setNewSectionIcon('📋');
  };

  const deleteSection = (col: Col, id: string) => {
    if (!confirm('Supprimer cette section ?')) return;
    save({ ...data, sections: { ...data.sections, [col]: data.sections[col].filter(s => s.id !== id) } });
  };

  const addFieldInline = (col: Col, secId: string) => {
    if (!newField.label || !newField.id) return;
    const field: PageGardeField = {
      id: newField.id!,
      label: newField.label!,
      type: (newField.type as PageGardeField['type']) || 'text',
    };
    save({
      ...data,
      sections: {
        ...data.sections,
        [col]: data.sections[col].map(s => s.id === secId ? { ...s, fields: [...s.fields, field] } : s),
      },
    });
    setShowAddField(null);
    setNewField({ label: '', type: 'text', id: '' });
  };

  const openFieldEditor = (col: Col, secId: string, field: PageGardeField) => {
    setFieldModal({ col, secId, field: { ...field }, mode: 'edit' });
  };

  const updateFieldModal = (updates: Partial<PageGardeField>) => {
    if (!fieldModal) return;
    setFieldModal({ ...fieldModal, field: { ...fieldModal.field, ...updates } });
  };

  const saveFieldModal = () => {
    if (!fieldModal) return;
    const { col, secId, field } = fieldModal;
    save({
      ...data,
      sections: {
        ...data.sections,
        [col]: data.sections[col].map(s =>
          s.id === secId ? { ...s, fields: s.fields.map(f => f.id === field.id ? field : f) } : s
        ),
      },
    });
    setFieldModal(null);
  };

  const deleteField = (col: Col, secId: string, fieldId: string) => {
    if (!confirm('Supprimer ce champ ?')) return;
    save({
      ...data,
      sections: {
        ...data.sections,
        [col]: data.sections[col].map(s => s.id === secId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s),
      },
    });
  };

  const totalFields = Object.values(data.sections).flat().reduce((sum, sec) => sum + sec.fields.length, 0);

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-[1450px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center shadow-xl shadow-accent-500/30">
            <FiLayers size={26} className="text-krone-900" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Paramètres • Page de garde</h1>
            <p className="text-sm text-krone-400">Architecture complète de vos zones, sections et champs</p>
          </div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-krone-800 border border-krone-700 text-right">
          <p className="text-xs text-krone-500 uppercase tracking-wider">Résumé</p>
          <p className="text-white font-bold">{totalFields} champ(s) • v{data.version}</p>
        </div>
      </div>

      {/* Hero layout preview */}
      <div className="bg-gradient-to-br from-krone-800 to-krone-700/40 rounded-3xl border border-krone-700 p-6 mb-8 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <FiInfo className="text-accent-400" />
          <h2 className="text-white font-bold">Aperçu de la structure</h2>
        </div>
        <div className="grid grid-cols-5 gap-3 h-28">
          <div className="col-span-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center text-blue-400 font-semibold text-sm">Colonne gauche • {data.sections.colonne_gauche.length} section(s)</div>
          <div className="rounded-2xl bg-krone-700/30" />
          <div className="col-span-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-purple-400 font-semibold text-sm">Colonne droite • {data.sections.colonne_droite.length} section(s)</div>
        </div>
        <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 h-14 flex items-center justify-center text-amber-400 font-semibold text-sm">Centre / Bas • {data.sections.centre_bas.length} section(s)</div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(Object.keys(COL_INFO) as Col[]).map(col => {
          const info = COL_INFO[col];
          return (
            <div key={col} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <info.icon size={16} className={info.color} />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">{info.label}</h2>
                  </div>
                  <p className="text-xs text-krone-500">{info.desc}</p>
                </div>
                <button onClick={() => setShowAddSection(col)} className={`p-2 rounded-xl border border-krone-600 hover:border-krone-500 ${info.color} hover:bg-krone-700 transition-colors`}>
                  <FiPlus size={15} />
                </button>
              </div>

              {data.sections[col].map(sec => {
                const open = expandedSection === sec.id;
                return (
                  <div key={sec.id} className="bg-krone-800 rounded-2xl border border-krone-700 overflow-hidden shadow-md">
                    <button onClick={() => setExpandedSection(open ? null : sec.id)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-krone-700/30 transition-colors text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-krone-700/60 flex items-center justify-center text-lg shrink-0">{sec.icon}</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{sec.name}</p>
                          <p className="text-[10px] text-krone-500">{sec.fields.length} champ(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={e => { e.stopPropagation(); deleteSection(col, sec.id); }} className="p-1.5 text-krone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                          <FiTrash2 size={13} />
                        </button>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${open ? 'bg-accent-500/20 text-accent-400' : 'bg-krone-700 text-krone-500'}`}>
                          {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                        </div>
                      </div>
                    </button>

                    {open && (
                      <div className="border-t border-krone-700/50 px-3 py-3 space-y-2 bg-krone-800/50">
                        {sec.fields.map(field => (
                          <div key={field.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-krone-700/20 hover:bg-krone-700/35 transition-colors group">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{field.label}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <code className="text-[10px] text-krone-500 font-mono">{`{{${field.id}}}`}</code>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${TYPE_COLORS[field.type] || 'bg-krone-600 text-krone-300'}`}>{field.type}</span>
                              </div>
                            </div>
                            <button onClick={() => openFieldEditor(col, sec.id, field)} className="p-1.5 text-krone-500 hover:text-accent-400 hover:bg-accent-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                              <FiEdit2 size={13} />
                            </button>
                            <button onClick={() => deleteField(col, sec.id, field.id)} className="p-1.5 text-krone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        ))}

                        {showAddField === sec.id ? (
                          <div className="p-3 bg-krone-700/30 rounded-2xl border border-dashed border-accent-500/30 space-y-3">
                            <div className="grid grid-cols-1 gap-2">
                              <input type="text" placeholder="Clé technique (ex: date_facture)" value={newField.id || ''} onChange={e => setNewField({ ...newField, id: e.target.value.replace(/\s/g, '_').toLowerCase() })}
                                className="px-3 py-2 bg-krone-700 border border-krone-600 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-accent-500" />
                              <input type="text" placeholder="Libellé visible" value={newField.label || ''} onChange={e => setNewField({ ...newField, label: e.target.value })}
                                className="px-3 py-2 bg-krone-700 border border-krone-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500" />
                              <select value={newField.type || 'text'} onChange={e => setNewField({ ...newField, type: e.target.value as PageGardeField['type'] })}
                                className="px-3 py-2 bg-krone-700 border border-krone-600 rounded-xl text-white text-sm focus:outline-none focus:border-accent-500">
                                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => addFieldInline(col, sec.id)} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-xl text-sm font-bold">Ajouter</button>
                              <button onClick={() => { setShowAddField(null); setNewField({ label: '', type: 'text', id: '' }); }} className="px-4 py-2 bg-krone-600 text-krone-300 rounded-xl text-sm">Annuler</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setShowAddField(sec.id)} className="w-full py-2.5 border border-dashed border-krone-600 rounded-2xl text-krone-500 text-sm hover:border-accent-500/50 hover:text-accent-400 transition-colors flex items-center justify-center gap-1.5">
                            <FiPlus size={13} /> Ajouter un champ
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {data.sections[col].length === 0 && (
                <div className="py-10 text-center border-2 border-dashed border-krone-700 rounded-2xl bg-krone-800/30">
                  <p className="text-krone-500 text-sm">Aucune section</p>
                  <button onClick={() => setShowAddSection(col)} className="mt-2 text-xs text-accent-400 hover:text-accent-300">Créer une section</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add section modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-krone-800 rounded-3xl border border-krone-700 p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Nouvelle section</h3>
              <button onClick={() => setShowAddSection(null)} className="p-1.5 text-krone-400 hover:text-white rounded-xl hover:bg-krone-700"><FiX size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-krone-400 mb-1.5 font-semibold uppercase">Nom de la section</label>
                <input type="text" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection(showAddSection)}
                  className="w-full px-4 py-2.5 bg-krone-700 border border-krone-600 rounded-xl text-white focus:border-accent-500 focus:outline-none" placeholder="Ex: INFORMATIONS DOUANIÈRES" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-krone-400 mb-1.5 font-semibold uppercase">Icône</label>
                <div className="grid grid-cols-6 gap-2">
                  {['📋', '🏦', '🏢', '🚢', '💰', '🚛', '📦', '🌍', '📄', '⚖️', '🔒', '📊'].map(icon => (
                    <button key={icon} onClick={() => setNewSectionIcon(icon)} className={`w-full h-10 rounded-xl text-xl flex items-center justify-center transition-all ${newSectionIcon === icon ? 'bg-accent-500/20 border-2 border-accent-500 scale-105' : 'bg-krone-700 border border-krone-600 hover:border-krone-500'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-krone-500">Colonne cible : <span className={COL_INFO[showAddSection].color}>{COL_INFO[showAddSection].label}</span></div>
              <button onClick={() => addSection(showAddSection)} className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-xl font-bold shadow-lg shadow-accent-500/20">
                Créer la section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit field modal */}
      {fieldModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-krone-800 rounded-3xl border border-krone-700 p-6 w-full max-w-2xl shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Modifier le champ</h3>
                <p className="text-sm text-krone-400">Configuration détaillée du champ sélectionné</p>
              </div>
              <button onClick={() => setFieldModal(null)} className="p-2 text-krone-400 hover:text-white rounded-xl hover:bg-krone-700"><FiX size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-krone-400 mb-1.5 font-semibold uppercase">Libellé visible</label>
                  <input type="text" value={fieldModal.field.label} onChange={e => updateFieldModal({ label: e.target.value })}
                    className="w-full px-4 py-2.5 bg-krone-700 border border-krone-600 rounded-xl text-white focus:border-accent-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-krone-400 mb-1.5 font-semibold uppercase">Clé technique</label>
                  <input type="text" value={fieldModal.field.id} onChange={e => updateFieldModal({ id: e.target.value.replace(/\s/g, '_').toLowerCase() })}
                    className="w-full px-4 py-2.5 bg-krone-700 border border-krone-600 rounded-xl text-white font-mono focus:border-accent-500 focus:outline-none" />
                  <p className="text-[11px] text-krone-500 mt-1">Utilisée dans les variables comme <code>{`{{${fieldModal.field.id}}}`}</code></p>
                </div>
                <div>
                  <label className="block text-xs text-krone-400 mb-1.5 font-semibold uppercase">Type de champ</label>
                  <select value={fieldModal.field.type} onChange={e => updateFieldModal({ type: e.target.value as PageGardeField['type'] })}
                    className="w-full px-4 py-2.5 bg-krone-700 border border-krone-600 rounded-xl text-white focus:border-accent-500 focus:outline-none">
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-krone-700/30 border border-krone-700 rounded-2xl p-4">
                  <h4 className="text-sm font-bold text-white mb-2">Aperçu du champ</h4>
                  <div className="space-y-2">
                    <label className="block text-xs text-krone-400">{fieldModal.field.label}</label>
                    <div className="px-3 py-2.5 bg-krone-700 border border-krone-600 rounded-xl text-krone-500 text-sm">Valeur de démonstration</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-accent-400 bg-krone-700/50 px-2 py-1 rounded-lg">{`{{${fieldModal.field.id}}}`}</code>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${TYPE_COLORS[fieldModal.field.type] || 'bg-krone-600 text-krone-300'}`}>{fieldModal.field.type}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-krone-700/20 border border-krone-700 rounded-2xl p-4">
                  <h4 className="text-sm font-bold text-white mb-2">Description du type</h4>
                  <p className="text-sm text-krone-300">
                    {FIELD_TYPES.find(t => t.value === fieldModal.field.type)?.desc || 'Champ personnalisé'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-krone-700">
              <button onClick={() => setFieldModal(null)} className="px-5 py-2.5 bg-krone-700 hover:bg-krone-600 text-krone-300 rounded-xl font-medium transition-colors">
                Annuler
              </button>
              <button onClick={saveFieldModal} className="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-xl font-bold transition-colors shadow-lg shadow-accent-500/20 flex items-center gap-2">
                <FiCheck size={16} /> Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
