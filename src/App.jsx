import { useState } from "react";
import Layout from "./components/Layout";
import Home from "./pages/home";
import Translate from "./pages/Translate";
import User from "./pages/User";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Mana from "./pages/Mana";
import Phrases from "./pages/Phrases";

const pages = {
  home: Home,
  translate: Translate,
  user: User,
  settings: Settings,
  about: About,
  mana: Mana,
  phrases: Phrases
};

function App() {
  const [activeItem, setActiveItem] = useState("home");
  const CurrentPage = pages[activeItem];

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Layout activeItem={activeItem} setActiveItem={setActiveItem}>
        <CurrentPage />
      </Layout>
    </div>
  );
}

export default App;
