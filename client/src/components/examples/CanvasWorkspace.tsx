import CanvasWorkspace from '../CanvasWorkspace';

export default function CanvasWorkspaceExample() {
  return (
    <div className="h-96">
      <CanvasWorkspace 
        selectedColor="#2D4A40"
        onCanvasReady={(canvas) => console.log('Canvas ready:', canvas)}
      />
    </div>
  );
}