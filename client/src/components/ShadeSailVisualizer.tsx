import { useState, useEffect } from 'react';
import { Canvas } from 'fabric';
import Header from './Header';
import ImageUploader from './ImageUploader';
import CanvasWorkspace from './CanvasWorkspace';
import ControlPanel from './ControlPanel';

export default function ShadeSailVisualizer() {
  const [uploadedImage, setUploadedImage] = useState<File | undefined>();
  const [selectedColor, setSelectedColor] = useState('#2D4A40');
  const [opacity, setOpacity] = useState(80);
  const [rotation, setRotation] = useState(0);
  const [selectedShape, setSelectedShape] = useState('triangle');
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasSail, setHasSail] = useState(false);

  // Track if there's a sail on the canvas
  useEffect(() => {
    if (canvas) {
      const checkForSail = () => {
        const sails = canvas.getObjects().filter(obj => obj.type === 'polygon');
        setHasSail(sails.length > 0);
      };
      
      canvas.on('object:added', checkForSail);
      canvas.on('object:removed', checkForSail);
      
      return () => {
        canvas.off('object:added', checkForSail);
        canvas.off('object:removed', checkForSail);
      };
    }
  }, [canvas]);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUploadedImage(file);
    setIsUploading(false);
  };

  const handleDownload = () => {
    if (!canvas) return;
    
    try {
      // Create high-quality download link
      const link = document.createElement('a');
      link.download = `shade-sail-mockup-${new Date().toISOString().split('T')[0]}.png`;
      
      // Export at higher quality
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2 // Export at 2x resolution for better quality
      });
      
      link.href = dataURL;
      link.click();
      console.log('High-quality mockup downloaded');
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to standard quality
      const link = document.createElement('a');
      link.download = 'shade-sail-mockup.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleReset = () => {
    setUploadedImage(undefined);
    setSelectedColor('#2D4A40');
    setOpacity(80);
    setRotation(0);
    setSelectedShape('triangle');
    if (canvas) {
      canvas.clear();
    }
    console.log('Workspace reset');
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    // Update active sail color if canvas exists
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'polygon') {
        activeObject.set('fill', color);
        activeObject.set('stroke', color);
        activeObject.set('cornerStrokeColor', color);
        canvas.renderAll();
      }
    }
  };

  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    // Update active sail opacity if canvas exists
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        activeObject.set('opacity', newOpacity / 100);
        canvas.renderAll();
      }
    }
  };

  const handleRotationChange = (newRotation: number) => {
    setRotation(newRotation);
    // Update active sail rotation if canvas exists
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        activeObject.set('angle', newRotation);
        canvas.renderAll();
      }
    }
  };

  const handleShapeChange = (shape: string) => {
    setSelectedShape(shape);
    // If there's already a sail, recreate it with the new shape
    if (canvas && hasSail) {
      // Remove existing sails
      const existingSails = canvas.getObjects().filter(obj => obj.type === 'polygon');
      existingSails.forEach(sail => canvas.remove(sail));
      
      // Add new sail with selected shape - this will be handled by the canvas component
      canvas.renderAll();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        hasImage={!!uploadedImage}
        onDownload={handleDownload}
        onReset={handleReset}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {!uploadedImage ? (
            <ImageUploader
              onImageUpload={handleImageUpload}
              isUploading={isUploading}
            />
          ) : (
            <CanvasWorkspace
              imageFile={uploadedImage}
              selectedColor={selectedColor}
              selectedShape={selectedShape}
              onCanvasReady={setCanvas}
            />
          )}
        </div>

        {/* Control Panel - Only show when image is uploaded */}
        {uploadedImage && (
          <ControlPanel
            selectedColor={selectedColor}
            onColorSelect={handleColorChange}
            opacity={opacity}
            onOpacityChange={handleOpacityChange}
            rotation={rotation}
            onRotationChange={handleRotationChange}
            selectedShape={selectedShape}
            onShapeSelect={handleShapeChange}
            isVisible={!!uploadedImage}
          />
        )}
      </div>
    </div>
  );
}