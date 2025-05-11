import React, { Component } from "react";
import {
  FaBars, FaChartPie, FaMoneyBill, FaLightbulb,
  FaBell, FaList, FaCog, FaUser, FaSignOutAlt
} from "react-icons/fa";
import "../assets/DashBoard.css";
import "../assets/BudgetAndSavings.css";

class BudgetAndSavings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: JSON.parse(localStorage.getItem("user")) || {},
      budgets: [],
      transactions: [],
      sidebarExpanded: false,
      settingsOpen: false,
      isModalOpen: false,
      newBudget: { category: "", budget: "" },
      manualToggle: false,
    };
  }

  componentDidMount() {
    const { user } = this.state;
    if (!user.email) {
      window.location.replace("/");
      return;
    }
    this.fetchBudgets();
    this.fetchTransactions();
  }

  fetchBudgets = () => {
    fetch(`http://localhost:8080/budgets/${this.state.user.email}`)
      .then(res => res.json())
      .then(data => this.setState({ budgets: data }))
      .catch(err => console.error("Error fetching budgets:", err));
  };

  fetchTransactions = () => {
    fetch(`http://localhost:8080/expense_users/transactions/${this.state.user.email}`)
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(txn => ({
          ...txn,
          amount: parseFloat(txn.amount),
          date: new Date(txn.date)
        }));
        this.setState({ transactions: formatted });
      })
      .catch(err => console.error("Error fetching transactions:", err));
  };

  getTotalIncome = () => {
    return this.state.transactions
      .filter(txn => txn.transactionType === "Income")
      .reduce((sum, txn) => sum + txn.amount, 0);
  };

  getSpentForCategory = (category) => {
    return this.state.transactions
      .filter(txn => txn.transactionType === "Expense" && txn.category.toLowerCase() === category.toLowerCase())
      .reduce((sum, txn) => sum + txn.amount, 0);
  };

  toggleSettings = () => {
    this.setState(prev => ({ settingsOpen: !prev.settingsOpen }));
  };

  handleLogout = () => {
    localStorage.clear();
    window.location.replace("/");
  };

  handleAddBudget = () => {
    const { newBudget, user } = this.state;
    if (!newBudget.category || !newBudget.budget) {
      alert("Please fill both fields.");
      return;
    }

    const payload = {
      userEmail: user.email,
      category: newBudget.category,
      budgetAmount: newBudget.budget,
      spentAmount: 0
    };

    fetch("http://localhost:8080/budgets/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        this.setState({ newBudget: { category: "", budget: "" }, isModalOpen: false });
        this.fetchBudgets();
      })
      .catch(err => console.error("Error adding budget:", err));
  };

  handleDeleteBudget = (id) => {
    const confirm = window.confirm("Are you sure you want to delete this budget?");
    if (!confirm) return;

    fetch(`http://localhost:8080/budgets/delete/${id}`, { method: "DELETE" })
      .then(() => this.fetchBudgets())
      .catch(err => console.error("Error deleting budget:", err));
  };

  render() {
    const { sidebarExpanded, settingsOpen, budgets, transactions, newBudget, isModalOpen } = this.state;
    const totalIncome = this.getTotalIncome();
    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + this.getSpentForCategory(b.category), 0);
    const totalSavings = totalIncome - totalSpent;

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
            <a href="/dashboard"><FaChartPie /> <span>Dashboard</span></a>
            <a href="/transactions"><FaMoneyBill /> <span>Transactions</span></a>
            <a href="/insights"><FaLightbulb /> <span>AI Insights</span></a>            
            <a href="/budgetandsavings" className="active"><FaList /> <span>Budget Planner</span></a>
            <a href="/settings"><FaCog/><span>Settings</span></a>

          </nav>
        </aside>

        {/* Main Content */}
        <div className="dashboard-content">
          <header className="dashboard-header">
            <h1>Budget & Savings</h1>
            <div className="user-section">
              <span>Welcome, {this.state.user.fullname || "User"}</span>
              <button className="logout-btn" onClick={this.handleLogout}>Logout</button>
            </div>
          </header>

          <div className="budget-summary-cards">
            <div className="budget-card income-card">💰 Income: ₹{totalIncome}</div>
            <div className="budget-card planned-card">📊 Planned Budget: ₹{totalBudget}</div>
            <div className="budget-card spent-card">💸 Spent: ₹{totalSpent}</div>
            <div className="budget-card savings-card">🪙 Estimated Savings: ₹{totalSavings}</div>
          </div>

          <div className="budget-actions">
            <button className="budget-add-btn" onClick={() => this.setState({ isModalOpen: true })}>
              ➕ Add New Budget
            </button>
          </div>

          <div className="budget-table-wrapper">
            <table className="budget-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Planned (₹)</th>
                  <th>Spent (₹)</th>
                  <th>Remaining (₹)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map(b => {
                  const spent = this.getSpentForCategory(b.category);
                  const remaining = b.budgetAmount - spent;
                  return (
                    <tr key={b.id}>
                      <td>{b.category}</td>
                      <td>{b.budgetAmount}</td>
                      <td>{spent}</td>
                      <td>{remaining}</td>
                      <td>
                        <button className="budget-delete-btn" onClick={() => this.handleDeleteBudget(b.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modal */}
{isModalOpen && (
  <div className="budget-popup-overlay">
    <div className="budget-popup-form">
      <h2>Add New Budget</h2>
      
      {/* Category Dropdown */}
      <select
        value={newBudget.category}
        onChange={(e) => this.setState({ newBudget: { ...newBudget, category: e.target.value } })}
      >
        <option value="">Select Category</option>
        <option value="Food">Food</option>
        <option value="Rent">Rent</option>
        <option value="Travel">Travel</option>
        <option value="Entertainment">Entertainment</option>
        <option value="Utilities">Utilities</option>
        <option value="Groceries">Groceries</option>
        <option value="Health">Health</option>
        <option value="Shopping">Shopping</option>
        <option value="Fuel">Fuel</option>
        <option value="Salary">Salary</option>
        <option value="Investment">Investment</option>
        <option value="Miscellaneous">Miscellaneous</option>
      </select>

      {/* Budget Amount Input */}
      <input
        type="number"
        placeholder="Enter Budget Amount"
        value={newBudget.budget}
        onChange={(e) => this.setState({ newBudget: { ...newBudget, budget: parseInt(e.target.value) || 0 } })}
      />

      <div className="budget-popup-buttons">
        <button className="budget-save-btn" onClick={this.handleAddBudget}>Save</button>
        <button className="budget-cancel-btn" onClick={() => this.setState({ isModalOpen: false })}>Cancel</button>
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    );
  }
}

export default BudgetAndSavings;
