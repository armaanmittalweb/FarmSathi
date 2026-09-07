import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import CropAnalysis from "./pages/CropAnalysis";
import SoilAnalysis from "./pages/SoilAnalysis";
import Weather from "./pages/Weather";
import Schemes from "./pages/Schemes";
import Profile from "./pages/Profile";

function App() {
  return (
    <div className="min-h-screen bg-sand-25">
      <Navbar />
      {/* pb-16 clears the fixed mobile BottomNav; md:pb-0 because desktop has none. */}
      <main className="pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* Chat/analysis/weather work for anonymous visitors too — a
              farmer_id is only attached when logged in (see Chat.jsx). */}
          <Route path="/chat" element={<Chat />} />
          <Route path="/crop-analysis" element={<CropAnalysis />} />
          <Route path="/soil-analysis" element={<SoilAnalysis />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default App;
