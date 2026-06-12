import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { SeoMetadata } from './seo/SeoMetadata';

export default function App() {
  return (
    <BrowserRouter>
      <SeoMetadata />
      <Dashboard />
    </BrowserRouter>
  );
}
