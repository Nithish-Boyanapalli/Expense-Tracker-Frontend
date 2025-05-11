import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import Dashboard from "./components/Dashboard";
import ResetPassword from "./components/ResetPassword";
import Transactions from "./components/Transactions";
import BudgetAndSavings from "./components/BudgetAndSavings";
import AIInsights from "./components/AIInsights";
import EnhancedSettings from "./components/Settings";


function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/budgetandsavings" element={<BudgetAndSavings/>}/>
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/insights" element={<AIInsights />} />
      <Route path="/settings" element={<EnhancedSettings/>}/>

      
    </Routes>
  );
}

export default App;
