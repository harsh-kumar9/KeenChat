import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Conversation from "./components/Conversation";

// 6 routes for 6 different conversation types
// 1. voice-voice: voice bot message, voice bot backchannelType
// 2. voice-text: voice bot message, text bot backchannelType
// 3. voice-none: voice bot message, no backchannelType
// 4. text-voice: text bot message, voice bot backchannelType
// 5. text-text: text bot message, text bot backchannelType
// 6. text-none: text bot message, no backchannelType

function App() {
  return (
    <div>
      <Router basename="/KeenChat">
        <Routes>
          <Route path="/" element={<Conversation />} />
          <Route
            path="/voice-voice"
            element={<Conversation main="voice" backchannelType="voice" />}
          />
          <Route
            path="/voice-text"
            element={<Conversation main="voice" backchannelType="text" />}
          />
          <Route
            path="/voice-none"
            element={<Conversation main="voice" backchannelType="none" />}
          />
          <Route
            path="/text-voice"
            element={<Conversation main="text" backchannelType="voice" />}
          />
          <Route
            path="/text-text"
            element={<Conversation main="text" backchannelType="text" />}
          />
          <Route
            path="/text-none"
            element={<Conversation main="text" backchannelType="none" />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
