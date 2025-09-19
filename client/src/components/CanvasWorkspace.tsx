import { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, Polygon, Point, Path, PencilBrush } from 'fabric';
import * as fabric from 'fabric';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Brush } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface CanvasWorkspaceProps {
  imageFile?: File;
  selectedColor?: string;
  selectedShape?: string;
  isDrawMode?: boolean;
  hasSail?: boolean;
  onCanvasReady?: (canvas: Canvas) => void;
  onDrawModeExit?: () => void;
  onSailEdgeModified?: (getCurrentSailEdges: () => any, modifyExistingSailEdges: (newCurvedEdges: boolean[]) => any, getSailCount: () => number) => void;
}

export default function CanvasWorkspace({ 
  imageFile, 
  selectedColor = '#2D4A40', 
  selectedShape = 'triangle', 
  isDrawMode = false,
  hasSail = false,
  onCanvasReady, 
  onDrawModeExit,
  onSailEdgeModified
}: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<Point[]>([]);
  const previewLineRef = useRef<fabric.Line | null>(null);
  const drawnPointsRef = useRef<Point[]>([]);
  const [showSmoothingSlider, setShowSmoothingSlider] = useState(false);
  const [smoothingTolerance, setSmoothingTolerance] = useState(5);
  const [showEdgeSelection, setShowEdgeSelection] = useState(false);
  const [curvedEdges, setCurvedEdges] = useState<boolean[]>([]);
  const [finalDrawnPoints, setFinalDrawnPoints] = useState<Point[]>([]);
  const [sailCount, setSailCount] = useState(0); // Track actual sail count
  const [selectedSailId, setSelectedSailId] = useState<string | null>(null); // Track selected sail

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

    // Track sail count for UI updates
    const updateSailCount = () => {
      const sails = canvas.getObjects().filter(obj => (obj as any).isSail);
      setSailCount(sails.length);
    };

    // Track sail selection changes
    const handleSelectionChange = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && (activeObject as any).isSail) {
        setSelectedSailId((activeObject as any).sailId || Date.now().toString());
      } else {
        setSelectedSailId(null);
      }
    };

    // Set up event listeners
    canvas.on('object:added', updateSailCount);
    canvas.on('object:removed', updateSailCount);
    canvas.on('selection:created', handleSelectionChange);
    canvas.on('selection:updated', handleSelectionChange);
    canvas.on('selection:cleared', handleSelectionChange);
    
    // Initial count
    updateSailCount();

    // Pass edge modification functions to parent initially
    onSailEdgeModified?.(getCurrentSailEdges, modifyExistingSailEdges, getSailCount);

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
      canvas.off('object:added', updateSailCount);
      canvas.off('object:removed', updateSailCount);
      canvas.off('selection:created', handleSelectionChange);
      canvas.off('selection:updated', handleSelectionChange);
      canvas.off('selection:cleared', handleSelectionChange);
      canvas.dispose();
    };
  }, [imageFile, onCanvasReady]);

  // Re-emit edge modification functions when dependencies change to avoid stale closures
  useEffect(() => {
    if (fabricCanvasRef.current && onSailEdgeModified) {
      onSailEdgeModified(getCurrentSailEdges, modifyExistingSailEdges, getSailCount);
    }
  }, [selectedColor, sailCount, selectedSailId]); // Re-emit when color, sail count, or selection changes

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
        
        // Check if we're close to the first point (auto-complete the shape)
        if (drawnPointsRef.current.length >= 3) {
          const firstPoint = drawnPointsRef.current[0];
          const distanceToFirst = Math.sqrt(
            Math.pow(point.x - firstPoint.x, 2) + Math.pow(point.y - firstPoint.y, 2)
          );
          
          // If clicked close to first point (within 15 pixels), create sail directly
          if (distanceToFirst <= 15) {
            // Create sail directly with default smoothing, bypassing edge selection
            createSailFromDrawnPath(drawnPointsRef.current, 5);
            return;
          }
        }
        
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
        
        // Check if we're hovering near the first point (for auto-completion visual feedback)
        let isNearFirstPoint = false;
        let previewEndPoint = { x: pointer.x, y: pointer.y };
        
        if (drawnPointsRef.current.length >= 3) {
          const firstPoint = drawnPointsRef.current[0];
          const distanceToFirst = Math.sqrt(
            Math.pow(pointer.x - firstPoint.x, 2) + Math.pow(pointer.y - firstPoint.y, 2)
          );
          
          if (distanceToFirst <= 15) {
            isNearFirstPoint = true;
            previewEndPoint = { x: firstPoint.x, y: firstPoint.y };
          }
        }
        
        // Update or create preview line
        if (previewLineRef.current) {
          // Update existing preview line coordinates
          previewLineRef.current.set({
            x1: lastPoint.x,
            y1: lastPoint.y,
            x2: previewEndPoint.x,
            y2: previewEndPoint.y,
            stroke: isNearFirstPoint ? '#00ff00' : selectedColor,  // Green when near first point
            strokeWidth: isNearFirstPoint ? 3 : 2,  // Thicker line when near first point
            opacity: isNearFirstPoint ? 1 : 0.7
          });
          canvas.renderAll();
        } else {
          // Create new preview line
          const newPreviewLine = new fabric.Line([
            lastPoint.x, lastPoint.y, previewEndPoint.x, previewEndPoint.y
          ], {
            stroke: isNearFirstPoint ? '#00ff00' : selectedColor,
            strokeWidth: isNearFirstPoint ? 3 : 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            isTemporary: true,
            opacity: isNearFirstPoint ? 1 : 0.7
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
    
    // Disable canvas interactions during edge selection
    if (showEdgeSelection) {
      canvas.selection = false; // Disable object selection during edge selection
    }
  }, [isDrawMode, selectedColor, showEdgeSelection]);

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

  // Utility function to create mixed straight/curved sail path
  const polygonToMixedPath = (points: Point[], curvedEdges: boolean[], sagRatio: number = 0.05): string => {
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

    // Create edges (either straight or curved based on selection)
    for (let i = 0; i < points.length; i++) {
      const currentPoint = points[i];
      const nextPoint = points[(i + 1) % points.length];
      const shouldCurve = curvedEdges[i] || false;
      
      // Calculate edge vector and properties
      const edgeVector = { x: nextPoint.x - currentPoint.x, y: nextPoint.y - currentPoint.y };
      const edgeLength = Math.sqrt(edgeVector.x * edgeVector.x + edgeVector.y * edgeVector.y);
      
      // Skip if edge is too short
      if (edgeLength < 1) continue;
      
      if (shouldCurve) {
        // Create curved edge using quadratic bezier
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
        
        // Calculate curve depth
        const curveDepth = edgeLength * sagRatio;
        
        // Calculate control point for quadratic bezier
        const controlPoint = {
          x: midpoint.x + 2 * curveDepth * inwardNormal.x,
          y: midpoint.y + 2 * curveDepth * inwardNormal.y
        };
        
        // Add quadratic curve command
        pathCommands.push('Q', controlPoint.x, controlPoint.y, nextPoint.x, nextPoint.y);
      } else {
        // Create straight edge
        pathCommands.push('L', nextPoint.x, nextPoint.y);
      }
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
    if (area < 500) { // Lowered threshold from 1000 to 500
      console.warn('Shape too small to create a sail, area:', area);
      return;
    }
    
    // Check sail limit (max 10 sails)
    const existingSails = fabricCanvasRef.current.getObjects().filter(obj => (obj as any).isSail);
    if (existingSails.length >= 10) {
      console.warn('Maximum of 10 sails allowed');
      return;
    }
    
    // Create curved path using consistent sag ratio
    const pathData = polygonToCurvedPath(simplifiedPoints, 0.05);
    
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
    
    // Mark as sail for identification and store configuration
    (sail as any).isSail = true;
    (sail as any).sailId = 'sail_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    (sail as any).sailPoints = simplifiedPoints;
    // For closed polygons, number of edges = number of unique vertices
    const numEdges = simplifiedPoints.length - 1; // Subtract 1 for duplicate closing point
    (sail as any).curvedEdges = new Array(numEdges).fill(true); // All curved
    (sail as any).sailType = 'drawn';
    
    fabricCanvasRef.current.add(sail);
    fabricCanvasRef.current.setActiveObject(sail);
    fabricCanvasRef.current.renderAll();
    
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
  
  // Create sail from drawn path with mixed edges
  const createSailWithMixedEdges = (points: Point[], curvedEdges: boolean[]) => {
    if (!fabricCanvasRef.current || !points || points.length < 3) return;

    // Points are already simplified - use them as-is to preserve edge mapping
    const finalPoints = points;
    
    // Calculate area to validate the shape
    const area = calculatePolygonArea(finalPoints);
    if (area < 500) { // Lowered threshold from 1000 to 500
      console.warn('Shape too small to create a sail, area:', area);
      return;
    }
    
    // Check sail limit (max 10 sails)
    const existingSails = fabricCanvasRef.current.getObjects().filter(obj => (obj as any).isSail);
    if (existingSails.length >= 10) {
      console.warn('Maximum of 10 sails allowed');
      return;
    }
    
    // Use curvedEdges array as-is since it matches the final points
    const pathData = polygonToMixedPath(finalPoints, curvedEdges, 0.05);
    
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
    
    // Mark as sail for identification and store edge configuration
    (sail as any).isSail = true;
    (sail as any).sailId = 'sail_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    (sail as any).sailPoints = finalPoints;
    // Ensure curvedEdges array matches actual number of edges
    const numEdges = finalPoints.length - 1; // For closed polygons
    const adjustedCurvedEdges = curvedEdges.slice(0, numEdges);
    (sail as any).curvedEdges = [...adjustedCurvedEdges];
    (sail as any).sailType = 'custom';
    
    fabricCanvasRef.current.add(sail);
    fabricCanvasRef.current.setActiveObject(sail);
    fabricCanvasRef.current.renderAll();
    
    // Clean up edge selection state
    setShowEdgeSelection(false);
    setFinalDrawnPoints([]);
    setCurvedEdges([]);
    setDrawnPoints([]);
    drawnPointsRef.current = [];
    onDrawModeExit?.();
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
    setShowEdgeSelection(false);
    setFinalDrawnPoints([]);
    setCurvedEdges([]);
    onDrawModeExit?.();
  };

  // Handle edge selection
  const handleCreateSailWithEdges = () => {
    if (finalDrawnPoints.length >= 3) {
      createSailWithMixedEdges(finalDrawnPoints, curvedEdges);
    }
  };

  const handleCancelEdgeSelection = () => {
    setShowEdgeSelection(false);
    setFinalDrawnPoints([]);
    setCurvedEdges([]);
    onDrawModeExit?.();
  };

  const toggleEdgeCurve = (edgeIndex: number) => {
    const newCurvedEdges = [...curvedEdges];
    newCurvedEdges[edgeIndex] = !newCurvedEdges[edgeIndex];
    setCurvedEdges(newCurvedEdges);
  };

  // Function to modify edges of an existing sail
  const modifyExistingSailEdges = (newCurvedEdges: boolean[]) => {
    if (!fabricCanvasRef.current) return null;
    
    // Find the active sail first, fallback to any sail
    const activeObject = fabricCanvasRef.current.getActiveObject();
    let currentSail = (activeObject && (activeObject as any).isSail) ? activeObject : null;
    
    if (!currentSail) {
      // Fallback: find the most recently added sail
      const sails = fabricCanvasRef.current.getObjects().filter(obj => (obj as any).isSail);
      currentSail = sails[sails.length - 1] || null;
    }
    
    if (!currentSail) return null;
    
    // Get stored sail data
    const sailPoints = (currentSail as any).sailPoints;
    const sailType = (currentSail as any).sailType;
    
    if (!sailPoints || !Array.isArray(sailPoints)) return null;
    
    // Create new path with updated edge configuration
    const pathData = polygonToMixedPath(sailPoints, newCurvedEdges, 0.05);
    
    // Store current position and transform for restoration
    const currentLeft = currentSail.left;
    const currentTop = currentSail.top;
    const currentAngle = currentSail.angle;
    const currentScaleX = currentSail.scaleX;
    const currentScaleY = currentSail.scaleY;
    
    // Remove old sail and create new one with updated path
    fabricCanvasRef.current.remove(currentSail);
    
    const newSail = new Path(pathData, {
      fill: selectedColor,
      stroke: selectedColor,
      strokeWidth: 2,
      opacity: 0.8,
      cornerStyle: 'circle',
      cornerSize: 8,
      transparentCorners: false,
      cornerColor: '#fff',
      cornerStrokeColor: selectedColor,
      left: currentLeft,
      top: currentTop,
      angle: currentAngle,
      scaleX: currentScaleX,
      scaleY: currentScaleY,
    });
    
    // Restore sail metadata
    (newSail as any).isSail = true;
    (newSail as any).sailPoints = sailPoints;
    (newSail as any).curvedEdges = [...newCurvedEdges];
    (newSail as any).sailType = sailType;
    if ((currentSail as any).shapeType) {
      (newSail as any).shapeType = (currentSail as any).shapeType;
    }
    
    fabricCanvasRef.current.add(newSail);
    fabricCanvasRef.current.setActiveObject(newSail);
    fabricCanvasRef.current.renderAll();
    return newSail;
  };

  // Get current sail edge configuration for UI
  const getCurrentSailEdges = () => {
    if (!fabricCanvasRef.current) return null;
    
    // Find the active sail first, fallback to any sail
    const activeObject = fabricCanvasRef.current.getActiveObject();
    let currentSail = (activeObject && (activeObject as any).isSail) ? activeObject : null;
    
    if (!currentSail) {
      // Fallback: find the most recently added sail
      const sails = fabricCanvasRef.current.getObjects().filter(obj => (obj as any).isSail);
      currentSail = sails[sails.length - 1] || null;
    }
    
    if (!currentSail) return null;
    
    return {
      curvedEdges: (currentSail as any).curvedEdges || [],
      sailType: (currentSail as any).sailType || 'unknown',
      shapeType: (currentSail as any).shapeType || null,
      pointCount: ((currentSail as any).sailPoints || []).length
    };
  };

  // Get total number of sails on canvas
  const getSailCount = () => {
    if (!fabricCanvasRef.current) return 0;
    const sails = fabricCanvasRef.current.getObjects().filter(obj => (obj as any).isSail);
    return sails.length;
  };

  const addShadeSail = () => {
    if (!fabricCanvasRef.current) return;

    // Check sail limit (max 10 sails)
    const existingSails = fabricCanvasRef.current.getObjects().filter(obj => (obj as any).isSail);
    if (existingSails.length >= 10) {
      console.warn('Maximum of 10 sails allowed');
      return;
    }

    // Create shade sail with selected shape and curved edges
    const points = getShapePoints(selectedShape);
    const pathData = polygonToCurvedPath(points, 0.05); // 5% curve depth

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

    // Mark as sail for identification and store shape info
    (sail as any).isSail = true;
    (sail as any).sailId = 'sail_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    (sail as any).sailPoints = points;
    // Standard shapes don't have duplicate closing points, so edges = points
    (sail as any).curvedEdges = new Array(points.length).fill(true); // All curved for standard shapes
    (sail as any).sailType = 'standard';
    (sail as any).shapeType = selectedShape;

    fabricCanvasRef.current.add(sail);
    fabricCanvasRef.current.setActiveObject(sail);
    fabricCanvasRef.current.renderAll();
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
    
    fabricCanvasRef.current.clear();
    setZoom(1);
    fabricCanvasRef.current.setZoom(1);
    
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
    <div className="flex-1 flex flex-col bg-muted/30 relative overflow-hidden">
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
              ? `Click to add points (${drawnPoints.length} points added). Click near first point to auto-complete.`
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

      {/* Edge Selection Overlay */}
      {showEdgeSelection && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border z-10">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <Brush className="w-4 h-4" />
            Customize Sail Edges
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Choose which edges should be straight or curved. Click on edge numbers to toggle between straight and curved.
          </p>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 max-w-sm">
              {finalDrawnPoints.map((_, index) => {
                const edgeNum = index + 1;
                const isCurved = curvedEdges[index];
                return (
                  <Button
                    key={index}
                    size="sm"
                    variant={isCurved ? "default" : "outline"}
                    onClick={() => toggleEdgeCurve(index)}
                    className="text-xs"
                    data-testid={`edge-toggle-${index}`}
                  >
                    Edge {edgeNum}: {isCurved ? 'Curved' : 'Straight'}
                  </Button>
                );
              })}
            </div>
            
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={handleCreateSailWithEdges}
                data-testid="button-create-custom-sail"
              >
                <Check className="w-3 h-3 mr-1" />
                Create Sail
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdgeSelection}
                data-testid="button-cancel-edge-selection"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
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
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="bg-background rounded-lg shadow-lg max-w-full max-h-full">
          <canvas
            ref={canvasRef}
            className="border border-border rounded-lg max-w-full max-h-full"
            data-testid="canvas-workspace"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
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