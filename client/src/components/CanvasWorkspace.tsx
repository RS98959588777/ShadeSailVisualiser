import { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, Polygon } from 'fabric';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CanvasWorkspaceProps {
  imageFile?: File;
  selectedColor?: string;
  onCanvasReady?: (canvas: Canvas) => void;
}

export default function CanvasWorkspace({ imageFile, selectedColor = '#2D4A40', onCanvasReady }: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [hasSail, setHasSail] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8f9fa',
    });

    fabricCanvasRef.current = canvas;
    onCanvasReady?.(canvas);

    // Load image if provided
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        FabricImage.fromURL(imgUrl).then((img: FabricImage) => {
          // Scale image to fit canvas
          const scaleX = canvas.width! / img.width!;
          const scaleY = canvas.height! / img.height!;
          const scale = Math.min(scaleX, scaleY);
          
          img.scale(scale);
          img.centerH();
          img.centerV();
          img.set({
            selectable: false,
            evented: false,
          });
          
          canvas.add(img);
          canvas.sendObjectToBack(img);
          canvas.renderAll();
        });
      };
      reader.readAsDataURL(imageFile);
    }

    return () => {
      canvas.dispose();
    };
  }, [imageFile, onCanvasReady]);

  const addShadeSail = () => {
    if (!fabricCanvasRef.current) return;

    // Create triangular shade sail
    const points = [
      { x: 100, y: 100 },
      { x: 300, y: 80 },
      { x: 200, y: 250 }
    ];

    const sail = new Polygon(points, {
      fill: selectedColor,
      stroke: selectedColor,
      strokeWidth: 2,
      opacity: 0.8,
      cornerStyle: 'circle',
      cornerSize: 8,
      transparentCorners: false,
      cornerColor: '#fff',
      cornerStrokeColor: selectedColor,
    });

    fabricCanvasRef.current.add(sail);
    fabricCanvasRef.current.setActiveObject(sail);
    fabricCanvasRef.current.renderAll();
    setHasSail(true);
  };

  const handleZoomIn = () => {
    if (!fabricCanvasRef.current) return;
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    fabricCanvasRef.current.setZoom(newZoom);
    fabricCanvasRef.current.renderAll();
  };

  const handleZoomOut = () => {
    if (!fabricCanvasRef.current) return;
    const newZoom = Math.max(zoom / 1.2, 0.5);
    setZoom(newZoom);
    fabricCanvasRef.current.setZoom(newZoom);
    fabricCanvasRef.current.renderAll();
  };

  const resetCanvas = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    setZoom(1);
    fabricCanvasRef.current.setZoom(1);
    setHasSail(false);
    
    // Reload image if available
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        FabricImage.fromURL(imgUrl).then((img: FabricImage) => {
          const scaleX = fabricCanvasRef.current!.width! / img.width!;
          const scaleY = fabricCanvasRef.current!.height! / img.height!;
          const scale = Math.min(scaleX, scaleY);
          
          img.scale(scale);
          img.centerH();
          img.centerV();
          img.set({ selectable: false, evented: false });
          
          fabricCanvasRef.current!.add(img);
          fabricCanvasRef.current!.sendObjectToBack(img);
          fabricCanvasRef.current!.renderAll();
        });
      };
      reader.readAsDataURL(imageFile);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/30 relative">
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleZoomIn}
          data-testid="button-zoom-in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleZoomOut}
          data-testid="button-zoom-out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={resetCanvas}
          data-testid="button-reset-canvas"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Add Sail Button */}
      {imageFile && !hasSail && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Button
            onClick={addShadeSail}
            data-testid="button-add-sail"
          >
            Add Shade Sail
          </Button>
        </div>
      )}

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg">
          <canvas
            ref={canvasRef}
            className="border border-border rounded-lg"
            data-testid="canvas-workspace"
          />
        </div>
      </div>

      {/* Instructions */}
      {imageFile && hasSail && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border text-sm text-muted-foreground max-w-xs">
          Drag corners to resize • Click and drag to move • Use controls to zoom
        </div>
      )}
    </div>
  );
}