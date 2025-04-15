// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import HomePage from './pages/HomePage';
// import MoodTracker from './pages/MoodTracker';
// import CounselorChat from './pages/CounselorChat';
// import ResourceHub from './pages/ResourceHub';
// import CommunityForum from './pages/CommunityForum';
// import Profile from './pages/Profile';
// import NotFound from './pages/NotFound';

import LandingPage from "./LandingPage";
import ReportingPortal from "./ReportingPortal";
// export default function App() {
//   return (
//     <Router>
//       <div className="min-h-screen">
//         <Routes>
//           <Route path="/" element={<HomePage />} />
//           <Route path="/mood-tracker" element={<MoodTracker />} />
//           <Route path="/chat" element={<CounselorChat />} />
//           <Route path="/resources" element={<ResourceHub />} />
//           <Route path="/community" element={<CommunityForum />} />
//           <Route path="/profile" element={<Profile />} />
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

export default function App() {
  return (
    <>
     <LandingPage/>
    </>
  );
} 