import ImageUploader from '../ImageUploader';

export default function ImageUploaderExample() {
  return (
    <ImageUploader 
      onImageUpload={(file) => console.log('Image uploaded:', file.name)}
      isUploading={false}
    />
  );
}