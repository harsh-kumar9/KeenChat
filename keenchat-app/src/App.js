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
            element={<Conversation main="voice" backchannel="voice" />}
          />
          <Route
            path="/voice-text"
            element={<Conversation tmain="voice" backchannel="text" />}
          />
          <Route
            path="/voice-none"
            element={<Conversation tmain="voice" backchannel="none" />}
          />
          <Route
            path="/text-voice"
            element={<Conversation tmain="text" backchannel="voice" />}
          />
          <Route
            path="/text-text"
            element={<Conversation main="text" backchannel="text" />}
          />
          <Route
            path="/text-none"
            element={<Conversation main="text" backchannel="none" />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
