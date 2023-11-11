import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Conversation from "./components/Conversation";
import AudioComponent from "./components/AudioComponent";

function App() {
  return (
    <div>
      <Router basename="/KeenChat">
        <Routes>
          <Route path="/" element={<Conversation />} />
          <Route path="/static" element={<Conversation type="static" />} />
          <Route path="/animated" element={<Conversation type="animated" />} />
          <Route path="/audio" element={<AudioComponent />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
