import { useState, useRef, useCallback, memo } from 'react';
import { Client, Expedition, PageGardeStructure, Variable, FileTemplate, TemplateElement, AdvancedTableData, MerchandiseData, MarchandiseItem } from '../types';
import { FiArrowLeft, FiFileText, FiDownload, FiLayers, FiChevronDown, FiChevronRight, FiEye, FiCheck, FiTruck } from 'react-icons/fi';
import MarchandiseSection from './MarchandiseSection';

interface Props {
  client: Client;
  expedition: Expedition;
  pageGardeStructure: PageGardeStructure;
  variables: Variable[];
  templates: FileTemplate[];
  merchandiseConfig: MerchandiseData;
  onUpdateExpedition: (expedition: Expedition) => void;
  onBack: () => void;
}

// Isolated input that manages its own state — parent never re-renders it
const Field = memo(({ id, type, initial, placeholder, options, onChange }: {
  id: string; type: string; initial: string; placeholder?: string; options?: string[];
  onChange: (id: string, value: string) => void;
}) => {
  const [val, setVal] = useState(initial);
  const handleChange = (v: string) => { setVal(v); onChange(id, v); };
  const cls = "w-full px-3 py-2.5 bg-krone-700 border border-krone-600 rounded-xl text-white text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition-all placeholder-krone-500";

  if (type === 'multiline') return <textarea value={val} onChange={e => handleChange(e.target.value)} className={cls + " resize-none"} rows={4} placeholder={placeholder} />;
  if (type === 'dropdown' && options) return <select value={val} onChange={e => handleChange(e.target.value)} className={cls}><option value="">-- Sélectionner --</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>;
  return <input type={type === 'date' ? 'date' : 'text'} value={val} onChange={e => handleChange(e.target.value)} className={cls} placeholder={placeholder} />;
});

export default function ExpeditionDetail({
  client, expedition, pageGardeStructure, variables, templates, merchandiseConfig,
  onUpdateExpedition, onBack
}: Props) {
  const [activeTab, setActiveTab] = useState<'page-garde' | 'generate'>('page-garde');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['all']));
  const [generating, setGenerating] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<{ name: string; templateId?: string; type: string }[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; templateId?: string; type: string } | null>(null);
  const [marchandises, setMarchandises] = useState<MarchandiseItem[]>(() => expedition.marchandises || []);

  // All form data lives in a ref — never triggers re-renders
  const formRef = useRef<Record<string, string>>(expedition.pageGardeData || {});
  const marcRef = useRef<MarchandiseItem[]>(expedition.marchandises || []);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUpdateRef = useRef(onUpdateExpedition);
  onUpdateRef.current = onUpdateExpedition;
  const expeditionRef = useRef(expedition);
  expeditionRef.current = expedition;

  const doSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const d = formRef.current;
      const m = marcRef.current;
      const pt = m.reduce((s, x) => s + (x.poids || 0), 0);
      const chassis = m.filter(x => x.chassis).map(x => x.chassis).join(', ');
      onUpdateRef.current({
        ...expeditionRef.current,
        pageGardeData: { ...d, poids_total: pt > 0 ? `${pt} KG` : '', all_chassis: chassis },
        marchandises: m,
      });
    }, 2000);
  };

  // Field change — only updates ref and schedules save, no state change
  const handleFieldChange = useCallback((id: string, value: string) => {
    formRef.current = { ...formRef.current, [id]: value };
    doSave();
  }, []);

  const handleMarchandiseChange = useCallback((qty: number, items: MarchandiseItem[]) => {
    formRef.current = { ...formRef.current, quantite: String(qty) };
    marcRef.current = items;
    setMarchandises(items); // only this triggers re-render for the table
    doSave();
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  // Variable replacement for document generation
  const replaceVars = (text: string): string => {
    let r = text;
    const d = formRef.current, m = marcRef.current;
    variables.forEach(v => { r = r.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), d[v.key] || v.defaultValue || ''); });
    const pt = m.reduce((s, x) => s + (x.poids || 0), 0);
    r = r.replace(/\{\{poids_total\}\}/g, pt > 0 ? `${pt} KG` : '');
    r = r.replace(/\{\{all_chassis\}\}/g, m.filter(x => x.chassis).map(x => x.chassis).join(', '));
    r = r.replace(/\{\{quantite\}\}/g, String(m.length || d.quantite || ''));
    m.forEach((x, i) => {
      r = r.replace(new RegExp(`\\{\\{chassis_${i+1}\\}\\}`, 'g'), x.chassis || '');
      r = r.replace(new RegExp(`\\{\\{poids_${i+1}\\}\\}`, 'g'), x.poids ? String(x.poids) : '');
      r = r.replace(new RegExp(`\\{\\{vehicule_${i+1}\\}\\}`, 'g'), x.vehicule || '');
      r = r.replace(new RegExp(`\\{\\{type_${i+1}\\}\\}`, 'g'), x.type || '');
      r = r.replace(new RegExp(`\\{\\{marque_${i+1}\\}\\}`, 'g'), x.marque || '');
    });
    r = r.replace(/\{\{all_chassis_per_(\d+)\}\}/g, (_, ps) => { const p=+ps, a=m.filter(x=>x.chassis).map(x=>x.chassis), l:string[]=[]; for(let i=0;i<a.length;i+=p)l.push(a.slice(i,i+p).join(', ')); return l.join('\n'); });
    return r;
  };

  const resolveVar = (el: TemplateElement): string => {
    const vk = el.variableKey || '', cfg = el.varConfig, mm = marcRef.current;
    if (vk === 'all_chassis') { const a=mm.filter(x=>x.chassis).map(x=>x.chassis), p=cfg?.perLine||1; if(p<=1)return a.join('\n'); const l:string[]=[]; for(let i=0;i<a.length;i+=p)l.push(a.slice(i,i+p).join(', ')); return l.join('\n'); }
    if (vk === 'chassis_single') return mm[(cfg?.chassisNum||1)-1]?.chassis || '';
    if (vk === 'chassis_range') { const f=(cfg?.rangeFrom||1)-1,t=cfg?.rangeTo||mm.length,p=cfg?.rangePerLine||3,s=mm.slice(f,t).filter(x=>x.chassis).map(x=>x.chassis),l:string[]=[]; for(let i=0;i<s.length;i+=p)l.push(s.slice(i,i+p).join(', ')); return l.join('\n'); }
    if (vk === 'detail_unit') { const x=mm[(cfg?.unitNum||1)-1]; if(!x)return ''; const match=el.content.match(/\{\{(\w+)_\d+\}\}/),field=match?match[1]:'chassis'; return (x as unknown as Record<string,string|number>)[field]?.toString()||''; }
    return replaceVars(`{{${vk}}}`);
  };

  // HTML generators
  const elHtml = (el: TemplateElement): string => {
    const s = el.style;
    const base = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;font-size:${s.fontSize}px;font-family:${s.fontFamily};font-weight:${s.fontWeight};font-style:${s.fontStyle};color:${s.color};text-align:${s.textAlign};line-height:${s.lineHeight};padding:${s.padding}px;overflow:hidden;white-space:pre-wrap;word-break:break-word;box-sizing:border-box;${s.backgroundColor!=='transparent'?`background-color:${s.backgroundColor};`:''}${s.borderWidth>0?`border:${s.borderWidth}px ${s.borderStyle} ${s.borderColor};`:''}`;
    if(el.type==='text')return`<div style="${base}">${replaceVars(el.content)}</div>`;
    if(el.type==='variable')return`<div style="${base}">${resolveVar(el)}</div>`;
    if(el.type==='line')return`<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;border-top:${s.borderWidth||2}px ${s.borderStyle} ${s.borderColor};"></div>`;
    if(el.type==='shape')return`<div style="${base}"></div>`;
    if(el.type==='image'&&el.imageData)return`<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;"><img src="${el.imageData}" style="width:100%;height:100%;object-fit:contain;"/></div>`;
    if(el.type==='table'&&el.tableData){const{cells,colWidths,rowHeights}=el.tableData;let t=`<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;"><table style="width:100%;height:100%;border-collapse:collapse;table-layout:fixed;"><colgroup>${colWidths.map(w=>`<col style="width:${w}px"/>`).join('')}</colgroup>`;cells.forEach((row,ri)=>{t+=`<tr style="height:${rowHeights[ri]}px">`;row.forEach(cell=>{if(cell.merged)return;const cs=cell.style;t+=`<td rowspan="${cell.rowSpan}" colspan="${cell.colSpan}" style="border:${s.borderWidth||1}px solid ${s.borderColor};padding:${cs.padding}px;font-size:${cs.fontSize}px;font-family:${cs.fontFamily};font-weight:${cs.fontWeight};color:${cs.color};background:${cs.backgroundColor!=='transparent'?cs.backgroundColor:''};text-align:${cs.textAlign};vertical-align:${cs.verticalAlign};">${replaceVars(cell.content)}</td>`;});t+='</tr>';});return t+'</table></div>';}
    return'';
  };

  const tHtml = (t: FileTemplate) => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.name}</title><style>@page{size:${t.pageSize.width}px ${t.pageSize.height}px;margin:0;}body{margin:0;}.page{width:${t.pageSize.width}px;height:${t.pageSize.height}px;position:relative;background:white;}</style></head><body><div class="page">${t.elements.map(elHtml).join('')}</div></body></html>`;

  const pgHtml = () => {
    const d = formRef.current, m = marcRef.current;
    let h = '';
    [...pageGardeStructure.sections.colonne_gauche,...pageGardeStructure.sections.colonne_droite].forEach(sec => {
      h += `<div style="margin-bottom:18px;"><h2 style="font-size:13px;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px;margin:0 0 8px 0;">${sec.icon} ${sec.name}</h2><table style="width:100%;border-collapse:collapse;">`;
      sec.fields.forEach(f => { h += `<tr><td style="padding:5px 8px;border:1px solid #e5e7eb;width:40%;font-weight:600;background:#f8fafc;font-size:10px;">${f.label}</td><td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;white-space:pre-wrap;">${d[f.id]||'—'}</td></tr>`; });
      h += '</table></div>';
    });
    if (m.length > 0) {
      h += '<div style="margin-bottom:18px;"><h2 style="font-size:13px;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px;">🚛 MARCHANDISE</h2><table style="width:100%;border-collapse:collapse;font-size:10px;"><tr style="background:#f1f5f9;font-weight:bold;"><td style="border:1px solid #ddd;padding:5px;">N°</td><td style="border:1px solid #ddd;padding:5px;">Véhicule</td><td style="border:1px solid #ddd;padding:5px;">Type</td><td style="border:1px solid #ddd;padding:5px;">Marque</td><td style="border:1px solid #ddd;padding:5px;">Châssis</td><td style="border:1px solid #ddd;padding:5px;">Poids</td></tr>';
      m.forEach((x,i) => { h += `<tr><td style="border:1px solid #ddd;padding:5px;">${i+1}</td><td style="border:1px solid #ddd;padding:5px;">${x.vehicule}</td><td style="border:1px solid #ddd;padding:5px;">${x.type}</td><td style="border:1px solid #ddd;padding:5px;">${x.marque}</td><td style="border:1px solid #ddd;padding:5px;font-family:monospace;">${x.chassis}</td><td style="border:1px solid #ddd;padding:5px;">${x.poids} KG</td></tr>`; });
      const pt = m.reduce((s,x)=>s+(x.poids||0),0);
      h += `<tr style="font-weight:bold;background:#f8fafc;"><td colspan="5" style="border:1px solid #ddd;padding:5px;text-align:right;">TOTAL</td><td style="border:1px solid #ddd;padding:5px;">${pt} KG</td></tr></table></div>`;
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:18mm;}body{font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;line-height:1.4;}</style></head><body><div style="text-align:center;margin-bottom:25px;padding-bottom:12px;border-bottom:3px solid #1e3a5f;"><h1 style="font-size:22px;color:#1e3a5f;margin:0;">KRONE</h1><p style="font-size:16px;font-weight:600;margin:4px 0;">${client.name}</p><p style="font-size:12px;color:#6b7280;margin:0;">Expédition: ${expedition.name}</p></div>${h}<div style="margin-top:30px;text-align:center;font-size:9px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;">KRONE - ${new Date().toLocaleDateString('fr-FR')}</div></body></html>`;
  };

  const dl = (doc: typeof generatedDocs[0], fmt: 'pdf'|'word') => {
    const html = doc.type==='page_garde' ? pgHtml() : doc.templateId ? tHtml(templates.find(t=>t.id===doc.templateId)!) : '';
    if(!html) return;
    if(fmt==='pdf'){const w=window.open('','_blank');if(w){w.document.write(html);w.document.close();setTimeout(()=>w.print(),500);}}
    else{const b=new Blob([html],{type:'application/msword'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${doc.name}.doc`;a.click();}
  };

  const renderAdvTable = (td: AdvancedTableData, bw: number, bc: string) => (
    <table style={{width:'100%',height:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
      <colgroup>{td.colWidths.map((w,i)=><col key={i} style={{width:w}}/>)}</colgroup>
      <tbody>{td.cells.map((row,ri)=><tr key={ri} style={{height:td.rowHeights[ri]}}>{row.map((cell,ci)=>{if(cell.merged)return null;return<td key={ci} rowSpan={cell.rowSpan} colSpan={cell.colSpan} style={{border:`${bw||1}px solid ${bc}`,padding:cell.style.padding,fontSize:cell.style.fontSize,fontFamily:cell.style.fontFamily,fontWeight:cell.style.fontWeight,color:cell.style.color,backgroundColor:cell.style.backgroundColor!=='transparent'?cell.style.backgroundColor:undefined,textAlign:cell.style.textAlign as any,verticalAlign:cell.style.verticalAlign as any}}>{replaceVars(cell.content)}</td>;})}</tr>)}</tbody>
    </table>
  );

  const Sec = ({icon,name,children}:{icon:string;name:string;children:React.ReactNode}) => {
    const open = expandedSections.has(name)||expandedSections.has('all');
    return (
      <div className="bg-gradient-to-br from-krone-800 to-krone-800/80 rounded-2xl border border-krone-700/80 overflow-hidden shadow-lg shadow-black/10">
        <button onClick={()=>toggleSection(name)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-krone-700/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-krone-700/60 rounded-xl flex items-center justify-center text-lg">{icon}</div>
            <span className="font-bold text-white text-sm tracking-wide uppercase">{name}</span>
          </div>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${open?'bg-accent-500/20 text-accent-400':'bg-krone-700 text-krone-500'}`}>
            {open?<FiChevronDown size={16}/>:<FiChevronRight size={16}/>}
          </div>
        </button>
        {open && <div className="px-5 pb-5 pt-1 border-t border-krone-700/40">{children}</div>}
      </div>
    );
  };

  // Preview
  if (previewDoc) {
    const tmpl = previewDoc.templateId ? templates.find(t=>t.id===previewDoc.templateId) : null;
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 bg-krone-800 border-b border-krone-700">
          <h3 className="text-white font-semibold">{previewDoc.name}</h3>
          <div className="flex gap-3">
            <button onClick={()=>dl(previewDoc,'pdf')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm"><FiDownload size={14}/> PDF</button>
            <button onClick={()=>dl(previewDoc,'word')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm"><FiDownload size={14}/> Word</button>
            <button onClick={()=>setPreviewDoc(null)} className="px-4 py-1.5 bg-accent-500 text-krone-900 rounded-lg text-sm font-medium">Fermer</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-start justify-center p-8 bg-gray-600">
          {tmpl?(
            <div className="bg-white shadow-2xl relative" style={{width:tmpl.pageSize.width,height:tmpl.pageSize.height}}>
              {tmpl.elements.map(el=>(
                <div key={el.id} style={{position:'absolute',left:el.x,top:el.y,width:el.width,height:el.height,fontSize:el.style.fontSize,fontFamily:el.style.fontFamily,fontWeight:el.style.fontWeight,fontStyle:el.style.fontStyle,color:el.style.color,backgroundColor:el.style.backgroundColor!=='transparent'?el.style.backgroundColor:undefined,textAlign:el.style.textAlign as any,padding:el.style.padding,lineHeight:el.style.lineHeight,border:el.style.borderWidth>0?`${el.style.borderWidth}px ${el.style.borderStyle} ${el.style.borderColor}`:undefined,overflow:'hidden',whiteSpace:'pre-wrap',wordBreak:'break-word',boxSizing:'border-box'}}>
                  {el.type==='text'&&replaceVars(el.content)}
                  {el.type==='variable'&&resolveVar(el)}
                  {el.type==='line'&&<div style={{width:'100%',borderTop:`${el.style.borderWidth||2}px ${el.style.borderStyle} ${el.style.borderColor}`,position:'absolute',top:'50%'}}/>}
                  {el.type==='image'&&el.imageData&&<img src={el.imageData} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}}/>}
                  {el.type==='table'&&el.tableData&&renderAdvTable(el.tableData,el.style.borderWidth||1,el.style.borderColor)}
                </div>
              ))}
            </div>
          ):(
            <div className="bg-white shadow-2xl p-10" style={{width:794,minHeight:1123}} dangerouslySetInnerHTML={{__html:pgHtml().replace(/<html>|<\/html>|<head>.*?<\/head>|<body>|<\/body>|<!DOCTYPE html>/gs,'')}}/>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2.5 text-krone-300 hover:text-white bg-krone-800 hover:bg-krone-700 rounded-xl border border-krone-700 transition-all">
          <FiArrowLeft size={20}/>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-krone-500 uppercase tracking-widest mb-0.5">{client.name} › Expédition</p>
          <h1 className="text-2xl font-bold text-white truncate">{expedition.name}</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
          <span className="text-xs text-emerald-400 font-medium">Sauvegarde auto</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-krone-800/60 backdrop-blur-sm rounded-2xl p-1.5 w-fit border border-krone-700/50">
        <button onClick={()=>setActiveTab('page-garde')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab==='page-garde'?'bg-accent-500 text-krone-900 shadow-lg shadow-accent-500/25':'text-krone-300 hover:text-white hover:bg-krone-700/50'}`}>
          <FiLayers size={16}/> Page de garde
        </button>
        <button onClick={()=>setActiveTab('generate')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab==='generate'?'bg-accent-500 text-krone-900 shadow-lg shadow-accent-500/25':'text-krone-300 hover:text-white hover:bg-krone-700/50'}`}>
          <FiFileText size={16}/> Générer les fichiers
        </button>
      </div>

      {activeTab === 'page-garde' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-5">
              {pageGardeStructure.sections.colonne_gauche.map(sec=>(
                <Sec key={sec.id} icon={sec.icon} name={sec.name}>
                  <div className="space-y-3 pt-2">
                    {sec.fields.map(f=>(
                      <div key={f.id}>
                        <label className="block text-[11px] text-krone-400 mb-1.5 font-semibold uppercase tracking-wide">{f.label}</label>
                        <Field
                          id={f.id}
                          type={f.type}
                          initial={formRef.current[f.id] || ''}
                          placeholder={variables.find(v=>v.key===f.id)?.defaultValue}
                          options={variables.find(v=>v.key===f.id)?.options}
                          onChange={handleFieldChange}
                        />
                      </div>
                    ))}
                  </div>
                </Sec>
              ))}
            </div>
            <div className="space-y-5">
              {pageGardeStructure.sections.colonne_droite.map(sec=>(
                <Sec key={sec.id} icon={sec.icon} name={sec.name}>
                  <div className="space-y-3 pt-2">
                    {sec.fields.map(f=>(
                      <div key={f.id}>
                        <label className="block text-[11px] text-krone-400 mb-1.5 font-semibold uppercase tracking-wide">{f.label}</label>
                        <Field
                          id={f.id}
                          type={f.type}
                          initial={formRef.current[f.id] || ''}
                          placeholder={variables.find(v=>v.key===f.id)?.defaultValue}
                          options={variables.find(v=>v.key===f.id)?.options}
                          onChange={handleFieldChange}
                        />
                      </div>
                    ))}
                  </div>
                </Sec>
              ))}
            </div>
          </div>

          <MarchandiseSection
            quantite={parseInt(formRef.current.quantite||'0',10)}
            marchandises={marchandises}
            merchandiseConfig={merchandiseConfig}
            onChange={handleMarchandiseChange}
          />

          {pageGardeStructure.sections.centre_bas.map(sec=>{
            const fields = sec.fields.filter(f=>!['quantite','nom_remorque','poids_total'].includes(f.id));
            if(!fields.length)return null;
            return(
              <Sec key={sec.id} icon={sec.icon} name={sec.name}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {fields.map(f=>(
                    <div key={f.id} className={f.type==='multiline'?'md:col-span-2':''}>
                      <label className="block text-[11px] text-krone-400 mb-1.5 font-semibold uppercase tracking-wide">{f.label}</label>
                      <Field
                        id={f.id}
                        type={f.type}
                        initial={formRef.current[f.id] || ''}
                        placeholder={variables.find(v=>v.key===f.id)?.defaultValue}
                        options={variables.find(v=>v.key===f.id)?.options}
                        onChange={handleFieldChange}
                      />
                    </div>
                  ))}
                </div>
              </Sec>
            );
          })}
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-krone-800 to-krone-700/50 rounded-2xl border border-krone-700 p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-accent-500/20 rounded-2xl flex items-center justify-center"><FiFileText size={28} className="text-accent-400"/></div>
              <div><h2 className="text-xl font-bold text-white">Générer les documents</h2><p className="text-sm text-krone-400">{templates.length} template(s) + Page de garde</p></div>
            </div>
            <button onClick={()=>{setGenerating(true);setTimeout(()=>{setGeneratedDocs([{name:`Page de garde - ${client.name}`,type:'page_garde'},...templates.map(t=>({name:`${t.name} - ${client.name}`,templateId:t.id,type:t.type}))]);setGenerating(false);},800);}}
              disabled={generating}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all ${generating?'bg-krone-600 text-krone-400':'bg-accent-500 hover:bg-accent-600 text-krone-900 shadow-xl shadow-accent-500/25'}`}>
              {generating?<><div className="w-5 h-5 border-2 border-krone-400 border-t-transparent rounded-full animate-spin"/> Génération...</>:<><FiTruck size={20}/> Générer tous les fichiers</>}
            </button>
          </div>

          {generatedDocs.length>0&&(
            <div className="space-y-3 animate-fade-in">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><FiCheck className="text-emerald-400" size={20}/> {generatedDocs.length} document(s)</h3>
              {generatedDocs.map((doc,i)=>(
                <div key={i} className="bg-krone-800 rounded-xl border border-krone-700 p-4 flex items-center justify-between hover:border-krone-600 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-emerald-500/15 rounded-xl flex items-center justify-center"><FiFileText size={20} className="text-emerald-400"/></div>
                    <div><p className="text-white font-semibold">{doc.name}</p><p className="text-xs text-krone-500 capitalize">{doc.type.replace(/_/g,' ')}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>setPreviewDoc(doc)} className="flex items-center gap-1.5 px-3 py-2 bg-krone-700 hover:bg-krone-600 text-krone-300 rounded-lg text-sm"><FiEye size={14}/> Aperçu</button>
                    <button onClick={()=>dl(doc,'pdf')} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm"><FiDownload size={14}/> PDF</button>
                    <button onClick={()=>dl(doc,'word')} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm"><FiDownload size={14}/> Word</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
