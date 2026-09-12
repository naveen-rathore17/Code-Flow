import TopBar from "./components/TopBar";
import Hero from "./components/Hero";
import MusicBar from "./components/MusicBar";
import CreditBadge from "./components/CreditBadge";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <main className="app__main">
      <TopBar />
      <Hero />
      <CreditBadge />
      <MusicBar />
      </main>
    </div>
  );
}
