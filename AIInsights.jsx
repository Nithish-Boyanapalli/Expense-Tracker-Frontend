import React, { Component } from "react";
import { FaBars, FaChartPie, FaMoneyBill, FaLightbulb, FaBell, FaList, FaCog, FaUser, FaSignOutAlt } from "react-icons/fa";
import { Line, Pie, Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend } from "chart.js";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../assets/DashBoard.css";
import "../assets/Insights.css";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend);

class AIInsights extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: JSON.parse(localStorage.getItem("user")) || {},
      monthlySavings: [],
      categoryData: {},
      prediction: null,
      suggestions: [],
      sidebarExpanded: false,
      settingsOpen: false,
      chartType: "line",
      manualToggle: false,
    };
  }

  componentDidMount() {
    if (!this.state.user.email) {
      window.location.replace("/");
      return;
    }

    this.fetchInsightsData();
  }

  fetchInsightsData = () => {
    const email = this.state.user.email;

    Promise.all([
      fetch(`http://localhost:8080/insights/monthly-summary/${email}`).then(res => res.json()),
      fetch(`http://localhost:8080/insights/category-wise-summary/${email}`).then(res => res.json()),
      fetch(`http://localhost:8080/insights/prediction/${email}`).then(res => res.json()),
      fetch(`http://localhost:8080/insights/smart-suggestions/${email}`).then(res => res.json())
    ]).then(([monthlyMap, categoryData, predictionObj, suggestions]) => {
      const monthlySavings = Object.entries(monthlyMap).map(([month, savings]) => ({
        month,
        savings
      }));

      const prediction = predictionObj.nextMonthPrediction;

      this.setState({ monthlySavings, categoryData, prediction, suggestions });
    }).catch(err => console.error("Error fetching insights:", err));
  };

  toggleSettings = () => {
    this.setState(prev => ({ settingsOpen: !prev.settingsOpen }));
  };

  handleLogout = () => {
    localStorage.clear();
    window.location.replace("/");
  };

  toggleChartType = () => {
    this.setState(prev => ({
      chartType: prev.chartType === "line" ? "bar" : "line"
    }));
  };

  exportMonthlyToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(this.state.monthlySavings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Savings");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    saveAs(fileData, "monthly_savings.xlsx");
  };

  exportCategoryToExcel = () => {
    const data = Object.entries(this.state.categoryData).map(([category, amount]) => ({
      Category: category,
      Amount: amount
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Category Breakdown");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    saveAs(fileData, "category_breakdown.xlsx");
  };

  exportToPDF = () => {
    const input = document.querySelector(".dashboard-content"); // Export the full page content
  
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("ai_insights_report.pdf");
    });
  };
  

  render() {
    const { sidebarExpanded, settingsOpen, monthlySavings, categoryData, prediction, suggestions, chartType } = this.state;

    const savingsChart = {
      labels: monthlySavings.map(item => item.month),
      datasets: [{
        label: "Net Savings",
        data: monthlySavings.map(item => item.savings),
        backgroundColor: "#4CAF50",
        borderColor: "#4CAF50",
        tension: 0.4
      }]
    };

    const categoryChart = {
      labels: Object.keys(categoryData),
      datasets: [{
        label: "Spending by Category",
        data: Object.values(categoryData),
        backgroundColor: ["#2196F3", "#FF9800", "#9C27B0", "#4CAF50", "#f44336"]
      }]
    };

    return (
      <div className="dashboard-container">
        {/* Sidebar */}
        <aside
          className={`sidebar ${this.state.sidebarExpanded ? "expanded" : ""}`}
          onMouseEnter={() => {
            if (!this.state.manualToggle) this.setState({ sidebarExpanded: true });
          }}
          onMouseLeave={() => {
            if (!this.state.manualToggle) this.setState({ sidebarExpanded: false });
          }}
        >
          <button
            className="toggle-btn"
            onClick={() =>
              this.setState((prevState) => ({
                manualToggle: !prevState.manualToggle,
                sidebarExpanded: !prevState.manualToggle ? true : false
              }))
            }
          >
            <FaBars />
          </button>
          <nav className="sidebar-links">
            <a href="/dashboard"><FaChartPie /><span>Dashboard</span></a>
            <a href="/transactions"><FaMoneyBill /><span>Transactions</span></a>
            <a href="/insights" className="active"><FaLightbulb /><span>AI Insights</span></a>
            <a href="/budgetandsavings"><FaList /><span>Budget Planner</span></a>
            <a href="/settings"><FaCog/><span>Settings</span></a>
          </nav>
          
        </aside>

        {/* Main Content */}
        <div className="dashboard-content">
          <header className="dashboard-header">
            <h1>AI & Insights</h1>
            <div className="user-section">
              <span>Welcome, {this.state.user.fullname || "User"}</span>
              <button className="logout-btn" onClick={this.handleLogout}>Logout</button>
            </div>
          </header>

          <div className="insight-grid">
            <section className="insight-section grid-item">
              <div className="section-header">
                <h2>📈 Monthly Savings Trend</h2>
                <div className="section-actions">
                  <button onClick={this.toggleChartType}>Toggle Chart</button>
                  <button onClick={this.exportMonthlyToExcel}>Export</button>
                  <button onClick={this.exportToPDF}>📄 Export PDF</button>
                </div>
              </div>
              <div className="chart-wrapper">
                {chartType === "line" ? (
                  <Line data={savingsChart} />
                ) : (
                  <Bar data={savingsChart} />
                )}
              </div>
            </section>

            <section className="insight-section grid-item">
              <div className="section-header">
                <h2>🧾 Spending by Category</h2>
                <div className="section-actions">
                <button onClick={this.exportCategoryToExcel}>Export</button>
                </div>
              </div>
              <div className="chart-wrapper">
                <Pie data={categoryChart} />
              </div>
            </section>
          </div>

          <section className="insight-section">
            <h2>🤖 Predicted Next Month Expense</h2>
            <p className="insight-highlight">Estimated: ₹{prediction?.toFixed(2) || "Loading..."}</p>
          </section>

          <section className="insight-section">
            <h2>💡 Smart Suggestions</h2>
            <ul className="suggestion-list">
              {suggestions.map((suggestion, index) => (
                <li key={index}>👉 {suggestion}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  }
}

export default AIInsights;
