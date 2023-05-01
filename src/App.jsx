import "./App.css";
import { HashRouter, Route, Routes } from "react-router-dom";
import Hero from "./Hero";
import Accounts from "./Routes/Accounts";
import Details from "./Routes/Details";

function App() {
  
  return (
    <HashRouter>
      <Hero />
      <Routes>
        <Route path="/" element={<Accounts />} />
        <Route path="/details" element={<Details />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
