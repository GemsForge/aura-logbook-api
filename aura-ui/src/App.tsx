import { Box, Typography } from '@mui/material';
// import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout';

const DummyPage = () => (
  <Box p={2}>
    <h1>AuraLogbook UI</h1>
    <Typography variant="h4">This is a test page inside AppLayout</Typography>
  </Box>
);

function App() {
 
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DummyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
