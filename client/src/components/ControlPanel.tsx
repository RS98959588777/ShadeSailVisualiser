import { useState } from 'react';
import { Settings, Palette, Move, RotateCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import ColorPalette from './ColorPalette';

interface ControlPanelProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  rotation: number;
  onRotationChange: (rotation: number) => void;
  isVisible?: boolean;
}

export default function ControlPanel({
  selectedColor,
  onColorSelect,
  opacity,
  onOpacityChange,
  rotation,
  onRotationChange,
  isVisible = true
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState('color');

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
            <TabsTrigger value="color" className="text-xs" data-testid="tab-color">
              <Palette className="w-4 h-4 mr-1" />
              Color
            </TabsTrigger>
            <TabsTrigger value="position" className="text-xs" data-testid="tab-position">
              <Move className="w-4 h-4 mr-1" />
              Position
            </TabsTrigger>
            <TabsTrigger value="effects" className="text-xs" data-testid="tab-effects">
              <RotateCw className="w-4 h-4 mr-1" />
              Effects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="color" className="space-y-4">
            <ColorPalette
              selectedColor={selectedColor}
              onColorSelect={onColorSelect}
            />
          </TabsContent>

          <TabsContent value="position" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-3">Position Controls</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => console.log('Move up')}
                    data-testid="button-move-up"
                  >
                    ↑ Up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => console.log('Move down')}
                    data-testid="button-move-down"
                  >
                    ↓ Down
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => console.log('Move left')}
                    data-testid="button-move-left"
                  >
                    ← Left
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => console.log('Move right')}
                    data-testid="button-move-right"
                  >
                    → Right
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-3">Rotation</h4>
                <div className="space-y-2">
                  <Slider
                    value={[rotation]}
                    onValueChange={(value) => onRotationChange(value[0])}
                    min={0}
                    max={360}
                    step={5}
                    className="w-full"
                    data-testid="slider-rotation"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0°</span>
                    <span className="font-medium">{rotation}°</span>
                    <span>360°</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="effects" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-3">Transparency</h4>
                <div className="space-y-2">
                  <Slider
                    value={[opacity]}
                    onValueChange={(value) => onOpacityChange(value[0])}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                    data-testid="slider-opacity"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10%</span>
                    <span className="font-medium">{opacity}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-md">
                <h5 className="font-medium text-sm text-foreground mb-2">Preview Tips</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Drag corners to resize the sail</li>
                  <li>• Click and drag to move position</li>
                  <li>• Use transparency to see through</li>
                  <li>• Try different angles for best fit</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}