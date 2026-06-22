export interface Variable {
  id: string;
  name: string;
  key: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'multiline';
  defaultValue: string;
  options?: string[];
  category: string;
}

export interface PageGardeField {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'multiline' | 'quantity_single_line' | 'dynamic_chassis' | 'calculated' | 'date' | 'number';
  height?: number;
  default?: string;
  options?: string[];
}

export interface PageGardeSection {
  id: string;
  name: string;
  icon: string;
  position: string;
  fields: PageGardeField[];
}

export interface PageGardeStructure {
  version: string;
  created_date: string;
  description: string;
  sections: {
    colonne_gauche: PageGardeSection[];
    colonne_droite: PageGardeSection[];
    centre_bas: PageGardeSection[];
  };
}

// Rich text segment for formatted text
export interface TextSegment {
  text: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    backgroundColor?: string;
  };
  variableKey?: string; // If this segment is a variable
}

// Table cell with individual styling
export interface TableCellData {
  content: string; // Can contain {{variable}} syntax
  segments?: TextSegment[]; // Rich text segments
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    color: string;
    backgroundColor: string;
    textAlign: string;
    verticalAlign: string;
    padding: number;
  };
  rowSpan: number;
  colSpan: number;
  merged?: boolean; // Is this cell merged into another
  mergedInto?: { row: number; col: number }; // Which cell this is merged into
}

// Advanced table data
export interface AdvancedTableData {
  rows: number;
  cols: number;
  cells: TableCellData[][];
  colWidths: number[]; // Width of each column in pixels
  rowHeights: number[]; // Height of each row in pixels
}

// Saved component group (multiple elements saved together)
export interface SavedComponentGroup {
  id: string;
  name: string;
  desc: string;
  elements: TemplateElement[];
  isGroup: true;
  createdAt: string;
}

// Template editor types
export interface TemplateElement {
  id: string;
  type: 'text' | 'variable' | 'image' | 'shape' | 'table' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  groupId?: string; // For canvas grouping: elements sharing groupId move together
  segments?: TextSegment[]; // For rich text
  variableKey?: string;
  // Config for chassis/marchandise variables (set in properties panel)
  varConfig?: {
    perLine?: number;        // for all_chassis: how many per line
    chassisNum?: number;     // for chassis_single: which chassis number
    rangeFrom?: number;      // for chassis_range: from
    rangeTo?: number;        // for chassis_range: to
    rangePerLine?: number;   // for chassis_range: per line
    unitNum?: number;        // for vehicule_N, type_N, etc.
  };
  imageData?: string; // Base64 encoded image
  imagePath?: string; // Path to image file
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    color: string;
    backgroundColor: string;
    textAlign: string;
    borderWidth: number;
    borderColor: string;
    borderStyle: string;
    padding: number;
    lineHeight: number;
    textDecoration: string;
  };
  tableData?: AdvancedTableData;
}

export interface FileTemplate {
  id: string;
  name: string;
  type: string;
  elements: TemplateElement[];
  pageSize: { width: number; height: number };
  margins: { top: number; right: number; bottom: number; left: number };
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  createdAt: string;
  expeditions: Expedition[];
}

export interface MarchandiseItem {
  vehicule: string;
  type: string;
  marque: string;
  chassis: string;
  poids: number;
}

export interface Expedition {
  id: string;
  name: string;
  clientId: string;
  createdAt: string;
  pageGardeData: Record<string, string>;
  marchandises: MarchandiseItem[];
  generatedFiles: GeneratedFile[];
}

export interface GeneratedFile {
  id: string;
  name: string;
  templateId: string;
  format: 'pdf' | 'word';
  generatedAt: string;
}

export type AppView = 
  | 'dashboard'
  | 'settings-variables'
  | 'settings-page-garde'
  | 'settings-fichiers'
  | 'settings-fichiers-editor'
  | 'settings-configuration'
  | 'settings-marchandise'
  | 'clients'
  | 'client-detail'
  | 'expedition-detail'
  | 'expedition-page-garde'
  | 'expedition-generate';

// App settings
export interface AppSettings {
  storagePath: string;
  autoSave: boolean;
  autoSaveInterval: number;
  lastSaved: string;
}

// Merchandise management
export interface MerchandiseOption {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface MerchandiseData {
  vehicules: MerchandiseOption[];
  types: MerchandiseOption[];
  marques: MerchandiseOption[];
}
