import { useState } from 'react';
import { Settings, Palette, RotateCw, Shapes, Move3D, Pilcrow } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import ColorPalette from './ColorPalette';
import ShapeSelector from './ShapeSelector';
import PerspectiveControls from './PerspectiveControls';
import PostControls from './PostControls';
import { PerspectiveTransform } from './PerspectiveTransform';
import { PostManager } from './ShadeSailPost';

interface ControlPanelProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  rotation: number;
  onRotationChange: (rotation: number) => void;
  selectedShape: string;
  onShapeSelect: (shape: string) => void;
  perspectiveTransform?: PerspectiveTransform | null;
  postManager?: PostManager | null;
  selectedPostId?: string | null;
  onPostSelect?: (id: string | null) => void;
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
  perspectiveTransform,
  postManager,
  selectedPostId,
  onPostSelect,
  isVisible = true
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState('color');
  const [isAnchorMode, setIsAnchorMode] = useState(false);
  const [tiltValue, setTiltValue] = useState(0);
  const [perspectiveValue, setPerspectiveValue] = useState(0);
  // New axis positioning state
  const [xPosition, setXPosition] = useState(0);
  const [yPosition, setYPosition] = useState(0);
  const [zPosition, setZPosition] = useState(0);
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
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="shape" className="text-xs" data-testid="tab-shape">
              <Shapes className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="color" className="text-xs" data-testid="tab-color">
              <Palette className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-xs" data-testid="tab-posts">
              <Pilcrow className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="perspective" className="text-xs" data-testid="tab-perspective">
              <Move3D className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shape" className="space-y-4">
            <ShapeSelector
              selectedShape={selectedShape}
              onShapeSelect={onShapeSelect}
            />
          </TabsContent>

          <TabsContent value="color" className="space-y-4">
            <ColorPalette
              selectedColor={selectedColor}
              onColorSelect={onColorSelect}
            />
          </TabsContent>


          <TabsContent value="posts" className="space-y-4">
            <PostControls
              postManager={postManager || null}
              selectedPostId={currentSelectedPostId}
              onPostSelect={currentOnPostSelect}
            />
          </TabsContent>

          <TabsContent value="perspective" className="space-y-4">
            <PerspectiveControls
              onPresetApply={(preset) => {
                if (perspectiveTransform) {
                  perspectiveTransform.applyPresetPerspective(preset);
                }
              }}
              onAnchorToggle={(enabled) => {
                setIsAnchorMode(enabled);
                if (perspectiveTransform) {
                  perspectiveTransform.toggleAnchorMode(enabled);
                }
              }}
              tiltValue={tiltValue}
              onTiltChange={(value) => {
                setTiltValue(value);
                if (perspectiveTransform) {
                  perspectiveTransform.applyManualTilt(value);
                }
              }}
              perspectiveValue={perspectiveValue}
              onPerspectiveChange={(value) => {
                setPerspectiveValue(value);
                if (perspectiveTransform) {
                  perspectiveTransform.applyManualPerspective(value);
                }
              }}
              isAnchorMode={isAnchorMode}
              xPosition={xPosition}
              onXPositionChange={(value) => {
                setXPosition(value);
                if (perspectiveTransform) {
                  perspectiveTransform.moveOnXAxis(value - xPosition);
                }
              }}
              yPosition={yPosition}
              onYPositionChange={(value) => {
                setYPosition(value);
                if (perspectiveTransform) {
                  perspectiveTransform.moveOnYAxis(value - yPosition);
                }
              }}
              zPosition={zPosition}
              onZPositionChange={(value) => {
                const previousZ = zPosition;
                setZPosition(value);
                if (perspectiveTransform) {
                  // Apply absolute Z position instead of delta to avoid drift
                  perspectiveTransform.moveOnZAxis(value);
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}