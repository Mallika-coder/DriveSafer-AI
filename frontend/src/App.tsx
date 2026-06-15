import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CommandCenter from './pages/CommandCenter';
import Monitor from './pages/Monitor';
import FleetDashboard from './pages/FleetDashboard';
import Analytics from './pages/Analytics';
import AIChat from './pages/AIChat';
import Drivers from './pages/Drivers';
import History from './pages/History';
import DriverProfile from './pages/DriverProfile';
import AutocareProtocol from './pages/AutocareProtocol';
import ModelValidation from './pages/ModelValidation';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/fleet" element={<FleetDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<DriverProfile />} />
          <Route path="/autocare" element={<AutocareProtocol />} />
          <Route path="/validation" element={<ModelValidation />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
