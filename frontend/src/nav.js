import { MessageCircle, Camera, FlaskConical, CloudSun, Landmark } from "lucide-react";

// Single source of truth for the primary nav, shared by the desktop
// Navbar and the mobile BottomNav so the two never drift apart.
export const NAV_ITEMS = [
  { to: "/chat", key: "chat", icon: MessageCircle },
  { to: "/crop-analysis", key: "cropAnalysis", icon: Camera },
  { to: "/soil-analysis", key: "soilAnalysis", icon: FlaskConical },
  { to: "/weather", key: "weather", icon: CloudSun },
  { to: "/schemes", key: "schemes", icon: Landmark },
];
