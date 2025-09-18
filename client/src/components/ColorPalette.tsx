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
  { name: 'Cinnamon', value: '#D2691E', description: 'UVR Block: 94.4%' },
  { name: 'Desert Sand', value: '#EDC9AF', description: 'UVR Block: 97%' },
  { name: 'Silver Grey', value: '#C0C0C0', description: 'UVR Block: 97%' },
  { name: 'Charcoal', value: '#36454F', description: 'UVR Block: 96%' },
  { name: 'Black', value: '#000000', description: 'UVR Block: 99%' },
  { name: 'Ice White', value: '#F8F8FF', description: 'UVR Block: 83.3%' },
  { name: 'Navy Blue', value: '#000080', description: 'UVR Block: 93%' },
  { name: 'Laguna Blue', value: '#4682B4', description: 'UVR Block: 93%' },
  { name: 'Royal Blue', value: '#4169E1', description: 'UVR Block: 95%' },
  { name: 'Turquoise', value: '#40E0D0', description: 'UVR Block: 92%' },
  { name: 'Rainforest Green', value: '#228B22', description: 'UVR Block: 98%' },
  { name: 'Eucalyptus', value: '#7DD3C0', description: 'UVR Block: 93.8%' },
  { name: 'Olive', value: '#808000', description: 'UVR Block: 95.1%' },
  { name: 'Gumleaf', value: '#6B8E23', description: 'UVR Block: 98%' },
  { name: 'Red Earth', value: '#CC5500', description: 'UVR Block: 96.7%' },
  { name: 'Terracotta', value: '#E2725B', description: 'UVR Block: 87%' },
  { name: 'Rust Gold', value: '#B7410E', description: 'UVR Block: 88%' },
  { name: 'Chocolate', value: '#7B3F00', description: 'UVR Block: 95%' },
  { name: 'Mulberry', value: '#C54B8C', description: 'UVR Block: 94%' },
  { name: 'Sunflower Yellow', value: '#FFDA03', description: 'UVR Block: 94.7%' },
  { name: 'Zesty Lime', value: '#32CD32', description: 'UVR Block: 91.7%' },
  { name: 'Electric Purple', value: '#8A2BE2', description: 'UVR Block: 90.5%' },
  { name: 'Atomic Orange', value: '#FF6600', description: 'UVR Block: 92.7%' },
  { name: 'Sunset Red', value: '#FF4500', description: 'UVR Block: 93%' },
];

export default function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-foreground mb-2">Z16 Shade Sail Colors</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose from Rainbow Shade's complete Z16 designer color range
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
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
          Z16 UV-resistant fabric with up to 99% UV protection
        </p>
      </div>
    </div>
  );
}