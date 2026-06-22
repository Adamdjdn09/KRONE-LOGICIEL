import { useState, useRef, useEffect, useCallback } from 'react';
import { FileTemplate, TemplateElement, Variable, AdvancedTableData, TableCellData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  FiArrowLeft, FiType, FiSquare, FiImage, FiGrid,
  FiMinus, FiTrash2, FiCopy, FiBold, FiItalic, FiUnderline,
  FiAlignLeft, FiAlignCenter, FiAlignRight, FiCode, FiEye,
  FiZoomIn, FiZoomOut, FiChevronUp, FiChevronDown,
  FiMaximize2, FiSettings, FiDownload, FiFileText, FiCheck,
  FiPlus, FiUpload, FiSave, FiX, FiPackage
} from 'react-icons/fi';

interface Props {
  template: FileTemplate;
  variables: Variable[];
  onSave: (template: FileTemplate) => void;
  onBack: () => void;
}

const PAGE_SIZES = [
  { name: 'A4 Portrait', width: 794, height: 1123 },
  { name: 'A4 Paysage', width: 1123, height: 794 },
  { name: 'A3 Portrait', width: 1123, height: 1587 },
  { name: 'A5 Portrait', width: 559, height: 794 },
  { name: 'Letter', width: 816, height: 1056 },
  { name: 'Personnalisé', width: 0, height: 0 },
];

const FONTS = ['Times New Roman', 'Arial', 'Helvetica', 'Courier New', 'Georgia', 'Verdana', 'Calibri', 'Tahoma'];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const defaultCellStyle: TableCellData['style'] = {
  fontSize: 11,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  backgroundColor: 'transparent',
  textAlign: 'left',
  verticalAlign: 'middle',
  padding: 4,
};

const defaultStyle: TemplateElement['style'] = {
  fontSize: 12,
  fontFamily: 'Times New Roman',
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  backgroundColor: 'transparent',
  textAlign: 'left',
  borderWidth: 0,
  borderColor: '#000000',
  borderStyle: 'solid',
  padding: 4,
  lineHeight: 1.4,
  textDecoration: 'none',
};

// Create default table data
const createDefaultTableData = (rows: number, cols: number): AdvancedTableData => {
  const cells: TableCellData[][] = [];
  const colWidth = Math.floor(400 / cols);
  const rowHeight = 30;
  
  for (let r = 0; r < rows; r++) {
    const row: TableCellData[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        content: r === 0 ? `Colonne ${c + 1}` : '',
        style: {
          ...defaultCellStyle,
          fontWeight: r === 0 ? 'bold' : 'normal',
          backgroundColor: r === 0 ? '#f3f4f6' : 'transparent',
        },
        rowSpan: 1,
        colSpan: 1,
      });
    }
    cells.push(row);
  }
  
  return {
    rows,
    cols,
    cells,
    colWidths: Array(cols).fill(colWidth),
    rowHeights: Array(rows).fill(rowHeight),
  };
};

export default function TemplateEditor({ template, variables, onSave, onBack }: Props) {
  const [elements, setElements] = useState<TemplateElement[]>(template.elements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(template.pageSize);
  const [zoom, setZoom] = useState(0.75);
  const [showGrid, setShowGrid] = useState(true);
  const [showVarPanel, setShowVarPanel] = useState(false);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // Multi-select states
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // IDs of multi-selected elements
  const [selectionBoxStart, setSelectionBoxStart] = useState<{x: number; y: number} | null>(null);
  const [selectionBoxEnd, setSelectionBoxEnd] = useState<{x: number; y: number} | null>(null);
  
  // Group modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupDescInput, setGroupDescInput] = useState('');

  // Editing states
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{elemId: string, row: number, col: number} | null>(null);
  const [selectedCells, setSelectedCells] = useState<{elemId: string, cells: {row: number, col: number}[]}>({elemId: '', cells: []});
  
  // Resize states for table columns/rows
  const [resizingCol, setResizingCol] = useState<{elemId: string, col: number, startX: number, startWidth: number} | null>(null);
  const [resizingRow, setResizingRow] = useState<{elemId: string, row: number, startY: number, startHeight: number} | null>(null);

  // Undo/Redo
  const [history, setHistory] = useState<TemplateElement[][]>([template.elements]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const historyPauseRef = useRef(false);
  
  // Ref for text editing textarea to insert variables at cursor
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Drag & resize states
  const dragRef = useRef<{
    active: boolean;
    type: 'move' | 'resize';
    handle?: string;
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
    elemStartW: number;
    elemStartH: number;
    elementId: string;
    multiPositions?: { id: string; startX: number; startY: number }[]; // for multi-drag
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selected = elements.find(e => e.id === selectedId);

  const snap = (val: number) => snapToGrid ? Math.round(val / 10) * 10 : val;

  // Use ref to avoid stale closure in auto-save
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const templateIdRef = useRef(template.id);
  templateIdRef.current = template.id;

  // Auto-save on every change
  useEffect(() => {
    const timer = setTimeout(() => {
      onSaveRef.current({
        ...template,
        id: templateIdRef.current,
        elements,
        pageSize,
        updatedAt: new Date().toISOString(),
      });
    }, 800);
    return () => clearTimeout(timer);
    // Only trigger on elements or pageSize changes
  }, [elements, pageSize]);

  // Undo/Redo: push to history on element changes (debounced)
  useEffect(() => {
    if (historyPauseRef.current) { historyPauseRef.current = false; return; }
    const timer = setTimeout(() => {
      setHistory(prev => {
        const trimmed = prev.slice(0, historyIdx + 1);
        const newHistory = [...trimmed, JSON.parse(JSON.stringify(elements))];
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIdx(prev => Math.min(prev + 1, 50));
    }, 600);
    return () => clearTimeout(timer);
  }, [elements]);

  const undo = () => {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx);
    historyPauseRef.current = true;
    setElements(JSON.parse(JSON.stringify(history[newIdx])));
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    setHistoryIdx(newIdx);
    historyPauseRef.current = true;
    setElements(JSON.parse(JSON.stringify(history[newIdx])));
  };

  // Get canvas-relative coordinates
  const getCanvasCoords = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
  }, [zoom]);

  // Mouse move handler for element drag/resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Handle column resize
      if (resizingCol) {
        const deltaX = (e.clientX - resizingCol.startX) / zoom;
        const newWidth = Math.max(30, resizingCol.startWidth + deltaX);
        setElements(prev => prev.map(el => {
          if (el.id !== resizingCol.elemId || !el.tableData) return el;
          const newColWidths = [...el.tableData.colWidths];
          newColWidths[resizingCol.col] = newWidth;
          const totalWidth = newColWidths.reduce((a, b) => a + b, 0);
          return { ...el, width: totalWidth, tableData: { ...el.tableData, colWidths: newColWidths } };
        }));
        return;
      }

      // Handle row resize
      if (resizingRow) {
        const deltaY = (e.clientY - resizingRow.startY) / zoom;
        const newHeight = Math.max(20, resizingRow.startHeight + deltaY);
        setElements(prev => prev.map(el => {
          if (el.id !== resizingRow.elemId || !el.tableData) return el;
          const newRowHeights = [...el.tableData.rowHeights];
          newRowHeights[resizingRow.row] = newHeight;
          const totalHeight = newRowHeights.reduce((a, b) => a + b, 0);
          return { ...el, height: totalHeight, tableData: { ...el.tableData, rowHeights: newRowHeights } };
        }));
        return;
      }

      if (!dragRef.current?.active) return;
      
      const { x, y } = getCanvasCoords(e);
      const drag = dragRef.current;
      const deltaX = x - drag.startX;
      const deltaY = y - drag.startY;

      // Multi-element drag
      if (drag.type === 'move' && drag.multiPositions && drag.multiPositions.length > 1) {
        setElements(prev => prev.map(el => {
          const startPos = drag.multiPositions!.find(p => p.id === el.id);
          if (!startPos) return el;
          return {
            ...el,
            x: snap(Math.max(0, Math.min(pageSize.width - el.width, startPos.startX + deltaX))),
            y: snap(Math.max(0, Math.min(pageSize.height - el.height, startPos.startY + deltaY))),
          };
        }));
        return;
      }

      setElements(prev => prev.map(el => {
        if (el.id !== drag.elementId) return el;

        if (drag.type === 'move') {
          // Multi-drag: move all selected elements together
          if (drag.multiPositions && drag.multiPositions.length > 1) {
            return el; // handled below
          }
          return {
            ...el,
            x: snap(Math.max(0, Math.min(pageSize.width - el.width, drag.elemStartX + deltaX))),
            y: snap(Math.max(0, Math.min(pageSize.height - el.height, drag.elemStartY + deltaY)))
          };
        }

        if (drag.type === 'resize' && drag.handle) {
          let newX = drag.elemStartX;
          let newY = drag.elemStartY;
          let newW = drag.elemStartW;
          let newH = drag.elemStartH;

          if (drag.handle.includes('e')) newW = snap(Math.max(30, drag.elemStartW + deltaX));
          if (drag.handle.includes('w')) {
            newW = snap(Math.max(30, drag.elemStartW - deltaX));
            newX = snap(drag.elemStartX + drag.elemStartW - newW);
          }
          if (drag.handle.includes('s')) newH = snap(Math.max(20, drag.elemStartH + deltaY));
          if (drag.handle.includes('n')) {
            newH = snap(Math.max(20, drag.elemStartH - deltaY));
            newY = snap(drag.elemStartY + drag.elemStartH - newH);
          }

          return { ...el, x: newX, y: newY, width: newW, height: newH };
        }

        return el;
      }));
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setResizingCol(null);
      setResizingRow(null);
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [getCanvasCoords, pageSize, snapToGrid, zoom, resizingCol, resizingRow]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z / Ctrl+Y work everywhere
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

      if (editingTextId || editingCell) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' && selectedId) {
        e.preventDefault();
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
        setSelectedIds([]);
      }

      if (e.key === 'Escape') {
        setSelectedId(null);
        setEditingTextId(null);
        setEditingCell(null);
        setSelectedCells({ elemId: '', cells: [] });
        setSelectedIds([]);
      }

      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        setElements(prev => prev.map(el => {
          if (el.id !== selectedId) return el;
          if (e.key === 'ArrowUp') return { ...el, y: Math.max(0, el.y - delta) };
          if (e.key === 'ArrowDown') return { ...el, y: el.y + delta };
          if (e.key === 'ArrowLeft') return { ...el, x: Math.max(0, el.x - delta) };
          if (e.key === 'ArrowRight') return { ...el, x: el.x + delta };
          return el;
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingTextId, editingCell]);

  // Element drag start
  const startDrag = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const el = elements.find(x => x.id === elementId);
    if (!el) return;

    // Ctrl+click: toggle multi-select without starting drag
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => {
        if (prev.includes(elementId)) return prev.filter(id => id !== elementId);
        return [...prev, elementId];
      });
      setSelectedId(elementId);
      return;
    }

    const coords = getCanvasCoords(e);
    
    // If clicking an element that's in multi-select, drag all of them
    const isMultiDrag = selectedIds.includes(elementId) && selectedIds.length > 1;
    
    dragRef.current = {
      active: true,
      type: 'move',
      startX: coords.x,
      startY: coords.y,
      elemStartX: el.x,
      elemStartY: el.y,
      elemStartW: el.width,
      elemStartH: el.height,
      elementId,
      multiPositions: isMultiDrag
        ? elements.filter(e => selectedIds.includes(e.id)).map(e => ({ id: e.id, startX: e.x, startY: e.y }))
        : undefined,
    };

    // If clicking without ctrl and not in multi-select, clear multi-select
    if (!isMultiDrag) {
      setSelectedIds([]);
    }
    
    // Handle grouped elements: clicking one selects all in group
    if (el.groupId && !e.ctrlKey) {
      const groupMembers = elements.filter(e => e.groupId === el.groupId).map(e => e.id);
      setSelectedIds(groupMembers);
      dragRef.current.multiPositions = elements
        .filter(e => e.groupId === el.groupId)
        .map(e => ({ id: e.id, startX: e.x, startY: e.y }));
    }

    setSelectedId(elementId);
    document.body.style.cursor = 'grabbing';
  };

  // Element resize start
  const startResize = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    const el = elements.find(x => x.id === elementId);
    if (!el) return;

    const coords = getCanvasCoords(e);

    dragRef.current = {
      active: true,
      type: 'resize',
      handle,
      startX: coords.x,
      startY: coords.y,
      elemStartX: el.x,
      elemStartY: el.y,
      elemStartW: el.width,
      elemStartH: el.height,
      elementId
    };

    document.body.style.cursor = `${handle}-resize`;
  };

  // Add element
  // Saved components (reusable blocks)
  const [savedComponents, setSavedComponents] = useState<{ id: string; name: string; desc: string; element: TemplateElement }[]>(() => {
    try { return JSON.parse(localStorage.getItem('krone_saved_components') || '[]'); } catch { return []; }
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [compName, setCompName] = useState('');
  const [compDesc, setCompDesc] = useState('');

  const [updateExistingId, setUpdateExistingId] = useState<string | null>(null);

  const saveComponent = () => {
    if (!selected || !compName.trim()) return;
    
    if (updateExistingId) {
      // Update existing component
      const updated = savedComponents.map(c => 
        c.id === updateExistingId ? { ...c, name: compName.trim(), desc: compDesc.trim(), element: { ...selected } } : c
      );
      setSavedComponents(updated);
      localStorage.setItem('krone_saved_components', JSON.stringify(updated));
    } else {
      // Create new
      const comp = { id: uuidv4(), name: compName.trim(), desc: compDesc.trim(), element: { ...selected } };
      const updated = [...savedComponents, comp];
      setSavedComponents(updated);
      localStorage.setItem('krone_saved_components', JSON.stringify(updated));
    }
    setShowSaveModal(false); setCompName(''); setCompDesc(''); setUpdateExistingId(null);
  };

  const loadComponent = (comp: typeof savedComponents[0]) => {
    // Keep exact same position as saved
    const el = { ...comp.element, id: uuidv4() };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
    setShowLoadModal(false);
  };

  const deleteComponent = (id: string) => {
    if (!confirm('Supprimer ce composant ?')) return;
    const updated = savedComponents.filter(c => c.id !== id);
    setSavedComponents(updated);
    localStorage.setItem('krone_saved_components', JSON.stringify(updated));
  };

  // --- Group / Ungroup on canvas ---
  const groupSelected = () => {
    if (selectedIds.length < 2) return;
    const newGroupId = uuidv4();
    setElements(prev => prev.map(el =>
      selectedIds.includes(el.id) ? { ...el, groupId: newGroupId } : el
    ));
  };

  const ungroupSelected = () => {
    const idsToUngroup = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    setElements(prev => prev.map(el =>
      idsToUngroup.includes(el.id) ? { ...el, groupId: undefined } : el
    ));
  };

  // --- Save selected elements as a group to localStorage ---
  const saveAsGroup = () => {
    if (!groupNameInput.trim()) return;
    const idsToSave = selectedIds.length > 1 ? selectedIds : (selectedId ? [selectedId] : []);
    if (idsToSave.length === 0) return;
    const elementsToSave = elements.filter(e => idsToSave.includes(e.id));
    const group = {
      id: uuidv4(),
      name: groupNameInput.trim(),
      desc: groupDescInput.trim(),
      elements: elementsToSave,
      isGroup: true as const,
      createdAt: new Date().toISOString(),
    };
    const existing: typeof group[] = (() => {
      try { return JSON.parse(localStorage.getItem('krone_saved_groups') || '[]'); } catch { return []; }
    })();
    localStorage.setItem('krone_saved_groups', JSON.stringify([...existing, group]));
    setShowGroupModal(false);
    setGroupNameInput('');
    setGroupDescInput('');
  };

  // --- Load a group from localStorage ---
  const loadGroup = (groupData: { elements: TemplateElement[] }) => {
    const newGroupId = uuidv4();
    const newElements = groupData.elements.map(el => ({
      ...el,
      id: uuidv4(),
      groupId: newGroupId,
    }));
    setElements(prev => [...prev, ...newElements]);
    setSelectedIds(newElements.map(e => e.id));
    setSelectedId(newElements[0]?.id || null);
    setShowLoadModal(false);
  };

  // Center of the page
  const centerX = (w: number) => Math.round((pageSize.width - w) / 2);
  const centerY = (h: number) => Math.round((pageSize.height - h) / 2);

  const addElement = (type: TemplateElement['type']) => {
    let el: TemplateElement;
    
    if (type === 'table') {
      const tableData = createDefaultTableData(4, 4);
      const totalWidth = tableData.colWidths.reduce((a, b) => a + b, 0);
      const totalHeight = tableData.rowHeights.reduce((a, b) => a + b, 0);
      
      el = {
        id: uuidv4(),
        type: 'table',
        x: centerX(totalWidth),
        y: centerY(totalHeight),
        width: totalWidth,
        height: totalHeight,
        content: '',
        style: { ...defaultStyle, borderWidth: 1 },
        tableData,
      };
    } else if (type === 'image') {
      el = {
        id: uuidv4(),
        type: 'image',
        x: centerX(200),
        y: centerY(150),
        width: 200,
        height: 150,
        content: '',
        style: defaultStyle,
      };
    } else {
      const w = type === 'line' ? 400 : 200;
      const h = type === 'line' ? 2 : 30;
      el = {
        id: uuidv4(),
        type,
        x: centerX(w),
        y: centerY(h),
        width: w,
        height: h,
        content: type === 'text' ? 'Double-cliquez pour éditer' : '',
        style: {
          ...defaultStyle,
          borderWidth: type === 'shape' ? 1 : type === 'line' ? 2 : 0,
          backgroundColor: type === 'shape' ? '#ffffff' : 'transparent',
        },
        variableKey: type === 'variable' ? '' : undefined,
      };
    }
    
    setElements([...elements, el]);
    setSelectedId(el.id);
  };

  // Update element
  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  // Update element style
  const updateStyle = (updates: Partial<TemplateElement['style']>) => {
    if (!selectedId) return;
    setElements(prev => prev.map(e => 
      e.id === selectedId ? { ...e, style: { ...e.style, ...updates } } : e
    ));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      updateElement(selectedId, { imageData });
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Table cell operations
  const updateTableCell = (elemId: string, row: number, col: number, updates: Partial<TableCellData>) => {
    setElements(prev => prev.map(el => {
      if (el.id !== elemId || !el.tableData) return el;
      const newCells = el.tableData.cells.map((r, ri) => 
        r.map((c, ci) => ri === row && ci === col ? { ...c, ...updates } : c)
      );
      return { ...el, tableData: { ...el.tableData, cells: newCells } };
    }));
  };

  const updateSelectedCellsStyle = (styleUpdates: Partial<TableCellData['style']>) => {
    if (selectedCells.cells.length === 0) return;
    setElements(prev => prev.map(el => {
      if (el.id !== selectedCells.elemId || !el.tableData) return el;
      const newCells = el.tableData.cells.map((r, ri) => 
        r.map((c, ci) => {
          const isSelected = selectedCells.cells.some(sc => sc.row === ri && sc.col === ci);
          if (!isSelected) return c;
          return { ...c, style: { ...c.style, ...styleUpdates } };
        })
      );
      return { ...el, tableData: { ...el.tableData, cells: newCells } };
    }));
  };

  // Merge cells
  const mergeCells = () => {
    if (selectedCells.cells.length < 2) return;
    
    const minRow = Math.min(...selectedCells.cells.map(c => c.row));
    const maxRow = Math.max(...selectedCells.cells.map(c => c.row));
    const minCol = Math.min(...selectedCells.cells.map(c => c.col));
    const maxCol = Math.max(...selectedCells.cells.map(c => c.col));
    
    setElements(prev => prev.map(el => {
      if (el.id !== selectedCells.elemId || !el.tableData) return el;
      
      const newCells = el.tableData.cells.map((r, ri) => 
        r.map((c, ci) => {
          if (ri === minRow && ci === minCol) {
            return { ...c, rowSpan: maxRow - minRow + 1, colSpan: maxCol - minCol + 1 };
          }
          if (ri >= minRow && ri <= maxRow && ci >= minCol && ci <= maxCol) {
            return { ...c, merged: true, mergedInto: { row: minRow, col: minCol } };
          }
          return c;
        })
      );
      
      return { ...el, tableData: { ...el.tableData, cells: newCells } };
    }));
    
    setSelectedCells({ elemId: '', cells: [] });
  };

  // Unmerge cells
  const unmergeCells = () => {
    if (selectedCells.cells.length === 0) return;
    
    setElements(prev => prev.map(el => {
      if (el.id !== selectedCells.elemId || !el.tableData) return el;
      
      const newCells = el.tableData.cells.map((r, ri) => 
        r.map((c, ci) => {
          const isSelected = selectedCells.cells.some(sc => sc.row === ri && sc.col === ci);
          if (!isSelected) return c;
          return { ...c, rowSpan: 1, colSpan: 1, merged: false, mergedInto: undefined };
        })
      );
      
      return { ...el, tableData: { ...el.tableData, cells: newCells } };
    }));
  };

  // Add row/column
  const addTableRow = (elemId: string, position: 'start' | 'end' = 'end') => {
    setElements(prev => prev.map(el => {
      if (el.id !== elemId || !el.tableData) return el;
      const newRow: TableCellData[] = Array(el.tableData.cols).fill(null).map(() => ({
        content: '',
        style: { ...defaultCellStyle },
        rowSpan: 1,
        colSpan: 1,
      }));
      const newCells = position === 'end' 
        ? [...el.tableData.cells, newRow]
        : [newRow, ...el.tableData.cells];
      const newRowHeights = position === 'end'
        ? [...el.tableData.rowHeights, 30]
        : [30, ...el.tableData.rowHeights];
      const totalHeight = newRowHeights.reduce((a, b) => a + b, 0);
      return {
        ...el,
        height: totalHeight,
        tableData: {
          ...el.tableData,
          rows: el.tableData.rows + 1,
          cells: newCells,
          rowHeights: newRowHeights,
        }
      };
    }));
  };

  const addTableCol = (elemId: string, position: 'start' | 'end' = 'end') => {
    setElements(prev => prev.map(el => {
      if (el.id !== elemId || !el.tableData) return el;
      const newCells = el.tableData.cells.map((row, ri) => {
        const newCell: TableCellData = {
          content: ri === 0 ? 'Nouveau' : '',
          style: { ...defaultCellStyle, fontWeight: ri === 0 ? 'bold' : 'normal', backgroundColor: ri === 0 ? '#f3f4f6' : 'transparent' },
          rowSpan: 1,
          colSpan: 1,
        };
        return position === 'end' ? [...row, newCell] : [newCell, ...row];
      });
      const newColWidths = position === 'end'
        ? [...el.tableData.colWidths, 80]
        : [80, ...el.tableData.colWidths];
      const totalWidth = newColWidths.reduce((a, b) => a + b, 0);
      return {
        ...el,
        width: totalWidth,
        tableData: {
          ...el.tableData,
          cols: el.tableData.cols + 1,
          cells: newCells,
          colWidths: newColWidths,
        }
      };
    }));
  };

  const removeTableRow = (elemId: string) => {
    setElements(prev => prev.map(el => {
      if (el.id !== elemId || !el.tableData || el.tableData.rows <= 1) return el;
      const newCells = el.tableData.cells.slice(0, -1);
      const newRowHeights = el.tableData.rowHeights.slice(0, -1);
      const totalHeight = newRowHeights.reduce((a, b) => a + b, 0);
      return {
        ...el,
        height: totalHeight,
        tableData: {
          ...el.tableData,
          rows: el.tableData.rows - 1,
          cells: newCells,
          rowHeights: newRowHeights,
        }
      };
    }));
  };

  const removeTableCol = (elemId: string) => {
    setElements(prev => prev.map(el => {
      if (el.id !== elemId || !el.tableData || el.tableData.cols <= 1) return el;
      const newCells = el.tableData.cells.map(row => row.slice(0, -1));
      const newColWidths = el.tableData.colWidths.slice(0, -1);
      const totalWidth = newColWidths.reduce((a, b) => a + b, 0);
      return {
        ...el,
        width: totalWidth,
        tableData: {
          ...el.tableData,
          cols: el.tableData.cols - 1,
          cells: newCells,
          colWidths: newColWidths,
        }
      };
    }));
  };

  // Insert variable into text or cell — at cursor position when editing
  const insertVariable = (key: string) => {
    const varText = `{{${key}}}`;
    
    if (editingTextId) {
      // Insert at cursor position in textarea
      const textarea = textAreaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const current = textarea.value;
        const newContent = current.substring(0, start) + varText + current.substring(end);
        setElements(prev => prev.map(el => el.id !== editingTextId ? el : { ...el, content: newContent }));
        // Restore focus and cursor position after React re-render
        setTimeout(() => {
          textarea.focus();
          const newPos = start + varText.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      } else {
        setElements(prev => prev.map(el => el.id !== editingTextId ? el : { ...el, content: el.content + varText }));
      }
    } else if (editingCell) {
      // Insert into table cell
      setElements(prev => prev.map(el => {
        if (el.id !== editingCell.elemId || !el.tableData) return el;
        const newCells = el.tableData.cells.map((r, ri) => 
          r.map((c, ci) => {
            if (ri === editingCell.row && ci === editingCell.col) {
              return { ...c, content: c.content + varText };
            }
            return c;
          })
        );
        return { ...el, tableData: { ...el.tableData, cells: newCells } };
      }));
    } else if (selectedId && selected?.type === 'variable') {
      updateElement(selectedId, { variableKey: key, content: varText });
    } else {
      // Create new variable element
      const el: TemplateElement = {
        id: uuidv4(),
        type: 'variable',
        x: 50,
        y: 50,
        width: 180,
        height: 24,
        content: varText,
        variableKey: key,
        style: { ...defaultStyle, fontSize: 11 },
      };
      setElements([...elements, el]);
      setSelectedId(el.id);
    }
    // Keep panel open when editing text/cell so user can insert more variables
    if (!editingTextId && !editingCell) {
      setShowVarPanel(false);
    }
  };

  const replaceVars = (text: string) => {
    let result = text;
    variables.forEach(v => {
      const val = previewData[v.key] || v.defaultValue || `[${v.key}]`;
      result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), val);
    });
    return result;
  };

  // Render resize handles
  const renderResizeHandles = (elementId: string) => {
    const handles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
    const positions: Record<string, React.CSSProperties> = {
      nw: { top: -5, left: -5, cursor: 'nw-resize' },
      n: { top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
      ne: { top: -5, right: -5, cursor: 'ne-resize' },
      w: { top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'w-resize' },
      e: { top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'e-resize' },
      sw: { bottom: -5, left: -5, cursor: 'sw-resize' },
      s: { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
      se: { bottom: -5, right: -5, cursor: 'se-resize' },
    };

    return handles.map(h => (
      <div
        key={h}
        className="absolute w-3 h-3 bg-amber-500 border-2 border-white rounded-sm shadow-lg z-50"
        style={positions[h]}
        onMouseDown={(e) => startResize(e, elementId, h)}
      />
    ));
  };

  // Render table element
  const renderTable = (el: TemplateElement, isPreview: boolean) => {
    if (!el.tableData) return null;
    const { cells, colWidths, rowHeights } = el.tableData;
    
    return (
      <div className="w-full h-full overflow-hidden relative">
        <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
          <tbody>
            {cells.map((row, ri) => (
              <tr key={ri} style={{ height: rowHeights[ri] }}>
                {row.map((cell, ci) => {
                  if (cell.merged) return null;
                  
                  const isEditing = editingCell?.elemId === el.id && editingCell?.row === ri && editingCell?.col === ci;
                  const isSelected = selectedCells.elemId === el.id && selectedCells.cells.some(c => c.row === ri && c.col === ci);
                  
                  return (
                    <td
                      key={ci}
                      rowSpan={cell.rowSpan}
                      colSpan={cell.colSpan}
                      style={{
                        border: `${el.style.borderWidth || 1}px solid ${el.style.borderColor}`,
                        padding: cell.style.padding,
                        fontSize: cell.style.fontSize,
                        fontFamily: cell.style.fontFamily,
                        fontWeight: cell.style.fontWeight,
                        fontStyle: cell.style.fontStyle,
                        color: cell.style.color,
                        backgroundColor: cell.style.backgroundColor === 'transparent' ? undefined : cell.style.backgroundColor,
                        textAlign: cell.style.textAlign as 'left' | 'center' | 'right',
                        verticalAlign: cell.style.verticalAlign as 'top' | 'middle' | 'bottom',
                        outline: isSelected ? '2px solid #f59e0b' : undefined,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: isPreview ? 'default' : 'cell',
                      }}
                      onClick={!isPreview ? (e) => {
                        e.stopPropagation();
                        if (e.ctrlKey || e.metaKey) {
                          setSelectedCells(prev => ({
                            elemId: el.id,
                            cells: prev.elemId === el.id 
                              ? [...prev.cells, { row: ri, col: ci }]
                              : [{ row: ri, col: ci }]
                          }));
                        } else {
                          setSelectedCells({ elemId: el.id, cells: [{ row: ri, col: ci }] });
                        }
                        setSelectedId(el.id);
                      } : undefined}
                      onDoubleClick={!isPreview ? (e) => {
                        e.stopPropagation();
                        setEditingCell({ elemId: el.id, row: ri, col: ci });
                      } : undefined}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          className="w-full h-full border-none outline-none bg-white"
                          style={{ fontSize: cell.style.fontSize, fontFamily: cell.style.fontFamily }}
                          value={cell.content}
                          onChange={(e) => updateTableCell(el.id, ri, ci, { content: e.target.value })}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingCell(null);
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              const nextCol = ci + 1 < el.tableData!.cols ? ci + 1 : 0;
                              const nextRow = ci + 1 < el.tableData!.cols ? ri : (ri + 1) % el.tableData!.rows;
                              setEditingCell({ elemId: el.id, row: nextRow, col: nextCol });
                            }
                          }}
                        />
                      ) : (
                        isPreview ? replaceVars(cell.content) : cell.content
                      )}
                      
                      {/* Column resize handle */}
                      {!isPreview && ci < colWidths.length - 1 && (
                        <div
                          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-amber-500 z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setResizingCol({ elemId: el.id, col: ci, startX: e.clientX, startWidth: colWidths[ci] });
                          }}
                        />
                      )}
                    </td>
                  );
                })}
                
                {/* Row resize handle */}
                {!isPreview && ri < rowHeights.length - 1 && (
                  <td style={{ width: 0, padding: 0, border: 'none', position: 'relative' }}>
                    <div
                      className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-amber-500 z-10"
                      style={{ width: el.width }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingRow({ elemId: el.id, row: ri, startY: e.clientY, startHeight: rowHeights[ri] });
                      }}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render element on canvas
  const renderElement = (el: TemplateElement, isPreview = false) => {
    const isSelected = el.id === selectedId && !isPreview;
    const isMultiSelected = selectedIds.includes(el.id) && !isPreview;
    const isEditingText = editingTextId === el.id;

    return (
      <div
        key={el.id}
        className={`absolute ${!isPreview ? 'group' : ''}`}
        style={{
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          zIndex: isSelected ? 1000 : isMultiSelected ? 999 : undefined,
          outline: isSelected ? '2px solid #f59e0b' : isMultiSelected ? '2px solid #60a5fa' : undefined,
          outlineOffset: 1,
          cursor: !isPreview && !isEditingText && !editingCell ? 'grab' : 'default',
        }}
        onMouseDown={!isPreview && !isEditingText && !editingCell ? (e) => {
          startDrag(e, el.id);
        } : undefined}
        onDoubleClick={!isPreview && el.type === 'text' ? () => setEditingTextId(el.id) : undefined}
      >
        {/* Text Element */}
        {el.type === 'text' && (
          isEditingText ? (
            <textarea
              ref={textAreaRef}
              autoFocus
              className="w-full h-full resize-none border-2 border-amber-500 outline-none bg-white"
              style={{
                fontSize: el.style.fontSize,
                fontFamily: el.style.fontFamily,
                fontWeight: el.style.fontWeight,
                fontStyle: el.style.fontStyle,
                color: el.style.color,
                textAlign: el.style.textAlign as 'left' | 'center' | 'right',
                padding: el.style.padding,
                lineHeight: el.style.lineHeight,
              }}
              value={el.content}
              onChange={(e) => updateElement(el.id, { content: e.target.value })}
              onBlur={() => setEditingTextId(null)}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                fontSize: el.style.fontSize,
                fontFamily: el.style.fontFamily,
                fontWeight: el.style.fontWeight,
                fontStyle: el.style.fontStyle,
                color: el.style.color,
                backgroundColor: el.style.backgroundColor !== 'transparent' ? el.style.backgroundColor : undefined,
                textAlign: el.style.textAlign as 'left' | 'center' | 'right',
                textDecoration: el.style.textDecoration,
                padding: el.style.padding,
                lineHeight: el.style.lineHeight,
                border: el.style.borderWidth > 0 ? `${el.style.borderWidth}px ${el.style.borderStyle} ${el.style.borderColor}` : undefined,
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {isPreview ? replaceVars(el.content) : el.content}
            </div>
          )
        )}

        {/* Variable Element */}
        {el.type === 'variable' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              fontSize: el.style.fontSize,
              fontFamily: el.style.fontFamily,
              fontWeight: el.style.fontWeight,
              color: isPreview ? el.style.color : '#1d4ed8',
              backgroundColor: isPreview ? 'transparent' : '#eff6ff',
              border: isPreview ? undefined : '1px dashed #3b82f6',
              borderRadius: 3,
              padding: el.style.padding,
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {(() => {
              const vk = el.variableKey || '';
              const cfg = el.varConfig;
              if (!isPreview) {
                // Show label on canvas
                if (vk === 'all_chassis') return `📋 Tous les châssis (${cfg?.perLine || 1}/ligne)`;
                if (vk === 'chassis_single') return `🔢 Châssis n°${cfg?.chassisNum || 1}`;
                if (vk === 'chassis_range') return `🔢 Châssis ${cfg?.rangeFrom || 1}→${cfg?.rangeTo || 10} (${cfg?.rangePerLine || 3}/ligne)`;
                if (vk === 'detail_unit') return `📦 Détail unité n°${cfg?.unitNum || 1}`;
                return `{{${vk}}}`;
              }
              // Preview mode — just show placeholder text
              return previewData[vk] || variables.find(v => v.key === vk)?.defaultValue || `[${vk}]`;
            })()}
          </div>
        )}

        {/* Shape Element */}
        {el.type === 'shape' && (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: el.style.backgroundColor === 'transparent' ? '#ffffff' : el.style.backgroundColor,
            border: `${el.style.borderWidth}px ${el.style.borderStyle} ${el.style.borderColor}`,
          }} />
        )}

        {/* Line Element */}
        {el.type === 'line' && (
          <div style={{
            width: '100%',
            position: 'absolute',
            top: '50%',
            borderTop: `${Math.max(1, el.style.borderWidth || 2)}px ${el.style.borderStyle} ${el.style.borderColor}`,
          }} />
        )}

        {/* Image Element */}
        {el.type === 'image' && (
          el.imageData ? (
            <img
              src={el.imageData}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f9fafb',
                border: '2px dashed #d1d5db',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: 12,
                cursor: 'pointer',
              }}
              onClick={!isPreview ? () => fileInputRef.current?.click() : undefined}
            >
              <FiUpload size={24} className="mb-2" />
              <span>Cliquez pour ajouter une image</span>
            </div>
          )
        )}

        {/* Table Element */}
        {el.type === 'table' && renderTable(el, isPreview)}

        {/* Resize handles */}
        {isSelected && !isEditingText && !editingCell && renderResizeHandles(el.id)}
      </div>
    );
  };

  // Preview Modal
  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 bg-krone-800 border-b border-krone-700">
          <h3 className="text-white font-semibold">Aperçu - {template.name}</h3>
          <div className="flex gap-3">
            <button onClick={() => {
              const w = window.open('', '_blank');
              if (w) {
                w.document.write(generateHTML());
                w.document.close();
                setTimeout(() => w.print(), 300);
              }
            }} className="flex items-center gap-2 px-3 py-1.5 bg-krone-700 text-white rounded-lg text-sm">
              <FiDownload size={14} /> PDF
            </button>
            <button onClick={() => setShowPreview(false)} className="px-4 py-1.5 bg-accent-500 text-krone-900 rounded-lg text-sm font-medium">
              Fermer
            </button>
          </div>
        </div>
        <div className="bg-krone-800 px-6 py-2 border-b border-krone-700 flex gap-4 flex-wrap">
          <span className="text-xs text-krone-400">Variables test:</span>
          {variables.slice(0, 4).map(v => (
            <div key={v.id} className="flex items-center gap-1">
              <span className="text-xs text-krone-500">{v.name}:</span>
              <input
                type="text"
                value={previewData[v.key] || ''}
                onChange={e => setPreviewData({ ...previewData, [v.key]: e.target.value })}
                placeholder={v.defaultValue || v.key}
                className="w-24 px-2 py-0.5 bg-krone-700 border border-krone-600 rounded text-white text-xs"
              />
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-auto flex items-start justify-center p-8 bg-gray-500">
          <div className="bg-white shadow-2xl relative" style={{ width: pageSize.width, height: pageSize.height }}>
            {elements.map(el => renderElement(el, true))}
          </div>
        </div>
      </div>
    );
  }

  const generateHTML = () => {
    let html = elements.map(el => {
      const s = el.style;
      const base = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;font-size:${s.fontSize}px;font-family:${s.fontFamily};font-weight:${s.fontWeight};font-style:${s.fontStyle};color:${s.color};text-align:${s.textAlign};line-height:${s.lineHeight};padding:${s.padding}px;overflow:hidden;white-space:pre-wrap;word-break:break-word;box-sizing:border-box;`;
      const bg = s.backgroundColor !== 'transparent' ? `background-color:${s.backgroundColor};` : '';
      const bd = s.borderWidth > 0 ? `border:${s.borderWidth}px ${s.borderStyle} ${s.borderColor};` : '';

      if (el.type === 'text') return `<div style="${base}${bg}${bd}">${replaceVars(el.content)}</div>`;
      if (el.type === 'variable') return `<div style="${base}">${previewData[el.variableKey || ''] || variables.find(v => v.key === el.variableKey)?.defaultValue || ''}</div>`;
      if (el.type === 'shape') return `<div style="${base}${bg}${bd}"></div>`;
      if (el.type === 'line') return `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;border-top:${s.borderWidth||2}px ${s.borderStyle} ${s.borderColor};"></div>`;
      if (el.type === 'image' && el.imageData) return `<div style="${base}"><img src="${el.imageData}" style="width:100%;height:100%;object-fit:contain;"/></div>`;
      if (el.type === 'table' && el.tableData) {
        const { cells, colWidths, rowHeights } = el.tableData;
        let t = `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;"><table style="width:100%;height:100%;border-collapse:collapse;table-layout:fixed;">`;
        t += '<colgroup>' + colWidths.map(w => `<col style="width:${w}px"/>`).join('') + '</colgroup>';
        cells.forEach((row, ri) => {
          t += `<tr style="height:${rowHeights[ri]}px">`;
          row.forEach((cell) => {
            if (cell.merged) return;
            const cs = cell.style;
            t += `<td rowspan="${cell.rowSpan}" colspan="${cell.colSpan}" style="border:${s.borderWidth||1}px solid ${s.borderColor};padding:${cs.padding}px;font-size:${cs.fontSize}px;font-family:${cs.fontFamily};font-weight:${cs.fontWeight};font-style:${cs.fontStyle};color:${cs.color};background-color:${cs.backgroundColor !== 'transparent' ? cs.backgroundColor : ''};text-align:${cs.textAlign};vertical-align:${cs.verticalAlign};">${replaceVars(cell.content)}</td>`;
          });
          t += '</tr>';
        });
        return t + '</table></div>';
      }
      return '';
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${template.name}</title>
    <style>@page{size:${pageSize.width}px ${pageSize.height}px;margin:0;}body{margin:0;}.page{width:${pageSize.width}px;height:${pageSize.height}px;position:relative;background:white;}</style>
    </head><body><div class="page">${html}</div></body></html>`;
  };

  // Get selected cell info for toolbar
  const selectedCellData = selectedCells.cells.length > 0 && selected?.type === 'table' && selected.tableData
    ? selected.tableData.cells[selectedCells.cells[0].row]?.[selectedCells.cells[0].col]
    : null;

  return (
    <div className="h-full flex flex-col bg-krone-900">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-krone-800 border-b border-krone-700">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-krone-300 hover:text-white hover:bg-krone-700 rounded-lg">
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-white font-semibold">{template.name}</h2>
            <p className="text-xs text-krone-400">{Math.round(pageSize.width * 0.2646)}mm × {Math.round(pageSize.height * 0.2646)}mm • Sauvegarde auto ✓</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-400 flex items-center gap-1"><FiCheck size={12} /> Sauvegardé</span>
          <button onClick={() => setShowPageSettings(!showPageSettings)} className={`p-2 rounded-lg ${showPageSettings ? 'bg-accent-500/20 text-accent-400' : 'text-krone-300 hover:bg-krone-700'}`}>
            <FiFileText size={16} />
          </button>
          <div className="flex items-center border border-krone-600 rounded-lg overflow-hidden mr-2">
            <button onClick={undo} disabled={historyIdx <= 0} title="Annuler (Ctrl+Z)"
              className="px-2.5 py-1.5 text-krone-400 hover:text-white hover:bg-krone-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm">↩</button>
            <button onClick={redo} disabled={historyIdx >= history.length - 1} title="Rétablir (Ctrl+Y)"
              className="px-2.5 py-1.5 text-krone-400 hover:text-white hover:bg-krone-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm border-l border-krone-600">↪</button>
          </div>
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-krone-300 hover:text-white hover:bg-krone-700 rounded-lg text-sm">
            <FiEye size={15} /> Aperçu
          </button>
        </div>
      </div>

      {/* Page Settings */}
      {showPageSettings && (
        <div className="px-4 py-3 bg-krone-800/90 border-b border-krone-700 flex items-center gap-4 animate-fade-in">
          <span className="text-xs text-krone-400">Format:</span>
          <select
            value={PAGE_SIZES.find(p => p.width === pageSize.width && p.height === pageSize.height)?.name || 'Personnalisé'}
            onChange={e => {
              const s = PAGE_SIZES.find(p => p.name === e.target.value);
              if (s && s.width > 0) setPageSize({ width: s.width, height: s.height });
            }}
            className="px-3 py-1.5 bg-krone-700 border border-krone-600 rounded-lg text-white text-sm"
          >
            {PAGE_SIZES.map(p => <option key={p.name}>{p.name}</option>)}
          </select>
          <input type="number" value={pageSize.width} onChange={e => setPageSize({ ...pageSize, width: +e.target.value })}
            className="w-20 px-2 py-1.5 bg-krone-700 border border-krone-600 rounded text-white text-sm" />
          <span className="text-krone-400">×</span>
          <input type="number" value={pageSize.height} onChange={e => setPageSize({ ...pageSize, height: +e.target.value })}
            className="w-20 px-2 py-1.5 bg-krone-700 border border-krone-600 rounded text-white text-sm" />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 bg-krone-800/80 border-b border-krone-700 flex-wrap">
        {/* Add elements */}
        <div className="flex items-center gap-1 pr-3 border-r border-krone-700">
          <button onClick={() => addElement('text')} className="flex items-center gap-1.5 px-2.5 py-1.5 text-krone-300 hover:text-white hover:bg-krone-700 rounded text-xs font-medium">
            <FiType size={14} /> Texte
          </button>
          <button onClick={() => setShowVarPanel(!showVarPanel)} onMouseDown={(e) => e.preventDefault()} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium ${showVarPanel ? 'bg-accent-500/20 text-accent-400' : 'text-krone-300 hover:text-white hover:bg-krone-700'}`}>
            <FiCode size={14} /> Variable
          </button>
          <button onClick={() => addElement('table')} className="flex items-center gap-1.5 px-2.5 py-1.5 text-krone-300 hover:text-white hover:bg-krone-700 rounded text-xs font-medium">
            <FiGrid size={14} /> Tableau
          </button>
          <button onClick={() => addElement('shape')} className="flex items-center gap-1.5 px-2.5 py-1.5 text-krone-300 hover:text-white hover:bg-krone-700 rounded text-xs font-medium">
            <FiSquare size={14} /> Forme
          </button>
          <button onClick={() => addElement('line')} className="flex items-center gap-1.5 px-2.5 py-1.5 text-krone-300 hover:text-white hover:bg-krone-700 rounded text-xs font-medium">
            <FiMinus size={14} /> Ligne
          </button>
          <button onClick={() => { addElement('image'); }} className="flex items-center gap-1.5 px-2.5 py-1.5 text-krone-300 hover:text-white hover:bg-krone-700 rounded text-xs font-medium">
            <FiImage size={14} /> Image
          </button>
          <div className="w-px h-5 bg-krone-700" />
          <button onClick={() => setShowLoadModal(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-krone-300 hover:text-white hover:bg-krone-700 rounded text-xs font-medium" title="Importer un composant sauvegardé">
            <FiUpload size={14} /> Importer
          </button>
          {selected && (
            <button onClick={() => { setCompName(''); setCompDesc(''); setShowSaveModal(true); }} className="flex items-center gap-1.5 px-2.5 py-1.5 text-krone-300 hover:text-white hover:bg-krone-700 rounded text-xs font-medium" title="Sauvegarder l'élément sélectionné comme composant réutilisable">
              <FiSave size={14} /> Sauvegarder
            </button>
          )}
          {/* Multi-select actions */}
          {selectedIds.length >= 2 && (
            <>
              <div className="w-px h-5 bg-krone-700" />
              <span className="text-xs text-blue-400 font-medium">{selectedIds.length} sél.</span>
              <button
                onClick={groupSelected}
                className="flex items-center gap-1 px-2.5 py-1.5 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded text-xs font-medium border border-blue-500/30"
                title="Grouper les éléments sélectionnés"
              >
                <FiPackage size={13} /> Grouper
              </button>
              <button
                onClick={() => { setGroupNameInput(''); setGroupDescInput(''); setShowGroupModal(true); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-green-400 hover:text-white hover:bg-green-500/20 rounded text-xs font-medium border border-green-500/30"
                title="Enregistrer comme groupe dans Gestion des Fichiers"
              >
                <FiSave size={13} /> Enreg. Groupe
              </button>
            </>
          )}
          {(selectedId && elements.find(e => e.id === selectedId)?.groupId) && (
            <>
              <div className="w-px h-5 bg-krone-700" />
              <button
                onClick={ungroupSelected}
                className="flex items-center gap-1 px-2.5 py-1.5 text-orange-400 hover:text-white hover:bg-orange-500/20 rounded text-xs font-medium border border-orange-500/30"
                title="Dégrouper"
              >
                <FiX size={13} /> Dégrouper
              </button>
            </>
          )}
        </div>

        {/* Text/Element formatting */}
        {selected && (selected.type === 'text' || selected.type === 'variable') && (
          <div className="flex items-center gap-1 px-3 border-r border-krone-700">
            <select value={selected.style.fontFamily} onChange={e => updateStyle({ fontFamily: e.target.value })} className="px-2 py-1 bg-krone-700 border border-krone-600 rounded text-white text-xs w-28">
              {FONTS.map(f => <option key={f}>{f}</option>)}
            </select>
            <select value={selected.style.fontSize} onChange={e => updateStyle({ fontSize: +e.target.value })} className="px-2 py-1 bg-krone-700 border border-krone-600 rounded text-white text-xs w-14">
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex border border-krone-600 rounded overflow-hidden">
              <button onClick={() => updateStyle({ fontWeight: selected.style.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 ${selected.style.fontWeight === 'bold' ? 'bg-accent-500/30 text-accent-400' : 'text-krone-400 hover:bg-krone-700'}`}><FiBold size={12} /></button>
              <button onClick={() => updateStyle({ fontStyle: selected.style.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-1.5 ${selected.style.fontStyle === 'italic' ? 'bg-accent-500/30 text-accent-400' : 'text-krone-400 hover:bg-krone-700'}`}><FiItalic size={12} /></button>
              <button onClick={() => updateStyle({ textDecoration: selected.style.textDecoration === 'underline' ? 'none' : 'underline' })} className={`p-1.5 ${selected.style.textDecoration === 'underline' ? 'bg-accent-500/30 text-accent-400' : 'text-krone-400 hover:bg-krone-700'}`}><FiUnderline size={12} /></button>
            </div>
            <input type="color" value={selected.style.color} onChange={e => updateStyle({ color: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        )}

        {/* Table cell formatting */}
        {selectedCellData && (
          <div className="flex items-center gap-1 px-3 border-r border-krone-700">
            <span className="text-xs text-krone-400 mr-1">Cellule:</span>
            <select value={selectedCellData.style.fontFamily} onChange={e => updateSelectedCellsStyle({ fontFamily: e.target.value })} className="px-2 py-1 bg-krone-700 border border-krone-600 rounded text-white text-xs w-24">
              {FONTS.map(f => <option key={f}>{f}</option>)}
            </select>
            <select value={selectedCellData.style.fontSize} onChange={e => updateSelectedCellsStyle({ fontSize: +e.target.value })} className="px-2 py-1 bg-krone-700 border border-krone-600 rounded text-white text-xs w-12">
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex border border-krone-600 rounded overflow-hidden">
              <button onClick={() => updateSelectedCellsStyle({ fontWeight: selectedCellData.style.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 ${selectedCellData.style.fontWeight === 'bold' ? 'bg-accent-500/30 text-accent-400' : 'text-krone-400 hover:bg-krone-700'}`}><FiBold size={12} /></button>
              <button onClick={() => updateSelectedCellsStyle({ fontStyle: selectedCellData.style.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-1.5 ${selectedCellData.style.fontStyle === 'italic' ? 'bg-accent-500/30 text-accent-400' : 'text-krone-400 hover:bg-krone-700'}`}><FiItalic size={12} /></button>
            </div>
            <div className="flex border border-krone-600 rounded overflow-hidden">
              <button onClick={() => updateSelectedCellsStyle({ textAlign: 'left' })} className={`p-1.5 ${selectedCellData.style.textAlign === 'left' ? 'bg-accent-500/30 text-accent-400' : 'text-krone-400 hover:bg-krone-700'}`}><FiAlignLeft size={12} /></button>
              <button onClick={() => updateSelectedCellsStyle({ textAlign: 'center' })} className={`p-1.5 ${selectedCellData.style.textAlign === 'center' ? 'bg-accent-500/30 text-accent-400' : 'text-krone-400 hover:bg-krone-700'}`}><FiAlignCenter size={12} /></button>
              <button onClick={() => updateSelectedCellsStyle({ textAlign: 'right' })} className={`p-1.5 ${selectedCellData.style.textAlign === 'right' ? 'bg-accent-500/30 text-accent-400' : 'text-krone-400 hover:bg-krone-700'}`}><FiAlignRight size={12} /></button>
            </div>
            <input type="color" value={selectedCellData.style.color} onChange={e => updateSelectedCellsStyle({ color: e.target.value })} className="w-6 h-6 rounded cursor-pointer" title="Couleur texte" />
            <input type="color" value={selectedCellData.style.backgroundColor === 'transparent' ? '#ffffff' : selectedCellData.style.backgroundColor} onChange={e => updateSelectedCellsStyle({ backgroundColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" title="Couleur fond" />
            {selectedCells.cells.length >= 2 && (
              <button onClick={mergeCells} className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded">Fusionner</button>
            )}
            {selectedCellData.colSpan > 1 || selectedCellData.rowSpan > 1 ? (
              <button onClick={unmergeCells} className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded">Défusionner</button>
            ) : null}
          </div>
        )}

        {/* Element actions */}
        {selectedId && (
          <div className="flex items-center gap-1 px-3 border-r border-krone-700">
            <button onClick={() => { const el = elements.find(e => e.id === selectedId); if (el) { setElements([...elements, { ...el, id: uuidv4(), x: el.x + 20, y: el.y + 20 }]); }}} className="p-1.5 text-krone-400 hover:text-accent-400 hover:bg-krone-700 rounded" title="Dupliquer"><FiCopy size={14} /></button>
            <button onClick={() => { setElements(prev => prev.filter(e => e.id !== selectedId)); setSelectedId(null); }} className="p-1.5 text-krone-400 hover:text-red-400 hover:bg-krone-700 rounded" title="Supprimer"><FiTrash2 size={14} /></button>
            <button onClick={() => { const i = elements.findIndex(e => e.id === selectedId); if (i < elements.length - 1) { const n = [...elements]; [n[i], n[i+1]] = [n[i+1], n[i]]; setElements(n); }}} className="p-1.5 text-krone-400 hover:text-white hover:bg-krone-700 rounded"><FiChevronUp size={14} /></button>
            <button onClick={() => { const i = elements.findIndex(e => e.id === selectedId); if (i > 0) { const n = [...elements]; [n[i], n[i-1]] = [n[i-1], n[i]]; setElements(n); }}} className="p-1.5 text-krone-400 hover:text-white hover:bg-krone-700 rounded"><FiChevronDown size={14} /></button>
          </div>
        )}

        <div className="flex-1" />

        {/* View controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded ${showGrid ? 'bg-krone-700 text-accent-400' : 'text-krone-400 hover:bg-krone-700'}`}><FiGrid size={14} /></button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-1.5 rounded ${snapToGrid ? 'bg-krone-700 text-accent-400' : 'text-krone-400 hover:bg-krone-700'}`}><FiMaximize2 size={14} /></button>
          <div className="w-px h-5 bg-krone-700" />
          <button onClick={() => setZoom(Math.max(0.25, zoom - 0.1))} className="p-1.5 text-krone-400 hover:text-white hover:bg-krone-700 rounded"><FiZoomOut size={14} /></button>
          <span className="text-xs text-krone-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1.5 text-krone-400 hover:text-white hover:bg-krone-700 rounded"><FiZoomIn size={14} /></button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Variables Panel */}
        {showVarPanel && (
          <div className="w-64 bg-krone-800 border-r border-krone-700 overflow-y-auto">
            <div className="p-3 border-b border-krone-700">
              <h4 className="text-xs font-semibold text-white uppercase">Variables</h4>
              <p className="text-xs text-krone-500 mt-1">{editingTextId ? '⚡ Insère au curseur' : editingCell ? '⚡ Insère dans la cellule' : 'Cliquez pour insérer'}</p>
            </div>
            <div className="p-2">
              {/* Regular variables grouped by category */}
              {(() => {
                const cats: Record<string, typeof variables> = {};
                variables.forEach(v => { const c = v.category; if (!cats[c]) cats[c] = []; cats[c].push(v); });
                return Object.entries(cats).map(([cat, vars]) => (
                  <div key={cat}>
                    <p className="text-[10px] text-krone-500 uppercase font-bold px-2 pt-2 pb-1">{cat}</p>
                    {vars.map(v => (
                      <button key={v.id} onClick={() => insertVariable(v.key)} onMouseDown={(e) => e.preventDefault()} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-krone-700 mb-0.5 group">
                        <code className="text-[10px] font-mono text-accent-400 bg-krone-700/50 px-1.5 py-0.5 rounded">{`{{${v.key}}}`}</code>
                        <span className="block text-xs text-krone-300 mt-0.5 group-hover:text-white">{v.name}</span>
                      </button>
                    ))}
                  </div>
                ));
              })()}

              {/* Marchandise special variables */}
              <p className="text-[10px] text-krone-500 uppercase font-bold px-2 pt-3 pb-1">🚛 Châssis & Marchandise</p>
              
              <button onClick={() => { const el: TemplateElement = { id: uuidv4(), type: 'variable', x: 50, y: 50, width: 300, height: 24, content: '{{all_chassis}}', variableKey: 'all_chassis', varConfig: { perLine: 1 }, style: { ...defaultStyle, fontSize: 11 } }; setElements(prev => [...prev, el]); setSelectedId(el.id); setShowVarPanel(false); }}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-krone-700 mb-1 border border-krone-700">
                <code className="text-[10px] font-mono text-cyan-400 bg-krone-700/50 px-1.5 py-0.5 rounded">{'{{all_chassis}}'}</code>
                <span className="block text-xs text-krone-300 mt-0.5">Tous les châssis (liste)</span>
                <span className="text-[10px] text-krone-500">→ Configurez combien par ligne à droite</span>
              </button>

              <button onClick={() => { const el: TemplateElement = { id: uuidv4(), type: 'variable', x: 50, y: 80, width: 180, height: 24, content: '{{chassis_single}}', variableKey: 'chassis_single', varConfig: { chassisNum: 1 }, style: { ...defaultStyle, fontSize: 11 } }; setElements(prev => [...prev, el]); setSelectedId(el.id); setShowVarPanel(false); }}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-krone-700 mb-1 border border-krone-700">
                <code className="text-[10px] font-mono text-cyan-400 bg-krone-700/50 px-1.5 py-0.5 rounded">{'{{chassis_single}}'}</code>
                <span className="block text-xs text-krone-300 mt-0.5">Châssis N° (individuel)</span>
                <span className="text-[10px] text-krone-500">→ Choisissez le numéro à droite</span>
              </button>

              <button onClick={() => { const el: TemplateElement = { id: uuidv4(), type: 'variable', x: 50, y: 110, width: 300, height: 60, content: '{{chassis_range}}', variableKey: 'chassis_range', varConfig: { rangeFrom: 1, rangeTo: 10, rangePerLine: 3 }, style: { ...defaultStyle, fontSize: 11 } }; setElements(prev => [...prev, el]); setSelectedId(el.id); setShowVarPanel(false); }}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-krone-700 mb-1 border border-krone-700">
                <code className="text-[10px] font-mono text-cyan-400 bg-krone-700/50 px-1.5 py-0.5 rounded">{'{{chassis_range}}'}</code>
                <span className="block text-xs text-krone-300 mt-0.5">Plage de châssis (du N au M)</span>
                <span className="text-[10px] text-krone-500">→ Configurez du/au/par ligne à droite</span>
              </button>

              <button onClick={() => { const el: TemplateElement = { id: uuidv4(), type: 'variable', x: 50, y: 140, width: 180, height: 24, content: '{{detail_unit}}', variableKey: 'detail_unit', varConfig: { unitNum: 1 }, style: { ...defaultStyle, fontSize: 11 } }; setElements(prev => [...prev, el]); setSelectedId(el.id); setShowVarPanel(false); }}
                onMouseDown={(e) => e.preventDefault()}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-krone-700 mb-1 border border-krone-700">
                <code className="text-[10px] font-mono text-purple-400 bg-krone-700/50 px-1.5 py-0.5 rounded">{'{{detail_unit}}'}</code>
                <span className="block text-xs text-krone-300 mt-0.5">Détail unité (véhicule/type/marque/poids)</span>
                <span className="text-[10px] text-krone-500">→ Choisissez le N° d'unité et le champ à droite</span>
              </button>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-500 flex items-start justify-center p-8" onClick={() => { setSelectedId(null); setEditingTextId(null); setEditingCell(null); setSelectedCells({ elemId: '', cells: [] }); setSelectedIds([]); }}>
          <div
            ref={canvasRef}
            className="bg-white shadow-2xl relative"
            style={{
              width: pageSize.width,
              height: pageSize.height,
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                backgroundSize: '10px 10px',
              }} />
            )}
            {elements.map(el => renderElement(el))}
            {selected && (
              <div className="absolute -top-7 left-0 bg-white/90 text-gray-700 text-xs px-2 py-0.5 rounded shadow-sm z-50">
                X: {Math.round(selected.x)} Y: {Math.round(selected.y)} | {Math.round(selected.width)} × {Math.round(selected.height)}
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-72 bg-krone-800 border-l border-krone-700 overflow-y-auto">
          {selected ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white uppercase flex items-center gap-2">
                  <FiSettings size={13} /> Propriétés
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-400 capitalize">{selected.type}</span>
              </div>

              {/* Position */}
              <div>
                <h5 className="text-xs text-krone-400 mb-2">Position & Taille</h5>
                <div className="grid grid-cols-2 gap-2">
                  {[{l:'X',k:'x'},{l:'Y',k:'y'},{l:'Largeur',k:'width'},{l:'Hauteur',k:'height'}].map(({l,k}) => (
                    <div key={k}>
                      <label className="text-[10px] text-krone-500 uppercase">{l}</label>
                      <input type="number" value={Math.round(selected[k as keyof TemplateElement] as number)} onChange={e => updateElement(selected.id, { [k]: +e.target.value })}
                        className="w-full px-2 py-1.5 bg-krone-700 border border-krone-600 rounded text-white text-sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Image upload */}
              {selected.type === 'image' && (
                <div>
                  <h5 className="text-xs text-krone-400 mb-2">Image</h5>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 bg-krone-700 text-krone-300 hover:text-white rounded-lg text-sm flex items-center justify-center gap-2">
                    <FiUpload size={14} /> {selected.imageData ? 'Changer l\'image' : 'Choisir une image'}
                  </button>
                  {selected.imageData && (
                    <button onClick={() => updateElement(selected.id, { imageData: undefined })} className="w-full mt-2 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm">
                      Supprimer l'image
                    </button>
                  )}
                </div>
              )}

              {/* Table controls */}
              {selected.type === 'table' && selected.tableData && (
                <div>
                  <h5 className="text-xs text-krone-400 mb-2">Tableau ({selected.tableData.rows} × {selected.tableData.cols})</h5>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button onClick={() => addTableRow(selected.id)} className="py-1.5 bg-krone-700 text-krone-300 hover:text-white rounded text-xs flex items-center justify-center gap-1">
                      <FiPlus size={12} /> Ligne
                    </button>
                    <button onClick={() => addTableCol(selected.id)} className="py-1.5 bg-krone-700 text-krone-300 hover:text-white rounded text-xs flex items-center justify-center gap-1">
                      <FiPlus size={12} /> Colonne
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => removeTableRow(selected.id)} className="py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-xs">- Ligne</button>
                    <button onClick={() => removeTableCol(selected.id)} className="py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-xs">- Colonne</button>
                  </div>
                  <p className="text-[10px] text-krone-500 mt-3">💡 Double-cliquez sur une cellule pour l'éditer. Tirez les bords pour redimensionner. Ctrl+clic pour sélectionner plusieurs cellules.</p>
                </div>
              )}

              {/* Variable selector + config */}
              {selected.type === 'variable' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-krone-400 mb-1 block">Variable</label>
                    <select value={selected.variableKey || ''} onChange={e => updateElement(selected.id, { variableKey: e.target.value, content: `{{${e.target.value}}}` })}
                      className="w-full px-3 py-2 bg-krone-700 border border-krone-600 rounded-lg text-white text-sm">
                      <option value="">-- Choisir --</option>
                      {variables.map(v => <option key={v.id} value={v.key}>{v.name}</option>)}
                      <optgroup label="🚛 Châssis & Marchandise">
                        <option value="all_chassis">Tous les châssis (liste)</option>
                        <option value="chassis_single">Châssis N° (individuel)</option>
                        <option value="chassis_range">Plage de châssis (du..au..)</option>
                        <option value="detail_unit">Détail unité (véh/type/marque/poids)</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Config: all_chassis → perLine */}
                  {selected.variableKey === 'all_chassis' && (
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <label className="text-xs text-cyan-400 mb-1 block font-semibold">Combien par ligne ?</label>
                      <input type="number" min={1} max={20} value={selected.varConfig?.perLine || 1}
                        onChange={e => updateElement(selected.id, { varConfig: { ...selected.varConfig, perLine: +e.target.value } })}
                        className="w-full px-3 py-2 bg-krone-700 border border-krone-600 rounded-lg text-white text-sm" />
                      <p className="text-[10px] text-krone-500 mt-1">Ex: 3 → affiche 3 châssis par ligne</p>
                    </div>
                  )}

                  {/* Config: chassis_single → chassisNum */}
                  {selected.variableKey === 'chassis_single' && (
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <label className="text-xs text-cyan-400 mb-1 block font-semibold">N° du châssis à afficher</label>
                      <input type="number" min={1} max={100} value={selected.varConfig?.chassisNum || 1}
                        onChange={e => updateElement(selected.id, { varConfig: { ...selected.varConfig, chassisNum: +e.target.value } })}
                        className="w-full px-3 py-2 bg-krone-700 border border-krone-600 rounded-lg text-white text-sm" />
                      <p className="text-[10px] text-krone-500 mt-1">Ex: 4 → affiche le châssis n°4</p>
                    </div>
                  )}

                  {/* Config: chassis_range → from, to, perLine */}
                  {selected.variableKey === 'chassis_range' && (
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg space-y-2">
                      <label className="text-xs text-cyan-400 font-semibold">Plage de châssis</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-krone-500">Du n°</label>
                          <input type="number" min={1} value={selected.varConfig?.rangeFrom || 1}
                            onChange={e => updateElement(selected.id, { varConfig: { ...selected.varConfig, rangeFrom: +e.target.value } })}
                            className="w-full px-2 py-1.5 bg-krone-700 border border-krone-600 rounded text-white text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] text-krone-500">Au n°</label>
                          <input type="number" min={1} value={selected.varConfig?.rangeTo || 10}
                            onChange={e => updateElement(selected.id, { varConfig: { ...selected.varConfig, rangeTo: +e.target.value } })}
                            className="w-full px-2 py-1.5 bg-krone-700 border border-krone-600 rounded text-white text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] text-krone-500">Par ligne</label>
                          <input type="number" min={1} value={selected.varConfig?.rangePerLine || 3}
                            onChange={e => updateElement(selected.id, { varConfig: { ...selected.varConfig, rangePerLine: +e.target.value } })}
                            className="w-full px-2 py-1.5 bg-krone-700 border border-krone-600 rounded text-white text-sm" />
                        </div>
                      </div>
                      <p className="text-[10px] text-krone-500">Ex: du 1 au 10, 3 par ligne</p>
                    </div>
                  )}

                  {/* Config: detail_unit → unitNum + field */}
                  {selected.variableKey === 'detail_unit' && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg space-y-2">
                      <label className="text-xs text-purple-400 font-semibold">Détails de l'unité</label>
                      <div>
                        <label className="text-[10px] text-krone-500">N° de l'unité</label>
                        <input type="number" min={1} max={100} value={selected.varConfig?.unitNum || 1}
                          onChange={e => updateElement(selected.id, { varConfig: { ...selected.varConfig, unitNum: +e.target.value } })}
                          className="w-full px-2 py-1.5 bg-krone-700 border border-krone-600 rounded text-white text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] text-krone-500">Champ à afficher</label>
                        <select value={selected.content.replace(/[{}]/g, '').split('_')[0] || 'vehicule'}
                          onChange={e => updateElement(selected.id, { content: `{{${e.target.value}_${selected.varConfig?.unitNum || 1}}}` })}
                          className="w-full px-2 py-1.5 bg-krone-700 border border-krone-600 rounded text-white text-sm">
                          <option value="vehicule">Véhicule</option>
                          <option value="type">Type</option>
                          <option value="marque">Marque</option>
                          <option value="chassis">N° Châssis</option>
                          <option value="poids">Poids</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text content */}
              {selected.type === 'text' && (
                <div>
                  <label className="text-xs text-krone-400 mb-1 block">Contenu (utilisez {`{{variable}}`} pour les variables)</label>
                  <textarea value={selected.content} onChange={e => updateElement(selected.id, { content: e.target.value })}
                    className="w-full px-3 py-2 bg-krone-700 border border-krone-600 rounded-lg text-white text-sm resize-none" rows={4} />
                </div>
              )}

              {/* Alignment on page */}
              <div>
                <h5 className="text-xs text-krone-400 mb-2">Position sur la page</h5>
                <div className="grid grid-cols-3 gap-1.5">
                  <button onClick={() => updateElement(selected.id, { x: 0 })} className="py-1.5 bg-krone-700 hover:bg-krone-600 text-krone-300 rounded-lg text-[10px] font-medium">← Gauche</button>
                  <button onClick={() => updateElement(selected.id, { x: Math.round((pageSize.width - selected.width) / 2) })} className="py-1.5 bg-krone-700 hover:bg-krone-600 text-krone-300 rounded-lg text-[10px] font-medium">↔ Centre H</button>
                  <button onClick={() => updateElement(selected.id, { x: pageSize.width - selected.width })} className="py-1.5 bg-krone-700 hover:bg-krone-600 text-krone-300 rounded-lg text-[10px] font-medium">Droite →</button>
                  <button onClick={() => updateElement(selected.id, { y: 0 })} className="py-1.5 bg-krone-700 hover:bg-krone-600 text-krone-300 rounded-lg text-[10px] font-medium">↑ Haut</button>
                  <button onClick={() => updateElement(selected.id, { y: Math.round((pageSize.height - selected.height) / 2) })} className="py-1.5 bg-krone-700 hover:bg-krone-600 text-krone-300 rounded-lg text-[10px] font-medium">↕ Centre V</button>
                  <button onClick={() => updateElement(selected.id, { y: pageSize.height - selected.height })} className="py-1.5 bg-krone-700 hover:bg-krone-600 text-krone-300 rounded-lg text-[10px] font-medium">Bas ↓</button>
                </div>
                <button onClick={() => updateElement(selected.id, { x: Math.round((pageSize.width - selected.width) / 2), y: Math.round((pageSize.height - selected.height) / 2) })} className="w-full mt-1.5 py-1.5 bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 rounded-lg text-[10px] font-semibold">⊕ Centre exact</button>
              </div>

              {/* Border */}
              {(selected.type !== 'variable') && (
                <div>
                  <h5 className="text-xs text-krone-400 mb-2">Bordure</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-krone-500">Épaisseur</label>
                      <input type="number" min={0} max={10} value={selected.style.borderWidth} onChange={e => updateStyle({ borderWidth: +e.target.value })}
                        className="w-full px-2 py-1 bg-krone-700 border border-krone-600 rounded text-white text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] text-krone-500">Style</label>
                      <select value={selected.style.borderStyle} onChange={e => updateStyle({ borderStyle: e.target.value })}
                        className="w-full px-2 py-1 bg-krone-700 border border-krone-600 rounded text-white text-xs">
                        <option value="solid">Solide</option>
                        <option value="dashed">Tirets</option>
                        <option value="dotted">Points</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-krone-500">Couleur</label>
                      <input type="color" value={selected.style.borderColor} onChange={e => updateStyle({ borderColor: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer border-0" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-krone-700/50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <FiSettings size={28} className="text-krone-500" />
              </div>
              <p className="text-sm text-krone-300 font-medium">Sélectionnez un élément</p>
              <p className="text-xs text-krone-500 mt-2">
                Cliquez et faites glisser pour déplacer.<br/>
                Double-cliquez pour éditer.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save component modal */}
      {showSaveModal && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-krone-800 rounded-2xl border border-krone-700 p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiPackage size={18} className="text-accent-400" />
                {updateExistingId ? 'Mettre à jour le composant' : 'Sauvegarder comme composant'}
              </h3>
              <button onClick={() => { setShowSaveModal(false); setUpdateExistingId(null); }} className="p-1.5 text-krone-400 hover:text-white rounded-lg hover:bg-krone-700"><FiX size={18} /></button>
            </div>
            <div className="space-y-4">
              {/* Element info */}
              <div className="p-3 bg-krone-700/30 rounded-xl border border-krone-700 flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center text-accent-400 font-bold capitalize text-sm">{selected.type.charAt(0)}</div>
                <div>
                  <p className="text-white text-sm font-medium capitalize">{selected.type}</p>
                  <p className="text-[10px] text-krone-500">Position: {Math.round(selected.x)}, {Math.round(selected.y)} • {Math.round(selected.width)} × {Math.round(selected.height)} px</p>
                </div>
              </div>

              {/* Update existing or create new */}
              {savedComponents.length > 0 && !updateExistingId && (
                <div>
                  <p className="text-xs text-krone-400 mb-2 font-semibold uppercase">Mettre à jour un composant existant :</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {savedComponents.map(c => (
                      <button key={c.id} onClick={() => { setUpdateExistingId(c.id); setCompName(c.name); setCompDesc(c.desc); }}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-krone-700/30 hover:bg-krone-700/60 rounded-lg text-left transition-colors">
                        <div className="w-6 h-6 bg-accent-500/15 rounded text-accent-400 flex items-center justify-center text-[10px] font-bold capitalize">{c.element.type.charAt(0)}</div>
                        <span className="text-sm text-krone-300">{c.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-krone-700" /><span className="text-[10px] text-krone-500">OU CRÉER NOUVEAU</span><div className="flex-1 h-px bg-krone-700" />
                  </div>
                </div>
              )}

              {updateExistingId && (
                <button onClick={() => { setUpdateExistingId(null); setCompName(''); setCompDesc(''); }}
                  className="text-xs text-accent-400 hover:text-accent-300">← Créer un nouveau à la place</button>
              )}

              <div>
                <label className="block text-xs text-krone-400 mb-1.5 font-semibold uppercase">Nom *</label>
                <input type="text" value={compName} onChange={e => setCompName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveComponent()}
                  className="w-full px-4 py-2.5 bg-krone-700 border border-krone-600 rounded-xl text-white focus:border-accent-500 focus:outline-none" placeholder="Ex: Titre principal" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-krone-400 mb-1.5 font-semibold uppercase">Description (optionnel)</label>
                <input type="text" value={compDesc} onChange={e => setCompDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-krone-700 border border-krone-600 rounded-xl text-white focus:border-accent-500 focus:outline-none" placeholder="Ex: Arial 18px gras" />
              </div>
              <button onClick={saveComponent} disabled={!compName.trim()}
                className="w-full py-3 bg-accent-500 hover:bg-accent-600 text-krone-900 rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                {updateExistingId ? '↻ Mettre à jour' : '💾 Sauvegarder nouveau'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load component modal */}
      {showLoadModal && (() => {
        const savedGroups: { id: string; name: string; desc: string; elements: TemplateElement[]; createdAt: string }[] = (() => {
          try { return JSON.parse(localStorage.getItem('krone_saved_groups') || '[]'); } catch { return []; }
        })();
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-krone-800 rounded-2xl border border-krone-700 p-6 w-full max-w-xl shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FiPackage size={18} className="text-accent-400" /> Importer un composant / groupe</h3>
                <button onClick={() => setShowLoadModal(false)} className="p-1.5 text-krone-400 hover:text-white rounded-lg hover:bg-krone-700"><FiX size={18} /></button>
              </div>
              
              {/* Composants */}
              {savedComponents.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-krone-400 uppercase font-bold mb-2 flex items-center gap-1"><FiSave size={10} /> Composants simples</p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {savedComponents.map(comp => (
                      <div key={comp.id} className="flex items-center gap-3 p-3 bg-krone-700/30 rounded-xl border border-krone-700 hover:border-krone-600 transition-colors group">
                        <div className="w-10 h-10 bg-accent-500/15 rounded-lg flex items-center justify-center text-accent-400 font-bold capitalize text-sm shrink-0">{comp.element.type.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{comp.name}</p>
                          {comp.desc && <p className="text-[10px] text-krone-500 truncate">{comp.desc}</p>}
                          <p className="text-[10px] text-krone-600 capitalize">{comp.element.type} • {Math.round(comp.element.width)}×{Math.round(comp.element.height)}</p>
                        </div>
                        <button onClick={() => loadComponent(comp)} className="px-3 py-1.5 bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 rounded-lg text-xs font-semibold shrink-0">
                          Insérer
                        </button>
                        <button onClick={() => deleteComponent(comp.id)} className="p-1.5 text-krone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 shrink-0">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Groupes */}
              {savedGroups.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-blue-400 uppercase font-bold mb-2 flex items-center gap-1"><FiPackage size={10} /> Groupes d'éléments</p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {savedGroups.map(grp => (
                      <div key={grp.id} className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-colors group">
                        <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                          {grp.elements.length}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{grp.name}</p>
                          {grp.desc && <p className="text-[10px] text-krone-500 truncate">{grp.desc}</p>}
                          <p className="text-[10px] text-krone-600">{grp.elements.length} éléments • {new Date(grp.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <button onClick={() => loadGroup(grp)} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-semibold shrink-0">
                          Insérer
                        </button>
                        <button onClick={() => {
                          const updated = savedGroups.filter(g => g.id !== grp.id);
                          localStorage.setItem('krone_saved_groups', JSON.stringify(updated));
                          setShowLoadModal(false);
                          setTimeout(() => setShowLoadModal(true), 0);
                        }} className="p-1.5 text-krone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 shrink-0">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {savedComponents.length === 0 && savedGroups.length === 0 && (
                <div className="text-center py-8">
                  <FiPackage size={40} className="mx-auto text-krone-600 mb-3" />
                  <p className="text-krone-400 text-sm">Aucun composant ou groupe sauvegardé</p>
                  <p className="text-krone-500 text-xs mt-1">Sélectionnez un ou plusieurs éléments et cliquez "Sauvegarder" ou "Enreg. Groupe"</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Save Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-krone-800 rounded-2xl border border-krone-700 p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiPackage size={18} className="text-green-400" /> Enregistrer le groupe
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="p-1.5 text-krone-400 hover:text-white rounded-lg hover:bg-krone-700"><FiX size={18} /></button>
            </div>
            <p className="text-xs text-krone-400 mb-4">
              {selectedIds.length} élément(s) sélectionné(s) seront sauvegardés ensemble et apparaîtront dans <strong className="text-white">Gestion des Fichiers → Groupes</strong>.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-krone-400 mb-1.5">Nom du groupe *</label>
                <input
                  type="text"
                  value={groupNameInput}
                  onChange={e => setGroupNameInput(e.target.value)}
                  placeholder="Ex: En-tête standard, Bloc signature..."
                  className="w-full px-3 py-2.5 bg-krone-700 border border-krone-600 rounded-lg text-white text-sm focus:border-green-400 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-krone-400 mb-1.5">Description (optionnel)</label>
                <input
                  type="text"
                  value={groupDescInput}
                  onChange={e => setGroupDescInput(e.target.value)}
                  placeholder="Description du groupe..."
                  className="w-full px-3 py-2.5 bg-krone-700 border border-krone-600 rounded-lg text-white text-sm focus:border-green-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveAsGroup}
                  disabled={!groupNameInput.trim()}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  Enregistrer le groupe
                </button>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2.5 bg-krone-700 text-krone-300 hover:bg-krone-600 rounded-lg text-sm transition-colors"
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
