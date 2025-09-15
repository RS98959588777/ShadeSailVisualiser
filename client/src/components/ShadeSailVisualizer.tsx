import { useState } from 'react';
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
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUploadedImage(file);
    setIsUploading(false);
  };

  const handleDownload = () => {
    if (!canvas) return;
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'shade-sail-mockup.png';
    link.href = canvas.toDataURL();
    link.click();
    console.log('Mockup downloaded');
  };

  const handleReset = () => {
    setUploadedImage(undefined);
    setSelectedColor('#2D4A40');
    setOpacity(80);
    setRotation(0);
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
      if (activeObject) {
        activeObject.set('fill', color);
        activeObject.set('stroke', color);
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
            isVisible={!!uploadedImage}
          />
        )}
      </div>
    </div>
  );
}