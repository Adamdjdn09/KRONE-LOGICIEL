import { useState, useCallback, useRef } from 'react';
import { AppView, Variable, PageGardeStructure, FileTemplate, Client, MerchandiseData } from './types';
import {
  getVariables, saveVariables,
  getPageGardeStructure, savePageGardeStructure,
  getTemplates, saveTemplates, saveSingleTemplate,
  getClients, saveClients,
  getMarchandise, saveMarchandise,
  exportAllData, importAllData,
} from './store';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VariablesManager from './components/VariablesManager';
import PageGardeManager from './components/PageGardeManager';
import FileTemplatesList from './components/FileTemplatesList';
import TemplateEditor from './components/TemplateEditor';
import ClientsManager from './components/ClientsManager';
import ClientDetail from './components/ClientDetail';
import ExpeditionDetail from './components/ExpeditionDetail';
import ConfigurationPanel from './components/ConfigurationPanel';
import MarchandiseManager from './components/MarchandiseManager';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [variables, setVariables] = useState<Variable[]>(getVariables());
  const [pageGardeStructure, setPageGardeStructure] = useState<PageGardeStructure>(getPageGardeStructure());
  const [templates, setTemplatesState] = useState<FileTemplate[]>(getTemplates());
  const [clients, setClientsState] = useState<Client[]>(getClients());
  const [marchandise, setMarchandise] = useState<MerchandiseData>(getMarchandise());
  
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedExpeditionId, setSelectedExpeditionId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Use refs for latest state to avoid stale closures
  const clientsRef = useRef(clients);
  clientsRef.current = clients;

  const handleSaveVariables = useCallback((vars: Variable[]) => {
    setVariables(vars); saveVariables(vars);
  }, []);

  const handleSavePageGarde = useCallback((structure: PageGardeStructure) => {
    setPageGardeStructure(structure); savePageGardeStructure(structure);
  }, []);

  const handleSaveTemplates = useCallback((t: FileTemplate[]) => {
    setTemplatesState(t); saveTemplates(t);
  }, []);

  const handleSaveClients = useCallback((c: Client[]) => {
    setClientsState(c); saveClients(c);
  }, []);

  const handleSaveMarchandise = useCallback((data: MerchandiseData) => {
    setMarchandise(data); saveMarchandise(data);
  }, []);

  const handleNavigate = useCallback((view: AppView) => {
    setCurrentView(view);
    if (view === 'clients') { setSelectedClientId(null); setSelectedExpeditionId(null); }
    if (view === 'settings-fichiers') { setEditingTemplateId(null); }
  }, []);

  // Use ref-based update to avoid stale closures
  const handleUpdateClient = useCallback((updatedClient: Client) => {
    setClientsState(prev => {
      const updated = prev.map(c => c.id === updatedClient.id ? updatedClient : c);
      saveClients(updated);
      return updated;
    });
  }, []);

  const handleUpdateExpedition = useCallback((expedition: any) => {
    if (!expedition) return;
    setClientsState(prev => {
      const updated = prev.map(c => {
        const hasExp = c.expeditions.some(e => e.id === expedition.id);
        if (!hasExp) return c;
        return { ...c, expeditions: c.expeditions.map(e => e.id === expedition.id ? expedition : e) };
      });
      saveClients(updated);
      return updated;
    });
  }, []);

  const handleSaveTemplate = useCallback((template: FileTemplate) => {
    saveSingleTemplate(template); // Save only this template
    setTemplatesState(prev => prev.map(t => t.id === template.id ? template : t));
  }, []);

  // Derived state (always computed from latest)
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedExpedition = selectedClient?.expeditions.find(e => e.id === selectedExpeditionId);
  const editingTemplate = templates.find(t => t.id === editingTemplateId);

  const handleExportData = useCallback(() => exportAllData(), []);

  const handleImportData = useCallback((jsonString: string) => {
    const ok = importAllData(jsonString);
    if (ok) {
      setVariables(getVariables());
      setPageGardeStructure(getPageGardeStructure());
      setTemplatesState(getTemplates());
      setClientsState(getClients());
      setMarchandise(getMarchandise());
    }
    return ok;
  }, []);

  const renderContent = () => {
    if (currentView === 'settings-fichiers' && editingTemplateId && editingTemplate) {
      return <TemplateEditor template={editingTemplate} variables={variables} onSave={handleSaveTemplate} onBack={() => setEditingTemplateId(null)} />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard clients={clients} templates={templates} onNavigate={handleNavigate} />;
      case 'settings-variables': return <VariablesManager variables={variables} onSave={handleSaveVariables} />;
      case 'settings-page-garde': return <PageGardeManager structure={pageGardeStructure} onSave={handleSavePageGarde} />;
      case 'settings-fichiers': return <FileTemplatesList templates={templates} onSave={handleSaveTemplates} onEdit={(id) => setEditingTemplateId(id)} />;
      case 'settings-configuration': return <ConfigurationPanel onExportData={handleExportData} onImportData={handleImportData} />;
      case 'settings-marchandise': return <MarchandiseManager data={marchandise} onSave={handleSaveMarchandise} />;
      case 'clients':
        if (selectedExpeditionId && selectedClient && selectedExpedition) {
          return <ExpeditionDetail client={selectedClient} expedition={selectedExpedition} pageGardeStructure={pageGardeStructure} variables={variables} templates={templates} merchandiseConfig={marchandise} onUpdateExpedition={handleUpdateExpedition} onBack={() => setSelectedExpeditionId(null)} />;
        }
        if (selectedClientId && selectedClient) {
          return <ClientDetail client={selectedClient} onUpdateClient={handleUpdateClient} onBack={() => setSelectedClientId(null)} onSelectExpedition={(expId) => setSelectedExpeditionId(expId)} />;
        }
        return <ClientsManager clients={clients} onSave={handleSaveClients} onSelectClient={(id) => setSelectedClientId(id)} />;
      default: return <Dashboard clients={clients} templates={templates} onNavigate={handleNavigate} />;
    }
  };

  const isFullScreen = currentView === 'settings-fichiers' && editingTemplateId && editingTemplate;
  if (isFullScreen) return <div className="h-screen overflow-hidden">{renderContent()}</div>;

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}
