import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Monitor from './pages/Monitor';
import History from './pages/History';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <div
        className="h-screen w-screen overflow-hidden bg-[#050B14] text-white flex font-sans animate-fade-in"
        style={{ display: 'flex', flexDirection: 'row' }}
      >
        {/* Main Sidebar */}
        <div style={{ width: '280px', height: '100%', flexShrink: 0 }}>
          <Sidebar />
        </div>

        {/* Content Area */}
        <main
          className="flex-1 h-full overflow-y-auto relative bg-[#050B14] flex flex-col"
          style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div className="flex-1 p-8 relative z-10 w-full max-w-full" style={{ display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/monitor" element={<Monitor />} />
              <Route path="/history" element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
