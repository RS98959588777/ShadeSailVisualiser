import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PenTool } from "lucide-react";

interface ShapeSelectorProps {
  selectedShape: string;
  onShapeSelect: (shape: string) => void;
  onDrawModeToggle?: (enabled: boolean) => void;
  isDrawMode?: boolean;
}

const SAIL_SHAPES = [
  { id: 'triangle', name: 'Triangle', description: 'Classic triangular sail' },
  { id: 'square', name: 'Square', description: 'Square shade sail' },
  { id: 'rectangle', name: 'Rectangle', description: 'Rectangular sail' },
];

export default function ShapeSelector({ 
  selectedShape, 
  onShapeSelect, 
  onDrawModeToggle,
  isDrawMode = false 
}: ShapeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-foreground mb-2">Sail Shape</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Choose the shape that best fits your space
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

        <Separator className="my-3" />

        {/* Preset Shapes */}
        {SAIL_SHAPES.map((shape) => {
          const isSelected = selectedShape === shape.id && !isDrawMode;
          
          return (
            <Button
              key={shape.id}
              variant={isSelected ? "default" : "outline"}
              className="w-full h-auto p-3 flex flex-col gap-1 hover-elevate"
              onClick={() => {
                onShapeSelect(shape.id);
                if (isDrawMode) {
                  onDrawModeToggle?.(false);
                }
              }}
              data-testid={`shape-${shape.id}`}
              disabled={isDrawMode}
            >
              <div className="font-medium text-sm">{shape.name}</div>
              <div className="text-xs opacity-75">{shape.description}</div>
            </Button>
          );
        })}
      </div>

      <Separator />

      <div className="p-3 bg-muted/50 rounded-md">
        <h5 className="font-medium text-sm text-foreground mb-2">Installation Tips</h5>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Triangular sails offer maximum coverage</li>
          <li>• Square sails are easier to install</li>
          <li>• Rectangle sails work well over patios</li>
        </ul>
      </div>
    </div>
  );
}