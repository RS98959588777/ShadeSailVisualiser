import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Box, 
  RotateCw, 
  Move3D, 
  Anchor, 
  Target,
  RefreshCcw 
} from 'lucide-react';

interface PerspectiveControlsProps {
  onPresetApply: (preset: 'normal' | 'tiltLeft' | 'tiltRight' | 'stretch' | 'perspective') => void;
  onAnchorToggle: (enabled: boolean) => void;
  tiltValue: number;
  onTiltChange: (value: number) => void;
  perspectiveValue: number;
  onPerspectiveChange: (value: number) => void;
  isAnchorMode: boolean;
}

const PERSPECTIVE_PRESETS = [
  { id: 'normal', name: 'Normal', description: 'Flat, no perspective', icon: Box },
  { id: 'tiltLeft', name: 'Tilt Left', description: 'Tilted to the left', icon: RotateCw },
  { id: 'tiltRight', name: 'Tilt Right', description: 'Tilted to the right', icon: RotateCw },
  { id: 'stretch', name: 'Stretched', description: 'Wide top, narrow bottom', icon: Move3D },
  { id: 'perspective', name: 'Perspective', description: '3D perspective effect', icon: Target },
];

export default function PerspectiveControls({
  onPresetApply,
  onAnchorToggle,
  tiltValue,
  onTiltChange,
  perspectiveValue,
  onPerspectiveChange,
  isAnchorMode
}: PerspectiveControlsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('normal');

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    onPresetApply(presetId as any);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <Move3D className="w-4 h-4" />
          3D Perspective
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Make your shade sail look realistically positioned in 3D space
        </p>
      </div>

      {/* Anchor Mode Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Anchor Points</span>
          <Badge variant={isAnchorMode ? "default" : "outline"}>
            {isAnchorMode ? "Active" : "Inactive"}
          </Badge>
        </div>
        <Button
          variant={isAnchorMode ? "default" : "outline"}
          size="sm"
          onClick={() => onAnchorToggle(!isAnchorMode)}
          className="w-full"
          data-testid="button-anchor-toggle"
        >
          <Anchor className="w-4 h-4 mr-2" />
          {isAnchorMode ? 'Hide Anchor Points' : 'Show Anchor Points'}
        </Button>
        {isAnchorMode && (
          <p className="text-xs text-muted-foreground">
            Drag the anchor points to adjust sail positioning and perspective
          </p>
        )}
      </div>

      <Separator />

      {/* Quick Presets */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-foreground">Quick Presets</h5>
        <div className="grid grid-cols-1 gap-2">
          {PERSPECTIVE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.id;
            
            return (
              <Button
                key={preset.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect(preset.id)}
                className="h-auto p-3 flex items-start gap-2 hover-elevate"
                data-testid={`preset-${preset.id}`}
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs opacity-75">{preset.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Manual Controls */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-foreground">Manual Adjustment</h5>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground">Tilt</span>
            <span className="text-xs text-muted-foreground">{tiltValue}°</span>
          </div>
          <Slider
            value={[tiltValue]}
            onValueChange={(value) => onTiltChange(value[0])}
            min={-45}
            max={45}
            step={1}
            className="w-full"
            data-testid="slider-tilt"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground">Perspective Depth</span>
            <span className="text-xs text-muted-foreground">{perspectiveValue}°</span>
          </div>
          <Slider
            value={[perspectiveValue]}
            onValueChange={(value) => onPerspectiveChange(value[0])}
            min={-30}
            max={30}
            step={1}
            className="w-full"
            data-testid="slider-perspective"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onTiltChange(0);
            onPerspectiveChange(0);
            handlePresetSelect('normal');
          }}
          className="w-full"
          data-testid="button-reset-perspective"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reset to Normal
        </Button>
      </div>

      <Separator />

      {/* Tips */}
      <div className="p-3 bg-muted/50 rounded-md">
        <h6 className="font-medium text-sm text-foreground mb-2">3D Tips</h6>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Use anchor points for precise positioning</li>
          <li>• Try different presets for realistic effects</li>
          <li>• Combine tilt and perspective for depth</li>
          <li>• Stretch effect works great for patios</li>
        </ul>
      </div>
    </div>
  );
}