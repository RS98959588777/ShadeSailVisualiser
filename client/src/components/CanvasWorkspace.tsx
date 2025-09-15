import { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, Polygon, Point, Path } from 'fabric';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PerspectiveTransform } from './PerspectiveTransform';

interface CanvasWorkspaceProps {
  imageFile?: File;
  selectedColor?: string;
  selectedShape?: string;
  onCanvasReady?: (canvas: Canvas) => void;
  onSailReady?: (perspectiveTransform: PerspectiveTransform | null) => void;
}

export default function CanvasWorkspace({ imageFile, selectedColor = '#2D4A40', selectedShape = 'triangle', onCanvasReady, onSailReady }: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const perspectiveTransformRef = useRef<PerspectiveTransform | null>(null);
  const [zoom, setZoom] = useState(1);
  const [hasSail, setHasSail] = useState(false);

  // Update existing sail color when selectedColor changes
  useEffect(() => {
    if (fabricCanvasRef.current && hasSail) {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      if (activeObject && (activeObject.type === 'polygon' || activeObject.type === 'path' || (activeObject as any).isSail)) {
        activeObject.set('fill', selectedColor);
        activeObject.set('stroke', selectedColor);
        activeObject.set('cornerStrokeColor', selectedColor);
        fabricCanvasRef.current.renderAll();
      }
    }
  }, [selectedColor, hasSail]);

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
          img.set({
            left: (canvas.width! - img.getScaledWidth()) / 2,
            top: (canvas.height! - img.getScaledHeight()) / 2,
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

  const getShapePoints = (shape: string) => {
    switch (shape) {
      case 'triangle':
        return [
          new Point(100, 100),
          new Point(300, 80),
          new Point(200, 250)
        ];
      case 'square':
        return [
          new Point(150, 120),
          new Point(270, 120),
          new Point(270, 240),
          new Point(150, 240)
        ];
      case 'rectangle':
        return [
          new Point(120, 140),
          new Point(320, 140),
          new Point(320, 220),
          new Point(120, 220)
        ];
      default:
        return [
          new Point(100, 100),
          new Point(300, 80),
          new Point(200, 250)
        ];
    }
  };

  // Utility function to create curved sail path with 8% inward curve at edge midpoints
  const polygonToCurvedPath = (points: Point[], sagRatio: number = 0.08): string => {
    if (points.length < 3) return '';

    // Calculate polygon centroid for inward direction
    const centroid = points.reduce(
      (sum, p) => ({ x: sum.x + p.x, y: sum.y + p.y }), 
      { x: 0, y: 0 }
    );
    centroid.x /= points.length;
    centroid.y /= points.length;

    const pathCommands: (string | number)[] = [];
    
    // Start with move command to first point
    pathCommands.push('M', points[0].x, points[0].y);

    // Create curved edges using quadratic bezier curves
    for (let i = 0; i < points.length; i++) {
      const currentPoint = points[i];
      const nextPoint = points[(i + 1) % points.length];
      
      // Calculate edge vector and properties
      const edgeVector = { x: nextPoint.x - currentPoint.x, y: nextPoint.y - currentPoint.y };
      const edgeLength = Math.sqrt(edgeVector.x * edgeVector.x + edgeVector.y * edgeVector.y);
      
      // Skip if edge is too short
      if (edgeLength < 1) continue;
      
      // Calculate edge midpoint
      const midpoint = {
        x: (currentPoint.x + nextPoint.x) / 2,
        y: (currentPoint.y + nextPoint.y) / 2
      };
      
      // Calculate unit tangent vector
      const unitTangent = { x: edgeVector.x / edgeLength, y: edgeVector.y / edgeLength };
      
      // Calculate normal vectors (perpendicular to edge)
      const normal1 = { x: -unitTangent.y, y: unitTangent.x };  // 90° counterclockwise
      const normal2 = { x: unitTangent.y, y: -unitTangent.x };  // 90° clockwise
      
      // Choose inward normal (the one that points toward centroid)
      const towardCentroid1 = {
        x: (midpoint.x + normal1.x) - centroid.x,
        y: (midpoint.y + normal1.y) - centroid.y
      };
      const towardCentroid2 = {
        x: (midpoint.x + normal2.x) - centroid.x,
        y: (midpoint.y + normal2.y) - centroid.y
      };
      
      const dist1 = towardCentroid1.x * towardCentroid1.x + towardCentroid1.y * towardCentroid1.y;
      const dist2 = towardCentroid2.x * towardCentroid2.x + towardCentroid2.y * towardCentroid2.y;
      
      const inwardNormal = dist1 < dist2 ? normal1 : normal2;
      
      // Calculate curve depth (8% of edge length inward)
      const curveDepth = edgeLength * sagRatio;
      
      // Calculate control point for quadratic bezier
      // For quadratic bezier from A to B with control P, midpoint deviation = 0.5*(P - midpoint)
      // So P = midpoint + 2 * desired_deviation
      const controlPoint = {
        x: midpoint.x + 2 * curveDepth * inwardNormal.x,
        y: midpoint.y + 2 * curveDepth * inwardNormal.y
      };
      
      // Add quadratic curve command
      pathCommands.push('Q', controlPoint.x, controlPoint.y, nextPoint.x, nextPoint.y);
    }
    
    // Close the path
    pathCommands.push('Z');
    
    return pathCommands.join(' ');
  };

  const addShadeSail = () => {
    if (!fabricCanvasRef.current) return;

    // Remove existing sail if present
    const existingSails = fabricCanvasRef.current.getObjects().filter(obj => 
      obj.type === 'polygon' || obj.type === 'path' || (obj as any).isSail
    );
    existingSails.forEach(sail => fabricCanvasRef.current!.remove(sail));

    // Create shade sail with selected shape and curved edges
    const points = getShapePoints(selectedShape);
    const pathData = polygonToCurvedPath(points, 0.08); // 8% curve depth

    const sail = new Path(pathData, {
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

    // Mark as sail for identification
    (sail as any).isSail = true;

    fabricCanvasRef.current.add(sail);
    fabricCanvasRef.current.setActiveObject(sail);
    fabricCanvasRef.current.renderAll();
    setHasSail(true);

    // Create perspective transform for the new sail
    perspectiveTransformRef.current = new PerspectiveTransform(fabricCanvasRef.current, sail);
    onSailReady?.(perspectiveTransformRef.current);
  };

  const handleZoomIn = () => {
    if (!fabricCanvasRef.current) return;
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    const center = fabricCanvasRef.current.getCenter();
    fabricCanvasRef.current.zoomToPoint(new Point(center.left, center.top), newZoom);
    fabricCanvasRef.current.renderAll();
  };

  const handleZoomOut = () => {
    if (!fabricCanvasRef.current) return;
    const newZoom = Math.max(zoom / 1.2, 0.5);
    setZoom(newZoom);
    const center = fabricCanvasRef.current.getCenter();
    fabricCanvasRef.current.zoomToPoint(new Point(center.left, center.top), newZoom);
    fabricCanvasRef.current.renderAll();
  };

  const resetCanvas = () => {
    if (!fabricCanvasRef.current) return;
    
    // Clean up perspective transform
    if (perspectiveTransformRef.current) {
      perspectiveTransformRef.current.removeAnchorControls();
      perspectiveTransformRef.current = null;
      onSailReady?.(null);
    }
    
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
          img.set({ 
            left: (fabricCanvasRef.current!.width! - img.getScaledWidth()) / 2,
            top: (fabricCanvasRef.current!.height! - img.getScaledHeight()) / 2,
            selectable: false, 
            evented: false 
          });
          
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