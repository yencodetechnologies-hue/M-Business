import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

// ─── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = [
  { name:"Violet",  p:"#7c3aed", g:"linear-gradient(135deg,#7c3aed,#a855f7)", l:"#ede9fe", t:"#4c1d95" },
  { name:"Cobalt",  p:"#1d4ed8", g:"linear-gradient(135deg,#1e40af,#3b82f6)", l:"#dbeafe", t:"#1e3a8a" },
  { name:"Emerald", p:"#059669", g:"linear-gradient(135deg,#065f46,#10b981)", l:"#d1fae5", t:"#064e3b" },
  { name:"Rose",    p:"#e11d48", g:"linear-gradient(135deg,#9f1239,#f43f5e)", l:"#ffe4e6", t:"#881337" },
  { name:"Amber",   p:"#d97706", g:"linear-gradient(135deg,#92400e,#fbbf24)", l:"#fef3c7", t:"#78350f" },
  { name:"Slate",   p:"#334155", g:"linear-gradient(135deg,#0f172a,#475569)", l:"#f1f5f9", t:"#0f172a" },
  { name:"Teal",    p:"#0d9488", g:"linear-gradient(135deg,#134e4a,#2dd4bf)", l:"#ccfbf1", t:"#134e4a" },
  { name:"Fuchsia", p:"#a21caf", g:"linear-gradient(135deg,#701a75,#e879f9)", l:"#fae8ff", t:"#4a044e" },
];

const P = {
  accent: "#9333ea",
  mid: "#7c3aed",
  dark: "#1e0a3c",
  light: "#f5f3ff",
  border: "#ede9fe",
  text: "#1e0a3c",
  muted: "#a78bfa",
  hover: "#faf5ff",
};

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const PRESET_SIZES = [
  { name: "A4 Portrait", width: A4_WIDTH, height: A4_HEIGHT },
  { name: "A4 Landscape", width: A4_HEIGHT, height: A4_WIDTH },
  { name: "Letter Portrait", width: 816, height: 1056 },
  { name: "Letter Landscape", width: 1056, height: 816 },
  { name: "Square", width: 600, height: 600 },
];

// ─── CANVAS ELEMENTS ─────────────────────────────────────────────────────────────
function CanvasElement({ element, isSelected, onSelect, onUpdate, onDelete, canvasRef }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      onSelect(element.id);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    onSelect(element.id);
    setIsDragging(true);

    const canvas = canvasRef?.current;
    if (!canvas) {
      setDragStart({ x: e.clientX - element.x, y: e.clientY - element.y });
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const scale = 900 / rect.width;
    setDragStart({
      x: (e.clientX - rect.left) * scale - element.x,
      y: (e.clientY - rect.top) * scale - element.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => {
      const canvas = canvasRef?.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scale = 900 / rect.width;
      let nx = (e.clientX - rect.left) * scale - dragStart.x;
      let ny = (e.clientY - rect.top) * scale - dragStart.y;
      
      // Canvas boundary clamp
      nx = Math.max(0, Math.min(900 - (element.width || 100), nx));
      ny = Math.max(0, Math.min(506 - (element.height || 40), ny));
      onUpdate({ x: nx, y: ny });
    };
    const up = () => setIsDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [isDragging, dragStart, canvasRef, element.width, element.height, onUpdate]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.width || "auto",
        height: element.height || "auto",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        border: isSelected ? `2px solid ${P.accent}` : "2px solid transparent",
        borderRadius: 8,
        padding: isSelected ? 6 : 0,
        zIndex: isSelected ? 100 : 1,
        transition: isDragging ? "none" : "border .1s",
        boxSizing: "border-box",
      }}
    >
      {/* Delete button for selected element */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(element.id);
          }}
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#e2445c",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 20,
          }}
        >
          ×
        </button>
      )}

      {element.type === "text" && (
        <div
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => onUpdate({ text: e.currentTarget.textContent })}
          style={{
            fontSize: element.fontSize || 16,
            fontWeight: element.fontWeight || 400,
            color: element.color || "#000",
            fontFamily: element.fontFamily || "'Plus Jakarta Sans', sans-serif",
            outline: "none",
            padding: 4,
            minWidth: 100,
          }}
        >
          {element.text || "Edit text..."}
        </div>
      )}

      {element.type === "shape" && (
        <div
          style={{
            width: element.width || 100,
            height: element.height || 100,
            background: element.color || P.accent,
            borderRadius: element.borderRadius !== undefined ? element.borderRadius + 'px' : (element.shape === 'circle' ? '50%' : '8px'),
          }}
        />
      )}

      {element.type === "image" && (
        <img
          src={element.src}
          alt=""
          style={{
            width: element.width || 200,
            height: element.height || "auto",
            borderRadius: 8,
            display: "block",
            pointerEvents: "none",
          }}
        />
      )}

      {element.type === "line" && (
        <svg
          style={{
            position: "absolute",
            left: element.x,
            top: element.y,
            width: element.width || 200,
            height: element.height || 2,
            pointerEvents: "none",
          }}
        >
          <line
            x1="0"
            y1="0"
            x2={element.width || 200}
            y2="0"
            stroke={element.color || P.accent}
            strokeWidth={element.height || 2}
          />
        </svg>
      )}

      {element.type === "heading" && (
        <h1
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={(e) => onUpdate({ text: e.currentTarget.textContent })}
          style={{
            fontSize: element.fontSize || 24,
            fontWeight: element.fontWeight || 700,
            color: element.color || P.text,
            fontFamily: element.fontFamily || "'Plus Jakarta Sans', sans-serif",
            outline: "none",
            margin: 0,
            padding: 4,
            minWidth: 200,
          }}
        >
          {element.text || "Edit heading..."}
        </h1>
      )}
    </div>
  );
}

// ─── CANVAS SIZE CONTROLS ───────────────────────────────────────────────────────
function CanvasSizeControls({ currentSize, onSizeChange }) {
  const [customWidth, setCustomWidth] = useState(currentSize.width);
  const [customHeight, setCustomHeight] = useState(currentSize.height);
  const [isCustom, setIsCustom] = useState(false);

  const isPortrait = currentSize.height >= currentSize.width;

  const handlePresetClick = (preset) => {
    onSizeChange(preset.width, preset.height);
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
    setIsCustom(false);
  };

  const handleCustomApply = () => {
    if (customWidth > 0 && customHeight > 0) onSizeChange(customWidth, customHeight);
  };

  const swapDimensions = () => {
    const w = currentSize.height, h = currentSize.width;
    onSizeChange(w, h);
    setCustomWidth(w);
    setCustomHeight(h);
  };

  return (
    <div style={{
      background: '#fff', border: `1px solid ${P.border}`,
      borderRadius: 12, padding: 16, marginBottom: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: P.text, marginBottom: 12 }}>Canvas Size</div>

      {/* Portrait / Landscape toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Portrait', icon: '▯', active: isPortrait },
          { label: 'Landscape', icon: '▭', active: !isPortrait },
        ].map(({ label, icon, active }) => (
          <button
            key={label}
            onClick={swapDimensions}
            style={{
              flex: 1, padding: '8px 6px',
              border: `1.5px solid ${active ? P.accent : P.border}`,
              borderRadius: 8,
              background: active ? P.light : '#fff',
              color: active ? P.accent : P.muted,
              fontSize: 12, fontWeight: active ? 700 : 400,
              cursor: active ? 'default' : 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Presets */}
      <div style={{ fontSize: 11, color: P.muted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.3 }}>PRESETS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
        {PRESET_SIZES.map(preset => {
          const active = currentSize.width === preset.width && currentSize.height === preset.height;
          return (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              style={{
                padding: '7px 10px', border: `1px solid ${active ? P.accent : P.border}`,
                borderRadius: 7, textAlign: 'left',
                background: active ? P.light : '#fff',
                color: active ? P.accent : P.text,
                fontSize: 12, cursor: 'pointer',
                fontWeight: active ? 700 : 400,
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', transition: 'all 0.15s',
              }}
            >
              <span>{preset.name}</span>
              <span style={{ fontSize: 10, color: active ? P.muted : '#c4b5fd' }}>
                {preset.width}×{preset.height}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom */}
      <div style={{ fontSize: 11, color: P.muted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.3 }}>CUSTOM</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="number"
          value={customWidth}
          onChange={e => { setCustomWidth(Number(e.target.value)); setIsCustom(true); }}
          placeholder="W"
          style={{ width: 68, padding: '6px 8px', border: `1px solid ${P.border}`, borderRadius: 6, fontSize: 12, outline: 'none', color: P.text }}
        />
        <span style={{ color: P.muted, flexShrink: 0 }}>×</span>
        <input
          type="number"
          value={customHeight}
          onChange={e => { setCustomHeight(Number(e.target.value)); setIsCustom(true); }}
          placeholder="H"
          style={{ width: 68, padding: '6px 8px', border: `1px solid ${P.border}`, borderRadius: 6, fontSize: 12, outline: 'none', color: P.text }}
        />
        <button
          onClick={handleCustomApply}
          disabled={!isCustom}
          style={{
            padding: '6px 10px', background: isCustom ? P.accent : P.border,
            color: isCustom ? '#fff' : P.muted, border: 'none',
            borderRadius: 6, fontSize: 11, cursor: isCustom ? 'pointer' : 'default',
            fontWeight: 600,
          }}
        >Apply</button>
      </div>

      <div style={{ fontSize: 11, color: P.muted, marginTop: 10 }}>
        {currentSize.width} × {currentSize.height}px &middot;{' '}
        {currentSize.width > currentSize.height ? 'Landscape' : currentSize.width < currentSize.height ? 'Portrait' : 'Square'}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────────
export default function CanvasProposalEditor({ proposalId, onSave, onClose }) {
  const [canvasSize, setCanvasSize] = useState({ width: A4_WIDTH, height: A4_HEIGHT });
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [isAddingShape, setIsAddingShape] = useState(false);
  const [isAddingHeading, setIsAddingHeading] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isAddingLine, setIsAddingLine] = useState(false);
  const [isAddingRectangle, setIsAddingRectangle] = useState(false);
  const [isAddingCircle, setIsAddingCircle] = useState(false);
  const [selectedColor, setSelectedColor] = useState(P.accent);
  const [selectedFontSize, setSelectedFontSize] = useState(16);
  const [selectedFontFamily, setSelectedFontFamily] = useState("'Plus Jakarta Sans', sans-serif");
  const [proposalData, setProposalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const canvasRef = useRef();

  useEffect(() => {
    fetchClients();
    if (proposalId) {
      loadProposal();
    } else {
      setLoading(false);
    }
  }, [proposalId]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/clients`);
      setClients(response.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    }
  };

  const loadProposal = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/proposals/${proposalId}`);
      setProposalData(response.data);
      
      // Load existing canvas elements if any
      if (response.data.canvasElements) {
        setElements(response.data.canvasElements);
      }
      
      // Load canvas size if set
      if (response.data.canvasSize) {
        setCanvasSize(response.data.canvasSize);
      }
    } catch (error) {
      console.error("Error loading proposal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setSelectedElement(null);
      
      // Add element based on selected mode
      if (isAddingText || isAddingHeading || isAddingShape || isAddingLine || isAddingRectangle || isAddingCircle) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left - 50, canvasSize.width - 100));
        const y = Math.max(0, Math.min(e.clientY - rect.top - 25, canvasSize.height - 50));
        
        let newElement = {
          id: Date.now(),
          x,
          y,
          width: 100,
          height: 50,
          color: selectedColor,
          fontSize: selectedFontSize,
          fontFamily: selectedFontFamily,
        };

        if (isAddingText) {
          newElement.type = "text";
          newElement.text = "Edit text...";
          newElement.fontWeight = 400;
        } else if (isAddingHeading) {
          newElement.type = "heading";
          newElement.text = "Edit heading...";
          newElement.fontWeight = 700;
          newElement.fontSize = 24;
        } else if (isAddingLine) {
          newElement.type = "line";
          newElement.width = 200;
          newElement.height = 2;
          newElement.x2 = x + 200;
          newElement.y2 = y;
        } else if (isAddingRectangle) {
          newElement.type = "shape";
          newElement.shape = "rectangle";
          newElement.borderRadius = 8;
        } else if (isAddingCircle) {
          newElement.type = "shape";
          newElement.shape = "circle";
          newElement.borderRadius = "50%";
        } else {
          newElement.type = "shape";
          newElement.shape = "rectangle";
          newElement.borderRadius = 8;
        }
        
        setElements(prev => [...prev, newElement]);
        setIsAddingText(false);
        setIsAddingHeading(false);
        setIsAddingShape(false);
        setIsAddingLine(false);
        setIsAddingRectangle(false);
        setIsAddingCircle(false);
        setSelectedElement(newElement.id);
      }
    }
  };

  const handleElementUpdate = (elementId, updates) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  const handleElementDelete = (elementId) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newElement = {
          id: Date.now(),
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          type: "image",
          src: event.target.result,
        };
        setElements(prev => [...prev, newElement]);
        setIsAddingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedClient || !proposalTitle.trim()) {
      alert("Please select a client and enter a proposal title");
      return;
    }

    setSaving(true);
    try {
      const proposalUpdate = {
        canvasElements: elements,
        canvasSize: canvasSize,
        updatedAt: new Date(),
      };

      if (proposalId) {
        await axios.put(`${BASE_URL}/api/proposals/${proposalId}`, proposalUpdate);
      } else {
        // Create new proposal
        const newProposal = {
          id: `PROP-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`,
          title: proposalTitle.trim(),
          client: selectedClient,
          status: "draft",
          theme: "Violet",
          format: "canvas",
          canvasElements: elements,
          canvasSize: canvasSize,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        };
        const response = await axios.post(`${BASE_URL}/api/proposals`, newProposal);
        setProposalData(response.data);
      }

      if (onSave) onSave();
    } catch (error) {
      console.error("Error saving proposal:", error);
      alert("Failed to save proposal");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: P.light }}>
        <div style={{ fontSize: 18, color: P.text }}>Loading proposal...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: P.light,
      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif", padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input[type=number] { font-family: inherit; }
        button { font-family: inherit; }
      `}</style>

      {/* Header */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: 16, marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: P.text }}>
            {proposalId ? `Edit Proposal: ${proposalData?.title || 'Untitled'}` : 'Create New Proposal'}
          </h2>
          
          {/* Client and Title inputs for new proposals */}
          {!proposalId && (
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: P.muted, fontWeight: 600, marginBottom: 4 }}>CLIENT</label>
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${P.border}`,
                    borderRadius: 6,
                    fontSize: 12,
                    background: '#fff',
                    outline: 'none',
                    color: P.text
                  }}
                >
                  <option value="">Select Client</option>
                  {clients.map((client, i) => (
                    <option key={i} value={client.clientName || client.name || ""}>
                      {client.clientName || client.name || ""}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: P.muted, fontWeight: 600, marginBottom: 4 }}>TITLE</label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={e => setProposalTitle(e.target.value)}
                  placeholder="Enter proposal title..."
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${P.border}`,
                    borderRadius: 6,
                    fontSize: 12,
                    background: '#fff',
                    outline: 'none',
                    color: P.text
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: P.accent, color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Proposal'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <CanvasSizeControls
            currentSize={canvasSize}
            onSizeChange={(w, h) => setCanvasSize({ width: w, height: h })}
          />

          {/* Elements Panel */}
          <div style={{
            background: '#fff', border: `1px solid ${P.border}`,
            borderRadius: 12, padding: 16, marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: P.text, marginBottom: 12 }}>Add Elements</div>
            
            {/* Color and Font Controls */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: P.muted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.3 }}>STYLING</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>Color:</label>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                  style={{
                    width: 40,
                    height: 30,
                    border: `1px solid ${P.border}`,
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>Font:</label>
                <select
                  value={selectedFontSize}
                  onChange={e => setSelectedFontSize(Number(e.target.value))}
                  style={{
                    padding: '4px 6px',
                    border: `1px solid ${P.border}`,
                    borderRadius: 4,
                    fontSize: 11,
                    marginRight: 6
                  }}
                >
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                  <option value="24">24px</option>
                  <option value="28">28px</option>
                  <option value="32">32px</option>
                </select>
                <select
                  value={selectedFontFamily}
                  onChange={e => setSelectedFontFamily(e.target.value)}
                  style={{
                    padding: '4px 6px',
                    border: `1px solid ${P.border}`,
                    borderRadius: 4,
                    fontSize: 11
                  }}
                >
                  <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times</option>
                  <option value="'Courier New', monospace">Courier</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 11, color: P.muted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.3 }}>ELEMENTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => {
                  setIsAddingText(!isAddingText);
                  setIsAddingHeading(false);
                  setIsAddingShape(false);
                  setIsAddingImage(false);
                  setIsAddingLine(false);
                  setIsAddingRectangle(false);
                  setIsAddingCircle(false);
                }}
                style={{
                  padding: '8px 12px',
                  background: isAddingText ? P.mid : P.accent,
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                📝 Add Text
              </button>

              <button
                onClick={() => {
                  setIsAddingHeading(!isAddingHeading);
                  setIsAddingText(false);
                  setIsAddingShape(false);
                  setIsAddingImage(false);
                  setIsAddingLine(false);
                  setIsAddingRectangle(false);
                  setIsAddingCircle(false);
                }}
                style={{
                  padding: '8px 12px',
                  background: isAddingHeading ? P.mid : P.accent,
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                📰 Add Heading
              </button>

              <button
                onClick={() => {
                  setIsAddingLine(!isAddingLine);
                  setIsAddingText(false);
                  setIsAddingHeading(false);
                  setIsAddingShape(false);
                  setIsAddingImage(false);
                  setIsAddingRectangle(false);
                  setIsAddingCircle(false);
                }}
                style={{
                  padding: '8px 12px',
                  background: isAddingLine ? P.mid : P.accent,
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                📏 Add Line
              </button>

              <button
                onClick={() => {
                  setIsAddingRectangle(!isAddingRectangle);
                  setIsAddingText(false);
                  setIsAddingHeading(false);
                  setIsAddingShape(false);
                  setIsAddingImage(false);
                  setIsAddingLine(false);
                  setIsAddingCircle(false);
                }}
                style={{
                  padding: '8px 12px',
                  background: isAddingRectangle ? P.mid : P.accent,
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ⬜ Add Rectangle
              </button>

              <button
                onClick={() => {
                  setIsAddingCircle(!isAddingCircle);
                  setIsAddingText(false);
                  setIsAddingHeading(false);
                  setIsAddingShape(false);
                  setIsAddingImage(false);
                  setIsAddingLine(false);
                  setIsAddingRectangle(false);
                }}
                style={{
                  padding: '8px 12px',
                  background: isAddingCircle ? P.mid : P.accent,
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ⭕ Add Circle
              </button>

              <label style={{
                padding: '8px 12px',
                background: isAddingImage ? P.mid : P.accent,
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'block', textAlign: 'center',
              }}>
                🖼️ Add Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {(isAddingText || isAddingHeading || isAddingShape) && (
              <div style={{
                padding: '8px 10px', background: P.light, borderRadius: 8,
                fontSize: 11, color: P.mid, marginTop: 8, lineHeight: 1.5,
              }}>
                Click anywhere on the canvas to place the element.
              </div>
            )}

            <div style={{ fontSize: 11, color: P.muted, marginTop: 12 }}>
              Total elements: {elements.length}
            </div>
          </div>

          {/* Elements List */}
          {elements.length > 0 && (
            <div style={{
              background: '#fff', border: `1px solid ${P.border}`,
              borderRadius: 12, padding: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: P.text, marginBottom: 12 }}>Elements</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {elements.map((element, i) => (
                  <div
                    key={element.id}
                    onClick={() => setSelectedElement(element.id)}
                    style={{
                      padding: '6px 9px', borderRadius: 6,
                      border: `1px solid ${selectedElement === element.id ? P.accent : P.border}`,
                      background: selectedElement === element.id ? P.light : '#fff',
                      fontSize: 12, color: P.text, cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span>{element.type === 'text' ? '📝' : element.type === 'heading' ? '📰' : element.type === 'shape' ? '⬜' : '🖼️'} {element.type}</span>
                    <span style={{ fontSize: 10, color: P.muted }}>
                      {Math.round(element.width || 0)}×{Math.round(element.height || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              width: canvasSize.width, height: canvasSize.height,
              background: '#fff',
              border: `2px solid ${P.border}`,
              borderRadius: 8, position: 'relative',
              margin: '0 auto',
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              cursor: (isAddingText || isAddingHeading || isAddingShape) ? 'crosshair' : 'default',
              transition: 'width 0.3s ease, height 0.3s ease',
            }}
          >
            {elements.map(element => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={selectedElement === element.id}
                onSelect={setSelectedElement}
                onUpdate={(updates) => handleElementUpdate(element.id, updates)}
                onDelete={handleElementDelete}
                canvasRef={canvasRef}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: P.muted }}>
            {canvasSize.width} × {canvasSize.height}px &middot;{' '}
            {canvasSize.width > canvasSize.height ? 'Landscape' : canvasSize.width < canvasSize.height ? 'Portrait' : 'Square'}
          </div>
        </div>
      </div>
    </div>
  );
}
