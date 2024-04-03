import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Conversation from "./components/Conversation";
import Navigation from "./components/Navigation";

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
      <Router>
        <Routes>
          <Route path="/KeenChat" element={<Navigation />} />
          <Route path="/KeenChat/apple" element={<Conversation />} />
          {/* <Route
            path="/KeenChat/voice-voice"
            element={
              <Conversation
                main="voice"
                backchannelType="voice"
                inputType="text"
              />
            }
          />
          <Route
            path="/KeenChat/voice-text"
            element={
              <Conversation
                main="voice"
                backchannelType="text"
                inputType="text"
              />
            }
          />
          <Route
            path="/KeenChat/voice-none"
            element={
              <Conversation
                main="voice"
                backchannelType="none"
                inputType="text"
              />
            }
          /> */}
          {/* <Route
            path="/KeenChat/text-voice"
            element={
              <Conversation
                main="text"
                backchannelType="voice"
                inputType="text"
              />
            }
          /> */}
          <Route
            path="/KeenChat/all-text"
            element={
              <Conversation
                main="text"
                backchannelType="text"
                inputType="text"
              />
            }
          />
          <Route
            path="/KeenChat/all-voice"
            element={
              <Conversation
                main="voice"
                backchannelType="voice"
                inputType="voice"
              />
            }
          />
          <Route
            path="/KeenChat/all-text-develop"
            element={
              <Conversation
                main="text"
                backchannelType="text"
                inputType="text"
                develop={true}
              />
            }
          />
          <Route
            path="/KeenChat/all-voice-develop"
            element={
              <Conversation
                main="voice"
                backchannelType="voice"
                inputType="voice"
                develop={true}
              />
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
