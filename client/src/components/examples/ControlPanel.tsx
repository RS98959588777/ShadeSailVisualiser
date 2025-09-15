import { useState } from 'react';
import ControlPanel from '../ControlPanel';

export default function ControlPanelExample() {
  const [selectedColor, setSelectedColor] = useState('#2D4A40');
  const [opacity, setOpacity] = useState(80);
  const [rotation, setRotation] = useState(0);
  const [selectedShape, setSelectedShape] = useState('triangle');

  return (
    <div className="h-96">
      <ControlPanel
        selectedColor={selectedColor}
        onColorSelect={(color) => {
          setSelectedColor(color);
          console.log('Color selected:', color);
        }}
        opacity={opacity}
        onOpacityChange={(value) => {
          setOpacity(value);
          console.log('Opacity changed:', value);
        }}
        rotation={rotation}
        onRotationChange={(value) => {
          setRotation(value);
          console.log('Rotation changed:', value);
        }}
        selectedShape={selectedShape}
        onShapeSelect={(shape) => {
          setSelectedShape(shape);
          console.log('Shape selected:', shape);
        }}
        isVisible={true}
      />
    </div>
  );
}