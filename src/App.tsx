import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import OverviewPage from './pages/OverviewPage';
import UniverDemoPage from './pages/UniverDemoPage';
import FortuneSheetDemoPage from './pages/FortuneSheetDemoPage';
import HandsontableDemoPage from './pages/HandsontableDemoPage';
import JspreadsheetDemoPage from './pages/JspreadsheetDemoPage';
import CustomSheetDemoPage from './pages/CustomSheetDemoPage';
import ComparisonPage from './pages/ComparisonPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/univer" element={<UniverDemoPage />} />
        <Route path="/fortune-sheet" element={<FortuneSheetDemoPage />} />
        <Route path="/handsontable" element={<HandsontableDemoPage />} />
        <Route path="/jspreadsheet" element={<JspreadsheetDemoPage />} />
        <Route path="/custom-sheet" element={<CustomSheetDemoPage />} />
        <Route path="/comparison" element={<ComparisonPage />} />
      </Route>
    </Routes>
  );
}
