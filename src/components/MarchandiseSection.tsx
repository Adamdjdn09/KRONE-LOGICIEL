import { useState, useRef, useEffect } from 'react';
import { MarchandiseItem, MerchandiseData } from '../types';
import { FiTruck, FiHash, FiZap, FiPackage, FiTag, FiAward } from 'react-icons/fi';

interface Props {
  quantite: number;
  marchandises: MarchandiseItem[];
  merchandiseConfig: MerchandiseData;
  onChange: (quantite: number, items: MarchandiseItem[]) => void;
}

export default function MarchandiseSection({ quantite, marchandises, merchandiseConfig, onChange }: Props) {
  const [qtyText, setQtyText] = useState(quantite > 0 ? String(quantite) : '');
  const didInit = useRef(false);
  useEffect(() => { if (!didInit.current && quantite > 0) { setQtyText(String(quantite)); didInit.current = true; } }, [quantite]);

  const [sameVehicule, setSameVehicule] = useState(false);
  const [sameType, setSameType] = useState(false);
  const [sameMarque, setSameMarque] = useState(false);
  const [samePoids, setSamePoids] = useState(false);
  const [autoChassis, setAutoChassis] = useState(false);
  const [gVehicule, setGVehicule] = useState('');
  const [gType, setGType] = useState('');
  const [gMarque, setGMarque] = useState('');
  const [gPoids, setGPoids] = useState('');
  const [chassisBase, setChassisBase] = useState('');

  const items = marchandises;
  const poidsTotal = items.reduce((s, m) => s + (m.poids || 0), 0);

  const push = (q: number, list: MarchandiseItem[]) => onChange(q, list);

  const buildItems = (count: number, src: MarchandiseItem[]) => {
    const r = [...src];
    while (r.length < count) r.push({ vehicule: '', type: '', marque: '', chassis: '', poids: 0 });
    if (count < r.length) r.length = count;
    return r;
  };

  const handleQty = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setQtyText(cleaned);
    const n = cleaned === '' ? 0 : parseInt(cleaned, 10);
    push(n, buildItems(n, items));
  };

  const updateItem = (i: number, field: keyof MarchandiseItem, val: string | number) => {
    const list = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    push(quantite, list);
  };

  const applyAll = (field: keyof MarchandiseItem, val: string | number) => {
    push(quantite, items.map(it => ({ ...it, [field]: val })));
  };

  // Toggle helpers
  const doToggle = (field: 'vehicule' | 'type' | 'marque' | 'poids', active: boolean, gVal: string, setActive: (v: boolean) => void) => {
    const next = !active;
    setActive(next);
    if (next && gVal) {
      applyAll(field, field === 'poids' ? (parseFloat(gVal) || 0) : gVal);
    }
  };

  const doGlobal = (field: 'vehicule' | 'type' | 'marque' | 'poids', val: string, active: boolean, setVal: (v: string) => void) => {
    setVal(val);
    if (active) applyAll(field, field === 'poids' ? (parseFloat(val) || 0) : val);
  };

  // Auto chassis
  const applyChassis = () => {
    if (!chassisBase || items.length === 0) return;
    const m = chassisBase.match(/^(.*?)(\d+)$/);
    let list: MarchandiseItem[];
    if (m) {
      const pfx = m[1], start = parseInt(m[2], 10), pad = m[2].length;
      list = items.map((it, i) => ({ ...it, chassis: pfx + String(start + i).padStart(pad, '0') }));
    } else {
      list = items.map((it, i) => ({ ...it, chassis: `${chassisBase}${i + 1}` }));
    }
    push(quantite, list);
  };

  const preview = (() => {
    if (!chassisBase) return '';
    const m = chassisBase.match(/^(.*?)(\d+)$/);
    if (m) { const p = m[1], n = parseInt(m[2]), l = m[2].length; return [0,1,2].map(i => p + String(n+i).padStart(l,'0')).join(', ') + '…'; }
    return [1,2,3].map(i => `${chassisBase}${i}`).join(', ') + '…';
  })();

  const count = items.length;

  const Tog = ({ on, press, label, icon: I, c }: { on: boolean; press: () => void; label: string; icon: React.ElementType; c: string }) => (
    <button type="button" onClick={e => { e.preventDefault(); press(); }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border select-none transition-all ${on ? `${c} border-current bg-current/10` : 'text-krone-400 border-krone-600 hover:border-krone-500 bg-krone-700/30'}`}>
      <span className={`inline-block w-9 h-5 rounded-full relative shrink-0 ${on ? 'bg-current/40' : 'bg-krone-600'}`}>
        <span className={`absolute top-[3px] w-3.5 h-3.5 rounded-full shadow transition-all ${on ? 'left-[18px] bg-white' : 'left-[3px] bg-krone-400'}`} />
      </span>
      <I size={14} /><span className="whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <div className="bg-krone-800 rounded-2xl border border-krone-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-krone-700 bg-gradient-to-r from-krone-800 to-krone-700/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center"><FiPackage size={20} className="text-emerald-400" /></div>
          <div className="flex-1"><h3 className="font-bold text-white">🚛 MARCHANDISE</h3><p className="text-xs text-krone-400">Détails de chaque unité</p></div>
          {count > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-krone-400">Poids total :</span>
              <div className="px-4 py-1.5 bg-accent-500/15 border border-accent-500/30 rounded-xl min-w-[100px] text-center">
                <span className="text-xl font-bold text-accent-400">{poidsTotal.toLocaleString('fr-FR')}</span>
                <span className="text-xs text-accent-400/70 ml-1">KG</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-b border-krone-700">
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            <label className="block text-xs text-krone-300 mb-1.5 font-semibold">QUANTITÉ</label>
            <input type="text" inputMode="numeric" value={qtyText} onChange={e => handleQty(e.target.value)}
              className="w-24 px-4 py-3 bg-krone-700 border-2 border-krone-600 rounded-xl text-white text-2xl font-bold text-center focus:border-accent-500 focus:outline-none" placeholder="0" />
          </div>
          {count > 0 && (
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-krone-300 mb-1.5 font-semibold">REMPLISSAGE RAPIDE</label>
              <div className="flex flex-wrap gap-2">
                <Tog on={sameVehicule} press={() => doToggle('vehicule', sameVehicule, gVehicule, setSameVehicule)} label="Même véhicule" icon={FiTruck} c="text-blue-400" />
                <Tog on={sameType} press={() => doToggle('type', sameType, gType, setSameType)} label="Même type" icon={FiTag} c="text-purple-400" />
                <Tog on={sameMarque} press={() => doToggle('marque', sameMarque, gMarque, setSameMarque)} label="Même marque" icon={FiAward} c="text-amber-400" />
                <Tog on={samePoids} press={() => doToggle('poids', samePoids, gPoids, setSamePoids)} label="Même poids" icon={FiHash} c="text-green-400" />
              </div>
              {(sameVehicule || sameType || sameMarque || samePoids) && (
                <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {sameVehicule && <div><label className="block text-[10px] text-blue-400 mb-1 font-bold uppercase">Véhicule</label><select value={gVehicule} onChange={e => doGlobal('vehicule', e.target.value, sameVehicule, setGVehicule)} className="w-full px-2.5 py-2 bg-krone-700 border border-blue-500/40 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"><option value="">--</option>{merchandiseConfig.vehicules.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}</select></div>}
                  {sameType && <div><label className="block text-[10px] text-purple-400 mb-1 font-bold uppercase">Type</label><select value={gType} onChange={e => doGlobal('type', e.target.value, sameType, setGType)} className="w-full px-2.5 py-2 bg-krone-700 border border-purple-500/40 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"><option value="">--</option>{merchandiseConfig.types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>}
                  {sameMarque && <div><label className="block text-[10px] text-amber-400 mb-1 font-bold uppercase">Marque</label><select value={gMarque} onChange={e => doGlobal('marque', e.target.value, sameMarque, setGMarque)} className="w-full px-2.5 py-2 bg-krone-700 border border-amber-500/40 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none"><option value="">--</option>{merchandiseConfig.marques.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select></div>}
                  {samePoids && <div><label className="block text-[10px] text-green-400 mb-1 font-bold uppercase">Poids (KG)</label><input type="text" inputMode="numeric" value={gPoids} onChange={e => doGlobal('poids', e.target.value, samePoids, setGPoids)} className="w-full px-2.5 py-2 bg-krone-700 border border-green-500/40 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none" placeholder="KG" /></div>}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Tog on={autoChassis} press={() => setAutoChassis(!autoChassis)} label="Auto châssis" icon={FiZap} c="text-cyan-400" />
                {autoChassis && <>
                  <input type="text" value={chassisBase} onChange={e => setChassisBase(e.target.value.toUpperCase())} placeholder="Ex: ABC100" className="w-36 px-3 py-2 bg-krone-700 border border-cyan-500/40 rounded-lg text-white text-sm font-mono focus:border-cyan-500 focus:outline-none" />
                  <button type="button" onClick={applyChassis} className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold"><FiZap size={14} /> Appliquer</button>
                  {preview && <span className="text-xs text-krone-500 font-mono">→ {preview}</span>}
                </>}
              </div>
            </div>
          )}
        </div>
      </div>

      {count > 0 && <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead><tr className="bg-krone-700/40">
              <th className="px-3 py-2.5 text-center text-[10px] font-bold text-krone-300 uppercase w-12 border-b border-krone-600">N°</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-krone-300 uppercase border-b border-krone-600">Véhicule</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-krone-300 uppercase border-b border-krone-600">Type</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-krone-300 uppercase border-b border-krone-600">Marque</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-krone-300 uppercase border-b border-krone-600">N° Châssis</th>
              <th className="px-3 py-2.5 text-center text-[10px] font-bold text-krone-300 uppercase w-28 border-b border-krone-600">Poids (KG)</th>
            </tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className={`${i % 2 === 0 ? 'bg-krone-800' : 'bg-krone-800/50'} hover:bg-krone-700/30`}>
                  <td className="px-3 py-1.5 text-center border-b border-krone-700/20"><span className="inline-flex items-center justify-center w-7 h-7 bg-accent-500/15 text-accent-400 rounded-md text-xs font-bold">{i+1}</span></td>
                  <td className="px-2 py-1.5 border-b border-krone-700/20"><select value={it.vehicule} onChange={e => updateItem(i,'vehicule',e.target.value)} className="w-full px-2 py-1.5 bg-krone-700/60 border border-krone-600/60 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"><option value="">—</option>{merchandiseConfig.vehicules.map(v=><option key={v.id} value={v.name}>{v.name}</option>)}</select></td>
                  <td className="px-2 py-1.5 border-b border-krone-700/20"><select value={it.type} onChange={e => updateItem(i,'type',e.target.value)} className="w-full px-2 py-1.5 bg-krone-700/60 border border-krone-600/60 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"><option value="">—</option>{merchandiseConfig.types.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}</select></td>
                  <td className="px-2 py-1.5 border-b border-krone-700/20"><select value={it.marque} onChange={e => updateItem(i,'marque',e.target.value)} className="w-full px-2 py-1.5 bg-krone-700/60 border border-krone-600/60 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none"><option value="">—</option>{merchandiseConfig.marques.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}</select></td>
                  <td className="px-2 py-1.5 border-b border-krone-700/20"><input type="text" value={it.chassis} onChange={e => updateItem(i,'chassis',e.target.value.toUpperCase())} placeholder="N° châssis" className="w-full px-2 py-1.5 bg-krone-700/60 border border-krone-600/60 rounded-lg text-white text-sm font-mono uppercase focus:border-cyan-500 focus:outline-none" /></td>
                  <td className="px-2 py-1.5 border-b border-krone-700/20"><input type="text" inputMode="numeric" value={it.poids||''} onChange={e=>{const v=e.target.value.replace(/[^\d.]/g,'');updateItem(i,'poids',v===''?0:parseFloat(v)||0)}} placeholder="0" className="w-full px-2 py-1.5 bg-krone-700/60 border border-krone-600/60 rounded-lg text-white text-sm text-center font-mono focus:border-green-500 focus:outline-none" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t-2 border-accent-500/20 bg-krone-700/20 flex items-center justify-between">
          <span className="text-sm text-krone-400">{count} unité(s)</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-krone-300">POIDS TOTAL :</span>
            <span className="text-2xl font-bold text-accent-400">{poidsTotal.toLocaleString('fr-FR')}</span>
            <span className="text-sm text-accent-400/70">KG</span>
          </div>
        </div>
      </>}

      {count === 0 && <div className="px-5 py-10 text-center"><FiPackage size={36} className="mx-auto text-krone-600 mb-3" /><p className="text-krone-400 text-sm">Saisissez une quantité pour configurer les marchandises</p></div>}
    </div>
  );
}
