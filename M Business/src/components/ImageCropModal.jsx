import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

const ImageCropModal = ({ image, onCropComplete, onCancel, aspect: initialAspect = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(initialAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        height: '400px',
        backgroundColor: '#1e1e1e',
        borderRadius: '16px 16px 0 0',
        overflow: 'hidden'
      }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropAreaComplete}
        />
      </div>
      
      <div style={{
        width: '100%',
        maxWidth: '500px',
        padding: '24px',
        backgroundColor: '#fff',
        borderRadius: '0 0 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zoom</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed' }}>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ 
              width: '100%',
              accentColor: '#7c3aed',
              cursor: 'pointer'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aspect Ratio</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: '1:1', value: 1 },
              { label: '4:3', value: 4/3 },
              { label: '16:9', value: 16/9 },
              { label: 'Free', value: null }
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => setAspect(opt.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: aspect === opt.value ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                  background: aspect === opt.value ? '#f5f3ff' : '#fff',
                  color: aspect === opt.value ? '#7c3aed' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              color: '#64748b',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2,
              padding: '12px',
              backgroundColor: '#7c3aed',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};


export default ImageCropModal;
