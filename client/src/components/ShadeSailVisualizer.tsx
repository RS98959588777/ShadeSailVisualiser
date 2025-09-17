import { useState, useEffect } from 'react';
import { Canvas } from 'fabric';
import Header from './Header';
import ImageUploader from './ImageUploader';
import CanvasWorkspace from './CanvasWorkspace';
import ControlPanel from './ControlPanel';
import { PerspectiveTransform } from './PerspectiveTransform';
import { PostManager } from './ShadeSailPost';

export default function ShadeSailVisualizer() {
  const [uploadedImage, setUploadedImage] = useState<File | undefined>();
  const [selectedColor, setSelectedColor] = useState('#2D4A40');
  const [opacity, setOpacity] = useState(80);
  const [rotation, setRotation] = useState(0);
  const [selectedShape, setSelectedShape] = useState('triangle');
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [perspectiveTransform, setPerspectiveTransform] = useState<PerspectiveTransform | null>(null);
  const [postManager, setPostManager] = useState<PostManager | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasSail, setHasSail] = useState(false);

  // Track if there's a sail on the canvas
  useEffect(() => {
    if (canvas) {
      const checkForSail = () => {
        const sails = canvas.getObjects().filter(obj => (obj as any).isSail);
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

  // Initialize PostManager when canvas is ready
  useEffect(() => {
    if (canvas && !postManager) {
      const manager = new PostManager(canvas);
      setPostManager(manager);
    }
  }, [canvas, postManager]);

  // Wire canvas selection to UI selection
  useEffect(() => {
    if (canvas && postManager) {
      const handleSelection = () => {
        const selectedPost = postManager.getSelectedPost();
        setSelectedPostId(selectedPost);
      };

      const handleClearSelection = () => {
        setSelectedPostId(null);
      };

      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', handleClearSelection);

      return () => {
        canvas.off('selection:created', handleSelection);
        canvas.off('selection:updated', handleSelection);
        canvas.off('selection:cleared', handleClearSelection);
      };
    }
  }, [canvas, postManager]);

  const handlePostSelect = (id: string | null) => {
    setSelectedPostId(id);
    if (id && postManager) {
      postManager.selectPost(id);
    }
  };

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
      // Manually ensure hasSail is reset since canvas.clear() might not fire events
      setHasSail(false);
    }
    console.log('Workspace reset');
  };

  const handleColorChange = (color: string) => {
    console.log('handleColorChange called with color:', color);
    setSelectedColor(color);
    // Update existing sail color if present  
    if (canvas && hasSail) {
      console.log('Updating sail colors on canvas');
      const sails = canvas.getObjects().filter(obj => (obj as any).isSail);
      console.log('Found sails:', sails.length);
      sails.forEach(sail => {
        sail.set('fill', color);
        sail.set('stroke', color);
        sail.set('cornerStrokeColor', color);
      });
      canvas.renderAll();
    } else {
      console.log('Canvas or hasSail not available:', { canvas: !!canvas, hasSail });
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
      const existingSails = canvas.getObjects().filter(obj => (obj as any).isSail);
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
      
      {/* Debug section - temporary for debugging color issues */}
      {uploadedImage && (
        <div className="bg-red-100 p-2 text-xs">
          <p>Debug: selectedColor = {selectedColor}</p>
          <button 
            onClick={() => handleColorChange('#FF0000')} 
            className="bg-red-500 text-white px-2 py-1 mr-2"
          >
            Test Red
          </button>
          <button 
            onClick={() => handleColorChange('#00FF00')} 
            className="bg-green-500 text-white px-2 py-1"
          >
            Test Green
          </button>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
              isDrawMode={isDrawMode}
              hasSail={hasSail}
              onCanvasReady={setCanvas}
              onSailReady={setPerspectiveTransform}
              onDrawModeExit={() => setIsDrawMode(false)}
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
            perspectiveTransform={perspectiveTransform}
            postManager={postManager}
            selectedPostId={selectedPostId}
            onPostSelect={handlePostSelect}
            isDrawMode={isDrawMode}
            onDrawModeToggle={setIsDrawMode}
            isVisible={!!uploadedImage}
          />
        )}
      </div>
    </div>
  );
}