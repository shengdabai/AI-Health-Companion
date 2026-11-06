import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HealthHomePage from './pages/HealthHomePage';
import HealthChatPage from './pages/HealthChatPage';
import HealthNutritionPage from './pages/HealthNutritionPage';
import HealthExercisePage from './pages/HealthExercisePage';
import { PricingPage } from './pages/PricingPage';
import { SettingsPage } from './pages/SettingsPage';

/**
 * AI健康顾问应用主组件
 * 配置路由和页面导航
 */
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HealthHomePage />} />
          <Route path="/chat" element={<HealthChatPage />} />
          <Route path="/nutrition" element={<HealthNutritionPage />} />
          <Route path="/exercise" element={<HealthExercisePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
