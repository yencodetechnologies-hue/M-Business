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

// A4 dimensions in pixels (96 DPI)
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const PRESET_SIZES = [
  { name: "A4 Portrait", width: A4_WIDTH, height: A4_HEIGHT, orientation: "portrait" },
  { name: "A4 Landscape", width: A4_HEIGHT, height: A4_WIDTH, orientation: "landscape" },
  { name: "Letter Portrait", width: 816, height: 1056, orientation: "portrait" },
  { name: "Letter Landscape", width: 1056, height: 816, orientation: "landscape" },
  { name: "Square", width: 600, height: 600, orientation: "square" },
];

function DraggableItem({ id, x, y, width, height, content, onDrag, onResize, onDelete, isSelected, onSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const itemRef = useRef();

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(id);
    
    if (e.target.dataset.action === 'resize') {
      setIsResizing(true);
      setResizeStart({ 
        width, 
        height, 
        x: e.clientX, 
        y: e.clientY 
      });
    } else {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - x, 
        y: e.clientY - y 
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        onDrag(id, newX, newY);
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(50, resizeStart.width + deltaX);
        const newHeight = Math.max(50, resizeStart.height + deltaY);
        onResize(id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, id, onDrag, onResize]);

  return (
    <div
      ref={itemRef}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        border: isSelected ? `2px solid ${P.accent}` : `1px solid ${P.border}`,
        borderRadius: 8,
        background: '#fff',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isSelected ? '0 4px 12px rgba(147, 51, 234, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color: P.text,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {content}
      
      {/* Resize handle */}
      <div
        data-action="resize"
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 16,
          height: 16,
          background: P.accent,
          cursor: 'se-resize',
          borderRadius: '0 0 6px 0',
          opacity: 0.7,
        }}
      />
      
      {/* Delete button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#e2445c',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function CanvasSizeControls({ currentSize, onSizeChange, onOrientationChange }) {
  const [customWidth, setCustomWidth] = useState(currentSize.width);
  const [customHeight, setCustomHeight] = useState(currentSize.height);
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetClick = (preset) => {
    onSizeChange(preset.width, preset.height);
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
    setIsCustom(false);
  };

  const handleCustomSizeApply = () => {
    onSizeChange(customWidth, customHeight);
  };

  const swapDimensions = () => {
    const newWidth = currentSize.height;
    const newHeight = currentSize.width;
    onSizeChange(newWidth, newHeight);
    setCustomWidth(newWidth);
    setCustomHeight(newHeight);
  };

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${P.border}`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: P.text, marginBottom: 12 }}>
        Canvas Size
      </div>
      
      {/* Preset sizes */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: P.muted, marginBottom: 6 }}>Presets:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PRESET_SIZES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetClick(preset)}
              style={{
                padding: '6px 10px',
                border: `1px solid ${P.border}`,
                borderRadius: 6,
                background: currentSize.width === preset.width && currentSize.height === preset.height ? P.accent : '#fff',
                color: currentSize.width === preset.width && currentSize.height === preset.height ? '#fff' : P.text,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom size */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: P.muted, marginBottom: 6 }}>Custom size:</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            value={customWidth}
            onChange={(e) => {
              setCustomWidth(Number(e.target.value));
              setIsCustom(true);
            }}
            placeholder="Width"
            style={{
              width: 80,
              padding: '6px 8px',
              border: `1px solid ${P.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: 'none',
            }}
          />
          <span style={{ color: P.muted }}>×</span>
          <input
            type="number"
            value={customHeight}
            onChange={(e) => {
              setCustomHeight(Number(e.target.value));
              setIsCustom(true);
            }}
            placeholder="Height"
            style={{
              width: 80,
              padding: '6px 8px',
              border: `1px solid ${P.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: 'none',
            }}
          />
          <button
            onClick={handleCustomSizeApply}
            disabled={!isCustom}
            style={{
              padding: '6px 12px',
              background: isCustom ? P.accent : P.border,
              color: isCustom ? '#fff' : P.muted,
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              cursor: isCustom ? 'pointer' : 'default',
            }}
          >
            Apply
          </button>
          <button
            onClick={swapDimensions}
            style={{
              padding: '6px 8px',
              background: P.light,
              border: `1px solid ${P.border}`,
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ⇄
          </button>
        </div>
      </div>

      {/* Current size display */}
      <div style={{ fontSize: 11, color: P.muted }}>
        Current: {currentSize.width} × {currentSize.height}px
      </div>
    </div>
  );
}

export default function CanvasPage() {
  const [canvasSize, setCanvasSize] = useState({ width: A4_WIDTH, height: A4_HEIGHT });
  const [items, setItems] = useState([
    { id: 1, x: 100, y: 100, width: 200, height: 150, content: "Drag me around!" },
    { id: 2, x: 350, y: 200, width: 180, height: 120, content: "Resize me!" },
  ]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const canvasRef = useRef();

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setSelectedItem(null);
    }
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      x: Math.random() * (canvasSize.width - 200),
      y: Math.random() * (canvasSize.height - 150),
      width: 200,
      height: 150,
      content: `Item ${items.length + 1}`,
    };
    setItems([...items, newItem]);
    setIsAddingItem(false);
  };

  const handleItemDrag = (id, x, y) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, x, y } : item
    ));
  };

  const handleItemResize = (id, width, height) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, width, height } : item
    ));
  };

  const handleItemDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
    if (selectedItem === id) {
      setSelectedItem(null);
    }
  };

  const handleItemSelect = (id) => {
    setSelectedItem(id);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: P.light, 
      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
      padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>

      <div style={{ fontSize: 24, fontWeight: 800, color: P.text, marginBottom: 20 }}>
        Canvas Workspace
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Sidebar with controls */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <CanvasSizeControls
            currentSize={canvasSize}
            onSizeChange={(width, height) => setCanvasSize({ width, height })}
          />

          {/* Item controls */}
          <div style={{
            background: '#fff',
            border: `1px solid ${P.border}`,
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: P.text, marginBottom: 12 }}>
              Items
            </div>
            
            <button
              onClick={() => setIsAddingItem(true)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: P.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 12,
              }}
            >
              + Add Item
            </button>

            {isAddingItem && (
              <div style={{
                padding: 12,
                background: P.light,
                borderRadius: 8,
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 12, color: P.text, marginBottom: 8 }}>
                  Click on the canvas to place the item
                </div>
                <button
                  onClick={() => setIsAddingItem(false)}
                  style={{
                    padding: '4px 8px',
                    background: '#fff',
                    border: `1px solid ${P.border}`,
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div style={{ fontSize: 11, color: P.muted }}>
              Total items: {items.length}
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              background: '#fff',
              border: `2px solid ${P.border}`,
              borderRadius: 8,
              position: 'relative',
              margin: '0 auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              cursor: isAddingItem ? 'crosshair' : 'default',
            }}
            onMouseDown={(e) => {
              if (isAddingItem && e.target === canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left - 100; // Center the item
                const y = e.clientY - rect.top - 75;
                const newItem = {
                  id: Date.now(),
                  x: Math.max(0, Math.min(x, canvasSize.width - 200)),
                  y: Math.max(0, Math.min(y, canvasSize.height - 150)),
                  width: 200,
                  height: 150,
                  content: `Item ${items.length + 1}`,
                };
                setItems([...items, newItem]);
                setIsAddingItem(false);
              }
            }}
          >
            {items.map((item) => (
              <DraggableItem
                key={item.id}
                {...item}
                isSelected={selectedItem === item.id}
                onDrag={handleItemDrag}
                onResize={handleItemResize}
                onDelete={handleItemDelete}
                onSelect={handleItemSelect}
              />
            ))}
          </div>

          {/* Canvas info */}
          <div style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 12,
            color: P.muted,
          }}>
            Canvas: {canvasSize.width} × {canvasSize.height}px | 
            {canvasSize.width > canvasSize.height ? ' Landscape' : 
             canvasSize.width < canvasSize.height ? ' Portrait' : ' Square'}
          </div>
        </div>
      </div>
    </div>
  );
}
