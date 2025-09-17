import { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, Polygon, Point, Path, PencilBrush } from 'fabric';
import * as fabric from 'fabric';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Brush } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PerspectiveTransform } from './PerspectiveTransform';

interface CanvasWorkspaceProps {
  imageFile?: File;
  selectedColor?: string;
  selectedShape?: string;
  isDrawMode?: boolean;
  onCanvasReady?: (canvas: Canvas) => void;
  onSailReady?: (perspectiveTransform: PerspectiveTransform | null) => void;
  onDrawModeExit?: () => void;
}

export default function CanvasWorkspace({ 
  imageFile, 
  selectedColor = '#2D4A40', 
  selectedShape = 'triangle', 
  isDrawMode = false,
  onCanvasReady, 
  onSailReady,
  onDrawModeExit 
}: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const perspectiveTransformRef = useRef<PerspectiveTransform | null>(null);
  const [zoom, setZoom] = useState(1);
  const [hasSail, setHasSail] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<Point[]>([]);
  const previewLineRef = useRef<fabric.Line | null>(null);
  const drawnPointsRef = useRef<Point[]>([]);
  const [showSmoothingSlider, setShowSmoothingSlider] = useState(false);
  const [smoothingTolerance, setSmoothingTolerance] = useState(5);

  // Update existing sail color when selectedColor changes
  useEffect(() => {
    if (fabricCanvasRef.current && hasSail) {
      // Find sail by isSail flag instead of relying on active object
      const sails = fabricCanvasRef.current.getObjects().filter(obj => (obj as any).isSail);
      sails.forEach(sail => {
        sail.set('fill', selectedColor);
        sail.set('stroke', selectedColor);
        sail.set('cornerStrokeColor', selectedColor);
      });
      fabricCanvasRef.current.renderAll();
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

  // Handle drawing mode changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    if (isDrawMode) {
      setIsDrawing(true);
      setDrawnPoints([]);
      drawnPointsRef.current = [];
      previewLineRef.current = null;
      canvas.isDrawingMode = false; // Disable freehand drawing
      canvas.selection = false; // Disable object selection during drawing
      
      // Handle mouse clicks to add points
      const handleMouseDown = (e: any) => {
        const pointer = canvas.getPointer(e.e);
        if (!pointer) return;
        
        const point = new Point(pointer.x, pointer.y);
        
        // Update both state and ref
        const newPoints = [...drawnPointsRef.current, point];
        drawnPointsRef.current = newPoints;
        setDrawnPoints(newPoints);
        
        // Draw line from previous point to current point
        if (newPoints.length > 1) {
          const prevPoint = newPoints[newPoints.length - 2];
          const line = new fabric.Line([
            prevPoint.x, prevPoint.y, point.x, point.y
          ], {
            stroke: selectedColor,
            strokeWidth: 2,
            selectable: false,
            evented: false,
            isTemporary: true
          } as any);
          
          canvas.add(line);
          canvas.renderAll();
        }
        
        // Add point marker
        const circle = new fabric.Circle({
          left: point.x - 3,
          top: point.y - 3,
          radius: 3,
          fill: selectedColor,
          selectable: false,
          evented: false,
          isTemporary: true
        } as any);
        
        canvas.add(circle);
        canvas.renderAll();
      };
      
      // Handle mouse move for preview line
      const handleMouseMove = (e: any) => {
        const pointer = canvas.getPointer(e.e);
        if (!pointer || drawnPointsRef.current.length === 0) return;
        
        const lastPoint = drawnPointsRef.current[drawnPointsRef.current.length - 1];
        
        // Update or create preview line
        if (previewLineRef.current) {
          // Update existing preview line coordinates
          previewLineRef.current.set({
            x1: lastPoint.x,
            y1: lastPoint.y,
            x2: pointer.x,
            y2: pointer.y
          });
          canvas.renderAll();
        } else {
          // Create new preview line
          const newPreviewLine = new fabric.Line([
            lastPoint.x, lastPoint.y, pointer.x, pointer.y
          ], {
            stroke: selectedColor,
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            isTemporary: true,
            opacity: 0.7
          } as any);
          
          canvas.add(newPreviewLine);
          previewLineRef.current = newPreviewLine;
          canvas.renderAll();
        }
      };
      
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      
      return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
      };
    } else {
      setIsDrawing(false);
      setDrawnPoints([]);
      drawnPointsRef.current = [];
      setShowSmoothingSlider(false);
      canvas.selection = true; // Re-enable object selection
      
      // Clean up any temporary objects when exiting draw mode
      if (previewLineRef.current) {
        canvas.remove(previewLineRef.current);
        previewLineRef.current = null;
      }
      
      const tempObjects = canvas.getObjects().filter(obj => (obj as any).isTemporary);
      tempObjects.forEach(obj => canvas.remove(obj));
      canvas.renderAll();
    }
  }, [isDrawMode, selectedColor]);

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

  // Ramer-Douglas-Peucker path simplification algorithm
  const simplifyPath = (points: Point[], tolerance: number): Point[] => {
    if (points.length <= 2) return points;

    // Find the point with the maximum distance from the line segment
    let maxDistance = 0;
    let maxIndex = 0;
    
    const start = points[0];
    const end = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = perpendicularDistance(points[i], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    // If the maximum distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const leftPart = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
      const rightPart = simplifyPath(points.slice(maxIndex), tolerance);
      
      // Remove the duplicate point at the connection
      return leftPart.concat(rightPart.slice(1));
    } else {
      // If no point is far enough, return just the endpoints
      return [start, end];
    }
  };

  // Calculate perpendicular distance from point to line segment
  const perpendicularDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    
    if (dx === 0 && dy === 0) {
      // Line segment is actually a point
      const pointDx = point.x - lineStart.x;
      const pointDy = point.y - lineStart.y;
      return Math.sqrt(pointDx * pointDx + pointDy * pointDy);
    }
    
    const length = Math.sqrt(dx * dx + dy * dy);
    const t = Math.max(0, Math.min(1, 
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length)
    ));
    
    const projectionX = lineStart.x + t * dx;
    const projectionY = lineStart.y + t * dy;
    
    const distanceX = point.x - projectionX;
    const distanceY = point.y - projectionY;
    
    return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
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

  // Clean up temporary drawing objects
  const cleanupDrawingObjects = () => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const tempObjects = canvas.getObjects().filter(obj => (obj as any).isTemporary);
    tempObjects.forEach(obj => canvas.remove(obj));
    
    if (previewLineRef.current) {
      canvas.remove(previewLineRef.current);
      previewLineRef.current = null;
    }
    
    canvas.renderAll();
  };

  // Create sail from drawn path
  const createSailFromDrawnPath = (points: Point[], tolerance: number) => {
    if (!fabricCanvasRef.current || !points || points.length < 3) return;

    // Simplify the path
    let simplifiedPoints = simplifyPath(points, tolerance);
    
    // Ensure minimum 3 points and maximum 12 for stability
    if (simplifiedPoints.length < 3) {
      console.warn('Not enough points to create a sail');
      return;
    }
    
    if (simplifiedPoints.length > 12) {
      simplifiedPoints = simplifyPath(points, tolerance * 2); // Higher tolerance
    }
    
    // Close the polygon by ensuring first and last points connect
    const firstPoint = simplifiedPoints[0];
    const lastPoint = simplifiedPoints[simplifiedPoints.length - 1];
    const distanceToClose = Math.sqrt(
      Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2)
    );
    
    // If the path isn't already closed, close it
    if (distanceToClose > tolerance) {
      simplifiedPoints.push(new Point(firstPoint.x, firstPoint.y));
    }
    
    // Calculate area to validate the shape
    const area = calculatePolygonArea(simplifiedPoints);
    if (area < 1000) {
      console.warn('Shape too small to create a sail');
      return;
    }
    
    // Remove existing sails
    const existingSails = fabricCanvasRef.current.getObjects().filter(obj => (obj as any).isSail);
    existingSails.forEach(sail => fabricCanvasRef.current!.remove(sail));
    
    // Create curved path using existing utility
    const pathData = polygonToCurvedPath(simplifiedPoints, 0.08);
    
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
    
    // Clean up drawing state
    setDrawnPoints([]);
    drawnPointsRef.current = [];
    setShowSmoothingSlider(false);
    onDrawModeExit?.();
  };
  
  // Calculate polygon area (for validation)
  const calculatePolygonArea = (points: Point[]): number => {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    return Math.abs(area / 2);
  };
  
  // Handle drawing controls
  const handleFinishDrawing = () => {
    if (drawnPointsRef.current.length >= 3) {
      setShowSmoothingSlider(true);
    }
  };
  
  const handleCreateSail = () => {
    if (drawnPointsRef.current.length >= 3) {
      createSailFromDrawnPath(drawnPointsRef.current, smoothingTolerance);
    }
  };
  
  const handleCancelDrawing = () => {
    cleanupDrawingObjects();
    setDrawnPoints([]);
    drawnPointsRef.current = [];
    setShowSmoothingSlider(false);
    onDrawModeExit?.();
  };

  const addShadeSail = () => {
    if (!fabricCanvasRef.current) return;

    // Remove existing sail if present
    const existingSails = fabricCanvasRef.current.getObjects().filter(obj => (obj as any).isSail);
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

      {/* Drawing Mode Overlay */}
      {isDrawMode && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border z-10">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Brush className="w-4 h-4" />
            {isDrawing ? 'Drawing Mode Active' : 'Drawing Mode'}
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {isDrawing 
              ? `Click to add points (${drawnPoints.length} points added)`
              : 'Click points to create straight edges'
            }
          </p>
          
          {/* Drawing Controls */}
          {drawnPoints.length >= 3 && !showSmoothingSlider && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleFinishDrawing}
                data-testid="button-finish-drawing"
              >
                <Check className="w-3 h-3 mr-1" />
                Finish Shape
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelDrawing}
                data-testid="button-cancel-drawing"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          )}
          
          {/* Smoothing Slider Controls */}
          {showSmoothingSlider && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Smoothing: {smoothingTolerance}px
                </label>
                <Slider
                  value={[smoothingTolerance]}
                  onValueChange={(value) => setSmoothingTolerance(value[0])}
                  min={1}
                  max={15}
                  step={1}
                  className="w-32"
                  data-testid="slider-smoothing"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateSail}
                  data-testid="button-create-sail"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Create Sail
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelDrawing}
                  data-testid="button-cancel-drawing"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Sail Button */}
      {imageFile && !hasSail && !isDrawMode && (
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
      {imageFile && hasSail && !isDrawMode && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border text-sm text-muted-foreground max-w-xs">
          Drag corners to resize • Click and drag to move • Use controls to zoom
        </div>
      )}
    </div>
  );
}