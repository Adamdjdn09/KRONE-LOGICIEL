import { Variable, PageGardeStructure, FileTemplate, Client, MerchandiseData } from './types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// STORAGE KEYS — chaque donnée a sa propre clé dans localStorage
// ============================================================
const K = {
  VARIABLES: 'krone_variables',
  PAGE_GARDE: 'krone_page_garde',
  TEMPLATES: 'krone_templates',
  TEMPLATE_PREFIX: 'krone_template_', // each template: krone_template_{id}
  CLIENTS: 'krone_clients',
  CLIENT_PREFIX: 'krone_client_', // each client: krone_client_{id}
  EXPEDITION_PREFIX: 'krone_expedition_', // each expedition: krone_expedition_{id}
  MARCHANDISE: 'krone_marchandise',
  APP_SETTINGS: 'krone_app_settings',
};

// ============================================================
// HELPERS
// ============================================================
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    return fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Save error:', key, e);
  }
}

// ============================================================
// DEFAULT DATA
// ============================================================
const defaultVariables: Variable[] = [
  { id: uuidv4(), name: 'Numéro de facture', key: 'facture', type: 'text', defaultValue: '', category: 'Projet' },
  { id: uuidv4(), name: 'Date de facture', key: 'date_facture', type: 'date', defaultValue: '', category: 'Projet' },
  { id: uuidv4(), name: 'Numéro de proforma', key: 'numero_proforma', type: 'text', defaultValue: '', category: 'Projet' },
  { id: uuidv4(), name: 'Date de proforma', key: 'date_proforma', type: 'date', defaultValue: '', category: 'Projet' },
  { id: uuidv4(), name: 'Date de création', key: 'date_creation', type: 'date', defaultValue: '', category: 'Projet' },
  { id: uuidv4(), name: 'Lieu', key: 'lieu', type: 'text', defaultValue: 'Alger', category: 'Projet' },
  { id: uuidv4(), name: 'Nom du client', key: 'nom_client', type: 'text', defaultValue: '', category: 'Client' },
  { id: uuidv4(), name: 'Adresse client', key: 'adresse_client', type: 'text', defaultValue: '', category: 'Client' },
  { id: uuidv4(), name: 'NIF Client', key: 'nif_client', type: 'text', defaultValue: '', category: 'Client' },
  { id: uuidv4(), name: 'Nom Fournisseur', key: 'nom_distributeur', type: 'text', defaultValue: 'KRONE', category: 'Client' },
  { id: uuidv4(), name: 'Banque', key: 'choix_banque', type: 'dropdown', defaultValue: '', options: ['FRANSABANK', 'BNP PARIBAS', 'SOCIETE GENERALE', 'AGB'], category: 'Banque' },
  { id: uuidv4(), name: 'Nom de la banque', key: 'nom_banque', type: 'text', defaultValue: '', category: 'Banque' },
  { id: uuidv4(), name: 'Adresse banque', key: 'adresse_banque', type: 'text', defaultValue: '', category: 'Banque' },
  { id: uuidv4(), name: 'Référence L/C', key: 'ref_banque', type: 'text', defaultValue: '', category: 'Banque' },
  { id: uuidv4(), name: 'Référence de banque', key: 'occh_number', type: 'text', defaultValue: '', category: 'Banque' },
  { id: uuidv4(), name: 'Documents requis', key: 'documents_requis', type: 'multiline', defaultValue: '', category: 'Banque' },
  { id: uuidv4(), name: 'Port d\'embarquement', key: 'port_embarquement', type: 'text', defaultValue: '', category: 'Transport' },
  { id: uuidv4(), name: 'Port de destination', key: 'port_destination', type: 'text', defaultValue: '', category: 'Transport' },
  { id: uuidv4(), name: 'Conditions de transport', key: 'conditions_transport', type: 'multiline', defaultValue: '', category: 'Transport' },
  { id: uuidv4(), name: 'Prix unitaire remorque', key: 'prix_unitaire_remorque', type: 'text', defaultValue: '', category: 'Commercial' },
  { id: uuidv4(), name: 'Prix unitaire transport', key: 'prix_unitaire_transport', type: 'text', defaultValue: '', category: 'Commercial' },
  { id: uuidv4(), name: 'Conditions de paiement', key: 'conditions_paiement', type: 'text', defaultValue: '', category: 'Commercial' },
  { id: uuidv4(), name: 'Quantité', key: 'quantite', type: 'number', defaultValue: '', category: 'Marchandise' },
  { id: uuidv4(), name: 'Origine marchandise', key: 'origine_marchandise', type: 'text', defaultValue: 'EUROPEAN UNION', category: 'Marchandise' },
  { id: uuidv4(), name: 'Poids total (auto)', key: 'poids_total', type: 'text', defaultValue: '', category: 'Marchandise - Auto' },
  { id: uuidv4(), name: 'Tous les châssis (liste)', key: 'all_chassis', type: 'multiline', defaultValue: '', category: 'Marchandise - Auto' },
  { id: uuidv4(), name: 'Châssis N° (individuel)', key: 'chassis_single', type: 'text', defaultValue: '', category: 'Marchandise - Auto' },
];

const defaultPageGarde: PageGardeStructure = {
  version: "4.2",
  created_date: new Date().toISOString().split('T')[0],
  description: "Structure page de garde",
  sections: {
    colonne_gauche: [
      { id: uuidv4(), name: "IDENTIFICATION DU PROJET", icon: "📋", position: "haut_gauche", fields: [
        { id: "facture", label: "N° de facture", type: "text" },
        { id: "date_facture", label: "Date de facture", type: "text" },
        { id: "numero_proforma", label: "N° de proforma", type: "text" },
        { id: "date_proforma", label: "Date de proforma", type: "text" },
        { id: "date_creation", label: "Date de création du fichier", type: "text" },
        { id: "lieu", label: "Lieu de création du fichier", type: "text" }
      ]},
      { id: uuidv4(), name: "INFORMATIONS BANCAIRES", icon: "🏦", position: "bas_gauche", fields: [
        { id: "choix_banque", label: "Banque à utiliser", type: "dropdown" },
        { id: "nom_banque", label: "Nom de la banque", type: "text" },
        { id: "adresse_banque", label: "Adresse banque", type: "text" },
        { id: "ref_banque", label: "20 - Référence L/C", type: "text" },
        { id: "occh_number", label: "Référence de banque", type: "text" },
        { id: "documents_requis", label: "Documents requis", type: "multiline" }
      ]}
    ],
    colonne_droite: [
      { id: uuidv4(), name: "INFORMATIONS CLIENT", icon: "🏢", position: "haut_droite", fields: [
        { id: "nom_client", label: "50 - Nom du client", type: "multiline" },
        { id: "adresse_client", label: "50 - Adresse client", type: "text" },
        { id: "nif_client", label: "NIF Client", type: "text" },
        { id: "nom_distributeur", label: "59 - Nom Fournisseur", type: "text" }
      ]},
      { id: uuidv4(), name: "TRANSPORT ET LOGISTIQUE", icon: "🚢", position: "milieu_droite", fields: [
        { id: "port_embarquement", label: "44E - Port d'embarquement", type: "text" },
        { id: "port_destination", label: "44F - Port de destination", type: "text" },
        { id: "conditions_transport", label: "Conditions de transport", type: "multiline" }
      ]},
      { id: uuidv4(), name: "ASPECTS COMMERCIAUX", icon: "💰", position: "bas_droite", fields: [
        { id: "prix_unitaire_remorque", label: "Prix unitaire remorque", type: "text" },
        { id: "prix_unitaire_transport", label: "Prix unitaire transport", type: "text" },
        { id: "conditions_paiement", label: "Conditions de paiement", type: "text" }
      ]}
    ],
    centre_bas: [
      { id: uuidv4(), name: "MARCHANDISE", icon: "🚛", position: "centre_large", fields: [
        { id: "quantite", label: "45A - Quantité", type: "quantity_single_line" },
        { id: "nom_remorque", label: "Numéros de châssis avec poids", type: "dynamic_chassis" },
        { id: "origine_marchandise", label: "45A - Origine", type: "text" },
        { id: "poids_total", label: "Poids total", type: "calculated" }
      ]}
    ]
  }
};

const defaultMarchandise: MerchandiseData = {
  vehicules: [],
  types: [],
  marques: [],
};

// ============================================================
// VARIABLES
// ============================================================
export function getVariables(): Variable[] {
  return load(K.VARIABLES, defaultVariables);
}
export function saveVariables(vars: Variable[]): void {
  save(K.VARIABLES, vars);
}

// ============================================================
// PAGE DE GARDE STRUCTURE
// ============================================================
export function getPageGardeStructure(): PageGardeStructure {
  return load(K.PAGE_GARDE, defaultPageGarde);
}
export function savePageGardeStructure(structure: PageGardeStructure): void {
  save(K.PAGE_GARDE, structure);
}

// ============================================================
// TEMPLATES — index + individual files
// ============================================================
export function getTemplates(): FileTemplate[] {
  // Load index of template IDs
  const ids: string[] = load(K.TEMPLATES, []);
  if (ids.length === 0) return [];

  // Load each template individually
  return ids.map(id => load<FileTemplate | null>(K.TEMPLATE_PREFIX + id, null)).filter(Boolean) as FileTemplate[];
}

export function saveTemplates(templates: FileTemplate[]): void {
  // Save index
  save(K.TEMPLATES, templates.map(t => t.id));

  // Save each template individually
  templates.forEach(t => {
    save(K.TEMPLATE_PREFIX + t.id, t);
  });

  // Clean up deleted templates
  const validIds = new Set(templates.map(t => t.id));
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith(K.TEMPLATE_PREFIX)) {
      const id = key.replace(K.TEMPLATE_PREFIX, '');
      if (!validIds.has(id)) {
        localStorage.removeItem(key);
      }
    }
  });
}

// Save a single template without rewriting all
export function saveSingleTemplate(template: FileTemplate): void {
  save(K.TEMPLATE_PREFIX + template.id, template);

  // Ensure it's in the index
  const ids: string[] = load(K.TEMPLATES, []);
  if (!ids.includes(template.id)) {
    save(K.TEMPLATES, [...ids, template.id]);
  }
}

// ============================================================
// CLIENTS — index + individual clients + individual expeditions
// ============================================================
export function getClients(): Client[] {
  const ids: string[] = load(K.CLIENTS, []);
  if (ids.length === 0) return [];

  return ids.map(id => {
    const client = load<Client | null>(K.CLIENT_PREFIX + id, null);
    if (!client) return null;

    // Load each expedition individually
    const expIds: string[] = client.expeditions?.map((e: any) => typeof e === 'string' ? e : e.id) || [];
    client.expeditions = expIds.map(eid => {
      const exp = load<any>(K.EXPEDITION_PREFIX + eid, null);
      if (exp) return exp;
      // Fallback: expedition is stored inline (old format)
      const inlineExp = (client as any)._expeditions?.find((e: any) => e.id === eid);
      return inlineExp || null;
    }).filter(Boolean);

    return client;
  }).filter(Boolean) as Client[];
}

export function saveClients(clients: Client[]): void {
  // Save index of client IDs
  save(K.CLIENTS, clients.map(c => c.id));

  // Save each client (with expedition IDs only, not full data)
  clients.forEach(c => {
    // Save each expedition individually
    c.expeditions.forEach(exp => {
      save(K.EXPEDITION_PREFIX + exp.id, exp);
    });

    // Save client with expedition ID references
    const clientForStorage = {
      ...c,
      expeditions: c.expeditions.map(e => ({ id: e.id })), // Only store IDs
    };
    save(K.CLIENT_PREFIX + c.id, clientForStorage);
  });

  // Clean up deleted clients and expeditions
  const validClientIds = new Set(clients.map(c => c.id));
  const validExpIds = new Set(clients.flatMap(c => c.expeditions.map(e => e.id)));

  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith(K.CLIENT_PREFIX)) {
      const id = key.replace(K.CLIENT_PREFIX, '');
      if (!validClientIds.has(id)) localStorage.removeItem(key);
    }
    if (key.startsWith(K.EXPEDITION_PREFIX)) {
      const id = key.replace(K.EXPEDITION_PREFIX, '');
      if (!validExpIds.has(id)) localStorage.removeItem(key);
    }
  });
}

// Save a single expedition without rewriting everything
export function saveSingleExpedition(expedition: any): void {
  save(K.EXPEDITION_PREFIX + expedition.id, expedition);
}

// ============================================================
// MARCHANDISE CONFIG
// ============================================================
export function getMarchandise(): MerchandiseData {
  return load(K.MARCHANDISE, defaultMarchandise);
}
export function saveMarchandise(data: MerchandiseData): void {
  save(K.MARCHANDISE, data);
}

// ============================================================
// EXPORT / IMPORT — full backup
// ============================================================
export function exportAllData(): string {
  const data = {
    _krone_export: true,
    version: '4.3',
    exportDate: new Date().toISOString(),
    variables: getVariables(),
    pageGardeStructure: getPageGardeStructure(),
    templates: getTemplates(),
    clients: getClients(),
    marchandise: getMarchandise(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (!data._krone_export && !data.version) return false;

    if (data.variables) saveVariables(data.variables);
    if (data.pageGardeStructure) savePageGardeStructure(data.pageGardeStructure);
    if (data.templates) saveTemplates(data.templates);
    if (data.clients) saveClients(data.clients);
    if (data.marchandise) saveMarchandise(data.marchandise);

    return true;
  } catch {
    return false;
  }
}

// ============================================================
// STORAGE INFO
// ============================================================
export function getStorageInfo(): { totalSize: string; breakdown: { label: string; size: string; count: number }[] } {
  let total = 0;
  const counts = { variables: 0, pageGarde: 0, templates: 0, clients: 0, expeditions: 0, marchandise: 0, other: 0 };
  const sizes = { variables: 0, pageGarde: 0, templates: 0, clients: 0, expeditions: 0, marchandise: 0, other: 0 };

  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith('krone_')) continue;
    const size = (localStorage.getItem(key)?.length || 0) * 2;
    total += size;

    if (key === K.VARIABLES) { counts.variables = 1; sizes.variables += size; }
    else if (key === K.PAGE_GARDE) { counts.pageGarde = 1; sizes.pageGarde += size; }
    else if (key.startsWith(K.TEMPLATE_PREFIX) || key === K.TEMPLATES) { counts.templates++; sizes.templates += size; }
    else if (key.startsWith(K.CLIENT_PREFIX) || key === K.CLIENTS) { counts.clients++; sizes.clients += size; }
    else if (key.startsWith(K.EXPEDITION_PREFIX)) { counts.expeditions++; sizes.expeditions += size; }
    else if (key === K.MARCHANDISE) { counts.marchandise = 1; sizes.marchandise += size; }
    else { counts.other++; sizes.other += size; }
  }

  const fmt = (b: number) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  return {
    totalSize: fmt(total),
    breakdown: [
      { label: 'Variables', size: fmt(sizes.variables), count: counts.variables },
      { label: 'Page de garde', size: fmt(sizes.pageGarde), count: counts.pageGarde },
      { label: 'Templates', size: fmt(sizes.templates), count: counts.templates },
      { label: 'Clients', size: fmt(sizes.clients), count: counts.clients },
      { label: 'Expéditions', size: fmt(sizes.expeditions), count: counts.expeditions },
      { label: 'Marchandise', size: fmt(sizes.marchandise), count: counts.marchandise },
    ].filter(x => x.count > 0),
  };
}
