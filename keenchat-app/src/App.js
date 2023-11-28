import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Conversation from "./components/Conversation";
import AudioComponent from "./components/AudioComponent";

// 6 routes for 6 different conversation types
// 1. voice-voice: voice bot message, voice bot backchannel
// 2. voice-text: voice bot message, text bot backchannel
// 3. voice-none: voice bot message, no backchannel
// 4. text-voice: text bot message, voice bot backchannel
// 5. text-text: text bot message, text bot backchannel
// 6. text-none: text bot message, no backchannel

function App() {
  return (
    <div>
      <Router basename="/KeenChat">
        <Routes>
          <Route path="/" element={<Conversation />} />
          <Route
            path="/voice-voice"
            element={<Conversation type="voice-voice" />}
          />
          <Route
            path="/voice-text"
            element={<Conversation type="voice-text" />}
          />
          <Route
            path="/voice-none"
            element={<Conversation type="voice-none" />}
          />
          <Route
            path="/text-voice"
            element={<Conversation type="text-voice" />}
          />
          <Route
            path="/text-text"
            element={<Conversation type="text-text" />}
          />
          <Route
            path="/text-none"
            element={<Conversation type="text-none" />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
