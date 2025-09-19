import { useState } from 'react';
import React from 'react';
import { Settings, Palette, RotateCw, Shapes, Pilcrow } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import ColorPalette from './ColorPalette';
import ShapeSelector from './ShapeSelector';
import PostControls from './PostControls';
import { PostManager } from './ShadeSailPost';

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

interface ControlPanelProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  rotation: number;
  onRotationChange: (rotation: number) => void;
  selectedShape: string;
  onShapeSelect: (shape: string) => void;
  postManager?: PostManager | null;
  selectedPostId?: string | null;
  onPostSelect?: (id: string | null) => void;
  isDrawMode?: boolean;
  onDrawModeToggle?: (enabled: boolean) => void;
  sailEdgeFunctions?: {
    getCurrentSailEdges: () => any;
    modifyExistingSailEdges: (newCurvedEdges: boolean[]) => any;
  } | null;
  hasSail?: boolean;
  isVisible?: boolean;
}

export default function ControlPanel({
  selectedColor,
  onColorSelect,
  opacity,
  onOpacityChange,
  rotation,
  onRotationChange,
  selectedShape,
  onShapeSelect,
  postManager,
  selectedPostId,
  onPostSelect,
  isDrawMode = false,
  onDrawModeToggle,
  sailEdgeFunctions,
  hasSail = false,
  isVisible = true
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState('posts');
  // Use lifted post selection state or fallback to local state
  const [localSelectedPostId, setLocalSelectedPostId] = useState<string | null>(null);
  const currentSelectedPostId = selectedPostId !== undefined ? selectedPostId : localSelectedPostId;
  const currentOnPostSelect = onPostSelect || setLocalSelectedPostId;

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="w-80 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Shade Sail Controls
        </h2>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="posts" className="text-xs" data-testid="tab-posts">
              <Pilcrow className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="shape" className="text-xs" data-testid="tab-shape">
              <Shapes className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="color" className="text-xs" data-testid="tab-color">
              <Palette className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            <PostControls
              postManager={postManager || null}
              selectedPostId={currentSelectedPostId}
              onPostSelect={currentOnPostSelect}
            />
          </TabsContent>

          <TabsContent value="shape" className="space-y-4">
            <ShapeSelector
              selectedShape={selectedShape}
              onShapeSelect={onShapeSelect}
              isDrawMode={isDrawMode}
              onDrawModeToggle={onDrawModeToggle}
            />
          </TabsContent>

          <TabsContent value="color" className="space-y-4">
            <ColorPalette
              selectedColor={selectedColor}
              onColorSelect={onColorSelect}
            />
            {hasSail && (
              <div className="mt-6">
                <SailEdgeControls sailEdgeFunctions={sailEdgeFunctions} />
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </Card>
  );
}