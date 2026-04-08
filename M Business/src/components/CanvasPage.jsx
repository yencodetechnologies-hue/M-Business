import React, { useState, useRef, useEffect } from 'react';

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

/* ── Draggable + Resizable Item ── */
function DraggableItem({ id, x, y, width, height, content, onDrag, onResize, onDelete, isSelected, onSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState(null); // null | 'se' | 'sw' | 'ne' | 'nw' | 'n' | 's' | 'e' | 'w'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0, itemX: 0, itemY: 0 });
  const itemRef = useRef();

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(id);

    const dir = e.target.dataset.resize;
    if (dir) {
      setResizeDir(dir);
      setResizeStart({ width, height, x: e.clientX, y: e.clientY, itemX: x, itemY: y });
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - x, y: e.clientY - y });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        onDrag(id, e.clientX - dragStart.x, e.clientY - dragStart.y);
      } else if (resizeDir) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        let newW = resizeStart.width;
        let newH = resizeStart.height;
        let newX = resizeStart.itemX;
        let newY = resizeStart.itemY;

        if (resizeDir.includes('e')) newW = Math.max(60, resizeStart.width + dx);
        if (resizeDir.includes('s')) newH = Math.max(40, resizeStart.height + dy);
        if (resizeDir.includes('w')) {
          newW = Math.max(60, resizeStart.width - dx);
          newX = resizeStart.itemX + (resizeStart.width - newW);
        }
        if (resizeDir.includes('n')) {
          newH = Math.max(40, resizeStart.height - dy);
          newY = resizeStart.itemY + (resizeStart.height - newH);
        }

        onResize(id, newW, newH, newX, newY);
      }
    };

    const handleMouseUp = () => { setIsDragging(false); setResizeDir(null); };

    if (isDragging || resizeDir) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, resizeDir, dragStart, resizeStart, id, onDrag, onResize]);

  const handleStyle = (cursor, pos) => ({
    position: 'absolute',
    ...pos,
    background: isSelected ? P.accent : 'transparent',
    cursor,
    zIndex: 10,
  });

  const EDGE = 6; // px for edge handles
  const CORNER = 10;

  return (
    <div
      ref={itemRef}
      style={{
        position: 'absolute',
        left: x, top: y, width, height,
        border: isSelected ? `2px solid ${P.accent}` : `1px solid ${P.border}`,
        borderRadius: 8,
        background: '#fff',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isSelected ? '0 4px 12px rgba(147,51,234,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
        padding: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: P.text, userSelect: 'none',
        boxSizing: 'border-box',
      }}
      onMouseDown={handleMouseDown}
    >
      {content}

      {/* Delete button */}
      {isSelected && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(id); }}
          style={{
            position: 'absolute', top: -10, right: -10,
            width: 22, height: 22, borderRadius: '50%',
            background: '#e2445c', color: '#fff', border: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)', zIndex: 20,
          }}
        >×</button>
      )}

      {/* ── Resize handles (8 directions) ── */}
      {isSelected && (<>
        {/* Corners */}
        <div data-resize="nw" style={{ ...handleStyle('nw-resize', { top: -4, left: -4 }), width: CORNER, height: CORNER, borderRadius: 2 }} />
        <div data-resize="ne" style={{ ...handleStyle('ne-resize', { top: -4, right: -4 }), width: CORNER, height: CORNER, borderRadius: 2 }} />
        <div data-resize="sw" style={{ ...handleStyle('sw-resize', { bottom: -4, left: -4 }), width: CORNER, height: CORNER, borderRadius: 2 }} />
        <div data-resize="se" style={{ ...handleStyle('se-resize', { bottom: -4, right: -4 }), width: CORNER, height: CORNER, borderRadius: 2 }} />

        {/* Edges */}
        <div data-resize="n" style={{ ...handleStyle('n-resize', { top: -3, left: '50%', transform: 'translateX(-50%)' }), width: 24, height: EDGE, borderRadius: 3 }} />
        <div data-resize="s" style={{ ...handleStyle('s-resize', { bottom: -3, left: '50%', transform: 'translateX(-50%)' }), width: 24, height: EDGE, borderRadius: 3 }} />
        <div data-resize="w" style={{ ...handleStyle('w-resize', { left: -3, top: '50%', transform: 'translateY(-50%)' }), width: EDGE, height: 24, borderRadius: 3 }} />
        <div data-resize="e" style={{ ...handleStyle('e-resize', { right: -3, top: '50%', transform: 'translateY(-50%)' }), width: EDGE, height: 24, borderRadius: 3 }} />
      </>)}
    </div>
  );
}

/* ── Canvas Size Controls ── */
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

/* ── Main Page ── */
export default function CanvasPage() {
  const [canvasSize, setCanvasSize] = useState({ width: A4_WIDTH, height: A4_HEIGHT });
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const canvasRef = useRef();

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) setSelectedItem(null);
  };

  const handleItemDrag = (id, x, y) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, x, y } : item));
  };

  // Updated: accepts x,y too (for NW/NE/SW/N/W resize)
  const handleItemResize = (id, width, height, x, y) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, width, height, ...(x !== undefined ? { x, y } : {}) }
        : item
    ));
  };

  const handleItemDelete = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (selectedItem === id) setSelectedItem(null);
  };

  const placeItem = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left - 100, canvasSize.width - 200));
    const y = Math.max(0, Math.min(clientY - rect.top - 75, canvasSize.height - 150));
    setItems(prev => [...prev, {
      id: Date.now(), x, y, width: 200, height: 150,
      content: `Item ${prev.length + 1}`,
    }]);
    setIsAddingItem(false);
  };

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

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <CanvasSizeControls
            currentSize={canvasSize}
            onSizeChange={(w, h) => setCanvasSize({ width: w, height: h })}
          />

          {/* Items panel */}
          <div style={{
            background: '#fff', border: `1px solid ${P.border}`,
            borderRadius: 12, padding: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: P.text, marginBottom: 12 }}>Items</div>
            <button
              onClick={() => setIsAddingItem(v => !v)}
              style={{
                width: '100%', padding: '8px 12px',
                background: isAddingItem ? P.mid : P.accent,
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 10,
              }}
            >
              {isAddingItem ? '✕ Cancel — click canvas to place' : '+ Add Item'}
            </button>

            {isAddingItem && (
              <div style={{
                padding: '8px 10px', background: P.light, borderRadius: 8,
                fontSize: 11, color: P.mid, marginBottom: 8, lineHeight: 1.5,
              }}>
                Click anywhere on the canvas to place the item.
              </div>
            )}

            <div style={{ fontSize: 11, color: P.muted }}>
              Total items: {items.length}
            </div>

            {items.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item.id)}
                    style={{
                      padding: '6px 9px', borderRadius: 6,
                      border: `1px solid ${selectedItem === item.id ? P.accent : P.border}`,
                      background: selectedItem === item.id ? P.light : '#fff',
                      fontSize: 12, color: P.text, cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span>{item.content}</span>
                    <span style={{ fontSize: 10, color: P.muted }}>
                      {Math.round(item.width)}×{Math.round(item.height)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseDown={e => {
              if (isAddingItem && e.target === canvasRef.current) {
                placeItem(e.clientX, e.clientY);
              }
            }}
            style={{
              width: canvasSize.width, height: canvasSize.height,
              background: '#fff',
              border: `2px solid ${P.border}`,
              borderRadius: 8, position: 'relative',
              margin: '0 auto',
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              cursor: isAddingItem ? 'crosshair' : 'default',
              transition: 'width 0.3s ease, height 0.3s ease',
            }}
          >
            {items.map(item => (
              <DraggableItem
                key={item.id}
                {...item}
                isSelected={selectedItem === item.id}
                onDrag={handleItemDrag}
                onResize={handleItemResize}
                onDelete={handleItemDelete}
                onSelect={setSelectedItem}
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
