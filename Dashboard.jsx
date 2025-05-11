import { Component } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);
import { callApi } from "../api";
import "../assets/DashBoard.css";
import {
  FaBars,
  FaChartPie,
  FaMoneyBill,
  FaPlus,
  FaList,
  FaLightbulb,
  FaBell,
  FaCog,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";

class DashBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: JSON.parse(localStorage.getItem("user")) || {},
      balance: 0,
      income: 0,
      expenses: 0,
      transactions: [],
      settingsOpen: false,
      sidebarExpanded: false,
      newTransaction: {
        category: "",
        amount: "",
        date: "",
        paymentType: "",
        transactionType: "", // 👈 New field
        note: "",
        successMessage: "",
        manualToggle: false,
      },
    };
    
  }

  componentDidMount() {
    if (!this.state.user.email) {
      window.location.replace("/");
      return;
    }
    this.fetchTransactions();
  }

  fetchTransactions = () => {
    const email = this.state.user.email;
  
    // Fetch recent transactions (for display)
    callApi("GET", `http://localhost:8080/expense_users/recent-transactions/${email}`, "", (res) => {
      try {
        const recentData = JSON.parse(res);
        const recentTransactions = recentData.map((txn) => ({
          id: txn.id || Math.random(),
          description: txn.description || "No Description",
          category: txn.category || "Uncategorized",
          amount: parseFloat(txn.amount || 0),
          paymentType: txn.paymentType || "Unknown",
          note: txn.note || "No additional notes",
          date: txn.date ? new Date(txn.date) : new Date(),
          transactionType: txn.transactionType || (txn.amount > 0 ? "Income" : "Expense"),
        }));
  
        const sortedRecent = recentTransactions.sort((a, b) => b.date - a.date);
  
        this.setState({ transactions: sortedRecent.slice(0, 5) });
      } catch (error) {
        console.error("Error parsing recent transactions:", error);
      }
    });
  
    // Fetch all transactions to calculate balance, income, and expenses
    callApi("GET", `http://localhost:8080/expense_users/transactions/${email}`, "", (res) => {
      try {
        const allData = JSON.parse(res);
        let income = 0, expenses = 0;
  
        allData.forEach((txn) => {
          const amount = parseFloat(txn.amount || 0);
          const type = txn.transactionType || (amount > 0 ? "Income" : "Expense");
  
          if (type === "Income") {
            income += Math.abs(amount);
          } else {
            expenses += Math.abs(amount);
          }
        });
  
        this.setState({
          income,
          expenses,
          balance: income - expenses,
        });
      } catch (error) {
        console.error("Error parsing all transactions:", error);
      }
    });
  };
  
  

  handleDeleteTransaction = (id) => {
    callApi("DELETE", `http://localhost:8080/expense_users/deleteTransaction/${id}`, "", (res) => {
      console.log("Delete response:", res);
      this.fetchTransactions(); // Refresh transactions after deletion
    });
  }; 
  

  handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    window.location.replace("/");
  };
  toggleAddTransaction = () => {
    this.setState({ showAddTransaction: !this.state.showAddTransaction });
  };
  handleAddTransaction = (event) => {
    event.preventDefault(); // Prevent page refresh

    const email = this.state.user.email;

    if (!email || !this.state.newTransaction.category || !this.state.newTransaction.amount || !this.state.newTransaction.date || !this.state.newTransaction.paymentType) {
        alert("All fields are required!");
        return;
    }
    const amount = parseFloat(this.state.newTransaction.amount);
    if (isNaN(amount) || amount === 0) {
        alert("Amount should be a valid number and not zero!");
        return;
    }
    const date = new Date(this.state.newTransaction.date);
    if (isNaN(date.getTime())) {
        alert("Invalid date format!");
        return;
    }


    const transactionData = {
      category: this.state.newTransaction.category,
      amount: parseFloat(this.state.newTransaction.amount),
      date: new Date(this.state.newTransaction.date).toISOString(),
      paymentType: this.state.newTransaction.paymentType,
      transactionType: this.state.newTransaction.transactionType, // 👈 New field
      note: this.state.newTransaction.note,
      user: { email: email },
    };    

    console.log("Sending transaction data:", transactionData); // Debugging

    this.setState({ isSubmitting: true }); // Disable button

    callApi("POST", "http://localhost:8080/expense_users/addTransaction", transactionData, (res) => {
        console.log("Transaction added:", res);

        this.setState({
          newTransaction: {
            category: "",
            amount: "",
            date: "",
            paymentType: "",
            transactionType: "", // 👈 Clear this too
            note: ""
          },
          isSubmitting: false, // Re-enable button
          showAddTransaction: false,
          successMessage: "Transaction added successfully!"
        });
        setTimeout(() => {
          this.setState({ successMessage: "" });
        }, 3000);     

        this.fetchTransactions();
    });

  };

  
  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState((prevState) => ({
      newTransaction: {
        ...prevState.newTransaction,
        [name]: value,
      },
    }));
  };
  

  toggleSettings = () => {
    this.setState((prevState) => ({
      settingsOpen: !prevState.settingsOpen
    }));
  };
  

  render() {
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
            <a href="/budgetandsavings"><FaList /> <span>Budget Planner</span></a>
            <a href="/settings"><FaCog/><span>Settings</span></a>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="dashboard-content">
          <header className="dashboard-header">
            <h1>Artha Guru</h1>
            <div className="user-section">
              <span>Welcome, {this.state.user.fullname || "User"}</span>
              <button className="logout-btn" onClick={this.handleLogout}>Logout</button>
            </div>
          </header>

          {/* Summary Cards */}
          <section className="summary">
            <div className="summary-card balance">
              <h3>Balance</h3>
              <p>₹{this.state.balance.toFixed(2)}</p>
            </div>
            <div className="summary-card income">
              <h3>Income</h3>
              <p>₹{this.state.income.toFixed(2)}</p>
            </div>
            <div className="summary-card expenses">
              <h3>Expenses</h3>
              <p>₹{this.state.expenses.toFixed(2)}</p>
            </div>
          </section>

          <section className="mini-pie-chart">
            <h2>Category-wise Breakdown</h2>
            {this.state.transactions.length === 0 ? (
              <p>No data to show.</p>
            ) : (
              <div className="mini-pie-chart-container">
                <Pie
                  data={{
                    labels: this.state.transactions.map(txn => txn.category),
                    datasets: [
                      {
                        data: this.state.transactions.map(txn => Math.abs(txn.amount)),
                        backgroundColor: [
                          "#3498db",
                          "#e74c3c",
                          "#f1c40f",
                          "#9b59b6",
                          "#1abc9c"
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false, // 💡 Important for controlling size
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          color: "#333",
                          boxWidth: 15
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="add-btn" onClick={this.toggleAddTransaction}>
              <FaPlus /> {this.state.showAddTransaction ? "Close Form" : "Add Transaction"}
            </button>
          </div>

          {this.state.successMessage && (
            <div className="success-message">{this.state.successMessage}</div>
          )}

          {/* Add Transaction Form */}
          {this.state.showAddTransaction && (
            <section className="add-transaction">
              <h2>Add New Transaction</h2>
              <form onSubmit={this.handleAddTransaction}>
              <label>Category:</label>
                <select
                    name="category"
                    value={this.state.newTransaction.category}
                    onChange={this.handleInputChange}
                    required
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


                <label>Amount:</label>
                <input type="number" name="amount" value={this.state.newTransaction.amount} onChange={this.handleInputChange} required />

                <label>Date:</label>
                <input type="date" name="date" value={this.state.newTransaction.date} onChange={this.handleInputChange} required />

                <label>Payment Type:</label>
                <select name="paymentType" value={this.state.newTransaction.paymentType} onChange={this.handleInputChange} required>
                  <option value="">Select Payment Type</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI">UPI</option>
                </select>

                <label>Transaction Type:</label>
                <select
                  name="transactionType"
                  value={this.state.newTransaction.transactionType}
                  onChange={this.handleInputChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>


                <label>Note:</label>
                <textarea
                  name="note"
                  value={this.state.newTransaction.note}
                  onChange={this.handleInputChange}
                  placeholder="Optional note about the transaction..."
                />


                <button type="submit" className="add-txn-btn">{this.state.isSubmitting ? "Adding..." : "Add Transaction"}</button>
              </form>
            </section>
          )}


          {/* Recent Transactions */}
          <section className="recent-transactions">
              <h2 className="transactions-title">Recent Expenses</h2>
              {this.state.transactions.length === 0 ? (
                <p>No transactions found.</p>
              ) : (
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Payment Mode</th>
                      <th>Notes</th>
                      <th>Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.transactions.map((txn, index) => {
                      const rowClass =
                        txn.transactionType?.toLowerCase() === "income"
                          ? "income-row"
                          : "expense-row";

                      return (
                        <tr key={index} className={rowClass}>
                          <td>{new Date(txn.date).toISOString().split("T")[0]}</td>
                          <td>{txn.category}</td>
                          <td>{txn.paymentType}</td>
                          <td>{txn.note || "—"}</td>
                          <td>{txn.transactionType || "—"}</td>
                          <td>{`₹${Math.abs(txn.amount).toFixed(2)}`}</td>
                        </tr>
                      );
                    })}
                  </tbody>

                </table>
              )}
           </section>



        </div>
      </div>
    );
  }
}

export default DashBoard;
