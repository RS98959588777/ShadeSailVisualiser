import Header from '../Header';

export default function HeaderExample() {
  return (
    <Header 
      hasImage={true}
      onDownload={() => console.log('Download triggered')}
      onReset={() => console.log('Reset triggered')}
    />
  );
}