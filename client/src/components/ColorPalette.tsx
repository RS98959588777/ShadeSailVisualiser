import { Check } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ColorOption {
  name: string;
  value: string;
  description: string;
}

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const SHADE_SAIL_COLORS: ColorOption[] = [
  { name: 'Charcoal', value: '#404040', description: 'Classic dark gray' },
  { name: 'Sand', value: '#C4A678', description: 'Warm beige tone' },
  { name: 'Forest Green', value: '#2D4A40', description: 'Natural green' },
  { name: 'Terracotta', value: '#B85C3E', description: 'Warm earth tone' },
  { name: 'Cream', value: '#F4F1E8', description: 'Light neutral' },
  { name: 'Navy', value: '#2C3E50', description: 'Deep blue' },
  { name: 'Rust', value: '#8B4513', description: 'Warm brown' },
  { name: 'Sage', value: '#87A96B', description: 'Soft green' },
];

export default function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-foreground mb-2">Shade Sail Colors</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose from our range of high-quality fabric colors
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SHADE_SAIL_COLORS.map((color) => {
          const isSelected = selectedColor === color.value;
          
          return (
            <Button
              key={color.value}
              variant="outline"
              className={`
                h-auto p-3 flex flex-col gap-2 hover-elevate
                ${isSelected ? 'ring-2 ring-primary' : ''}
              `}
              onClick={() => onColorSelect(color.value)}
              data-testid={`color-${color.name.toLowerCase().replace(' ', '-')}`}
            >
              <div className="flex items-center gap-2 w-full">
                <div
                  className="w-8 h-8 rounded-md border border-border flex items-center justify-center"
                  style={{ backgroundColor: color.value }}
                >
                  {isSelected && (
                    <Check className="w-4 h-4 text-white drop-shadow-sm" />
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-sm text-foreground">{color.name}</div>
                  <div className="text-xs text-muted-foreground">{color.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      <div className="mt-6 p-3 bg-muted/50 rounded-md">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-sm font-medium text-foreground">
            Selected: {SHADE_SAIL_COLORS.find(c => c.value === selectedColor)?.name || 'Custom'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          UV-resistant fabric with 95% sun protection
        </p>
      </div>
    </div>
  );
}