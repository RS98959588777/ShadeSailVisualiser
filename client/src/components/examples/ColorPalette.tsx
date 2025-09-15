import { useState } from 'react';
import ColorPalette from '../ColorPalette';

export default function ColorPaletteExample() {
  const [selectedColor, setSelectedColor] = useState('#2D4A40');

  return (
    <div className="max-w-sm">
      <ColorPalette 
        selectedColor={selectedColor}
        onColorSelect={(color) => {
          setSelectedColor(color);
          console.log('Color selected:', color);
        }}
      />
    </div>
  );
}