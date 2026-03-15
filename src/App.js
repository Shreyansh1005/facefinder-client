import { BrowserRouter, Routes, Route } from "react-router-dom";

import StartPage from "./pages/StartPage";
import UploadPage from "./pages/UploadPage";
import FaceTest from "./pages/FaceTest";
import RolePage from "./pages/RolePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<RolePage />} />

        <Route path="/start" element={<StartPage />} />

        <Route path="/upload" element={<UploadPage />} />

        <Route path="/scan" element={<FaceTest />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;