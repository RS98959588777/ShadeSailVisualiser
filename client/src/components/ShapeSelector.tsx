import { Button } from "@/components/ui/button";
import { PenTool } from "lucide-react";

interface ShapeSelectorProps {
  selectedShape: string;
  onShapeSelect: (shape: string) => void;
  onDrawModeToggle?: (enabled: boolean) => void;
  isDrawMode?: boolean;
}

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
    </div>
  );
}