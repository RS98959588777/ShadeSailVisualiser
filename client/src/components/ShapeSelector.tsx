import { Button } from "@/components/ui/button";
import { PenTool } from "lucide-react";
import React, { useState } from 'react';

interface SailEdgeControlsProps {
  sailEdgeFunctions?: {
    getCurrentSailEdges: () => any;
    modifyExistingSailEdges: (newCurvedEdges: boolean[]) => any;
  } | null;
}

function SailEdgeControls({ sailEdgeFunctions }: SailEdgeControlsProps) {
  const [currentEdges, setCurrentEdges] = useState<boolean[]>([]);
  const [sailInfo, setSailInfo] = useState<any>(null);

  // Get current sail edge configuration when component mounts or functions change
  React.useEffect(() => {
    if (sailEdgeFunctions?.getCurrentSailEdges) {
      const info = sailEdgeFunctions.getCurrentSailEdges();
      if (info) {
        setSailInfo(info);
        setCurrentEdges([...info.curvedEdges]);
      }
    }
  }, [sailEdgeFunctions]);

  const toggleEdge = (edgeIndex: number) => {
    if (!sailEdgeFunctions?.modifyExistingSailEdges) return;
    
    const newEdges = [...currentEdges];
    newEdges[edgeIndex] = !newEdges[edgeIndex];
    setCurrentEdges(newEdges);
    
    // Apply changes to the sail
    sailEdgeFunctions.modifyExistingSailEdges(newEdges);
  };

  if (!sailInfo || currentEdges.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <p>No sail found or sail data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Modify Sail Edges</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Choose which edges should be curved or straight
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {currentEdges.map((isCurved, index) => (
          <Button
            key={index}
            size="sm"
            variant={isCurved ? "default" : "outline"}
            onClick={() => toggleEdge(index)}
            data-testid={`toggle-edge-${index}`}
            className="text-xs"
          >
            Edge {index + 1}: {isCurved ? "Curved" : "Straight"}
          </Button>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>Sail Type: {sailInfo.sailType}</p>
        {sailInfo.shapeType && <p>Shape: {sailInfo.shapeType}</p>}
        <p>Edges: {currentEdges.length}</p>
      </div>
    </div>
  );
}

interface ShapeSelectorProps {
  selectedShape: string;
  onShapeSelect: (shape: string) => void;
  onDrawModeToggle?: (enabled: boolean) => void;
  isDrawMode?: boolean;
  sailEdgeFunctions?: {
    getCurrentSailEdges: () => any;
    modifyExistingSailEdges: (newCurvedEdges: boolean[]) => any;
  } | null;
  hasSail?: boolean;
}

export default function ShapeSelector({ 
  selectedShape, 
  onShapeSelect, 
  onDrawModeToggle,
  isDrawMode = false,
  sailEdgeFunctions,
  hasSail = false
}: ShapeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-foreground mb-2">Sail Shape</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Draw a custom shape that fits your space perfectly
        </p>
      </div>

      <div className="space-y-2">
        {/* Custom Drawing Option */}
        <Button
          variant={isDrawMode ? "default" : "outline"}
          className="w-full h-auto p-3 flex flex-col gap-1 hover-elevate"
          onClick={() => onDrawModeToggle?.(!isDrawMode)}
          data-testid="shape-draw-custom"
        >
          <div className="font-medium text-sm flex items-center gap-2">
            <PenTool className="w-4 h-4" />
            Draw Custom Sail
          </div>
          <div className="text-xs opacity-75">
            {isDrawMode ? "Click to exit drawing mode" : "Draw your own unique shape"}
          </div>
        </Button>
      </div>
      
      {hasSail && (
        <div className="mt-6 pt-6 border-t border-border">
          <SailEdgeControls sailEdgeFunctions={sailEdgeFunctions} />
        </div>
      )}
    </div>
  );
}