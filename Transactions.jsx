// Transactions.jsx
import React, { Component } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { callApi } from "../api";
import "../assets/DashBoard.css";
import "../assets/Transactions.css";
import {
  FaBars, FaChartPie, FaMoneyBill, FaLightbulb,
  FaBell, FaList, FaCog, FaUser, FaSignOutAlt, FaTrash
} from "react-icons/fa";


class Transactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: JSON.parse(localStorage.getItem("user")) || {},
      transactions: [],
      settingsOpen: false,
      sidebarExpanded: false,
      search: "",
      startDate: "",
      endDate: "",
      categoryFilter: "",
      currentPage: 1,
      transactionsPerPage: 20,
      showEditTransaction: false,
      transactionToEdit: {
        id: "",
        category: "",
        amount: "",
        date: "",
        paymentType: "",
        transactionType: "",
        note: "",
        manualToggle: false,
      }
    };
  }

  componentDidMount() {
    if (!this.state.user.email) {
      window.location.replace("/");
      return;
    }
    this.fetchAllTransactions();
  }

  fetchAllTransactions = () => {
    const email = this.state.user.email;
    callApi("GET", `http://localhost:8080/expense_users/transactions/${email}`, "", (res) => {
      try {
        const data = JSON.parse(res);
        const transactions = data.map((txn) => ({
          id: txn.id || Math.random(),
          category: txn.category || "Uncategorized",
          amount: parseFloat(txn.amount || 0),
          paymentType: txn.paymentType || "Unknown",
          note: txn.note || "No note",
          date: txn.date ? new Date(txn.date) : new Date(),
          transactionType: txn.transactionType || (txn.amount > 0 ? "Income" : "Expense"),
        })).sort((a, b) => b.date - a.date);

        this.setState({ transactions });
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    });
  };

  handleDeleteTransaction = () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this transaction?");
    if (!confirmDelete) return;
  
    fetch(`http://localhost:8080/expense_users/deleteTransaction/${this.state.transactionToEdit.id}`, {
      method: "DELETE"
    })
      .then((res) => res.text())
      .then((message) => {
        alert(message);
        this.setState({ showEditTransaction: false });
        this.fetchTransactions(); // reload updated list
      })
      .catch((error) => {
        console.error("Error deleting transaction:", error);
      });
  };
  
  

  handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    window.location.replace("/");
  };

  exportToExcel = () => {
    console.log("Export function called");
  
    const worksheet = XLSX.utils.json_to_sheet(this.state.transactions.map(txn => ({
      Date: txn.date.toLocaleDateString("en-IN"),
      Category: txn.category,
      Type: txn.transactionType,
      Amount: txn.amount,
      Payment: txn.paymentType,
      Note: txn.note
    })));
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
  
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    saveAs(fileData, "transactions.xlsx");
  };

  exportToCSV = () => {
    const csvData = this.state.transactions.map(txn => ({
      Date: txn.date.toLocaleDateString("en-IN"),
      Category: txn.category,
      Type: txn.transactionType,
      Amount: txn.amount,
      Payment: txn.paymentType,
      Note: txn.note
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "transactions.csv");
  };

  openEditModal = (txn) => {
    this.setState({
      showEditModal: true,
      editTransaction: {
        id: txn.id,
        category: txn.category,
        amount: txn.amount,
        date: txn.date.toISOString().split("T")[0],
        paymentType: txn.paymentType,
        transactionType: txn.transactionType,
        note: txn.note
      }
    });
  };

  handleEditInputChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      transactionToEdit: {
        ...prevState.transactionToEdit,
        [name]: value
      }
    }));
  };
  

  handleUpdateTransaction = (e) => {
    e.preventDefault();
  
    fetch("http://localhost:8080/expense_users/updateTransaction", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(this.state.transactionToEdit)
    })
      .then((res) => res.text())
      .then((message) => {
        alert(message);
        this.setState({ showEditTransaction: false });
        this.fetchTransactions(); // reload updated transactions
      })
      .catch((error) => {
        console.error("Error updating transaction:", error);
      });
  };
  
  
  toggleSettings = () => {
    this.setState((prevState) => ({
      settingsOpen: !prevState.settingsOpen
    }));
  };

  render() {
    const filteredTransactions = this.state.transactions.filter((txn) => {
        const searchLower = this.state.search.toLowerCase();
        const matchSearch =
          txn.category.toLowerCase().includes(searchLower) ||
          txn.note.toLowerCase().includes(searchLower) ||
          txn.paymentType.toLowerCase().includes(searchLower) ||
          txn.transactionType.toLowerCase().includes(searchLower) ||
          txn.amount.toString().includes(searchLower);
      
        const matchCategory = this.state.categoryFilter
          ? txn.category === this.state.categoryFilter
          : true;
      
        const matchDate =
          (!this.state.startDate || new Date(txn.date) >= new Date(this.state.startDate)) &&
          (!this.state.endDate || new Date(txn.date) <= new Date(this.state.endDate));
      
        return matchSearch && matchCategory && matchDate;
    });
    
    const indexOfLastTxn = this.state.currentPage * this.state.transactionsPerPage;
    const indexOfFirstTxn = indexOfLastTxn - this.state.transactionsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstTxn, indexOfLastTxn);

    const totalPages = Math.ceil(filteredTransactions.length / this.state.transactionsPerPage);


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
            <h1>All Transactions</h1>
            <div className="user-section">
              <span>Welcome, {this.state.user.fullname || "User"}</span>
              <button className="logout-btn" onClick={this.handleLogout}>Logout</button>
            </div>
          </header>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by category or note..."
              value={this.state.search}
              onChange={(e) => this.setState({ search: e.target.value })}
            />
          </div>

          <div className="filter-export-wrapper">
            {/* Filters */}
            <div className="filters">
              <input
                type="date"
                value={this.state.startDate}
                onChange={(e) => this.setState({ startDate: e.target.value })}
              />
              <input
                type="date"
                value={this.state.endDate}
                onChange={(e) => this.setState({ endDate: e.target.value })}
              />
              <select
                value={this.state.categoryFilter}
                onChange={(e) => this.setState({ categoryFilter: e.target.value })}
              >

                <option value="">All Categories</option>
                {[...new Set(this.state.transactions.map(txn => txn.category))].map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Export Buttons */}
            <div className="export-buttons">
              <button onClick={() => this.exportToExcel()}>Export to Excel</button>
            </div>
          </div>

          {/* Edit Transaction Popup */}
            {this.state.showEditTransaction && (
              <div className="popup-overlay">
                <div className="popup-form">
                  <h2>Edit Transaction</h2>
                  <form onSubmit={this.handleUpdateTransaction}>
                    <label>Category:</label>
                    <select
                        name="category"
                        value={this.state.transactionToEdit.category}
                        onChange={this.handleEditInputChange}
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
                    <input
                      type="number"
                      name="amount"
                      value={this.state.transactionToEdit.amount}
                      onChange={this.handleEditInputChange}
                      required
                    />

                    <label>Date:</label>
                    <input
                      type="date"
                      name="date"
                      value={this.state.transactionToEdit.date}
                      onChange={this.handleEditInputChange}
                      required
                    />

                    <label>Payment Type:</label>
                    <select
                      name="paymentType"
                      value={this.state.transactionToEdit.paymentType}
                      onChange={this.handleEditInputChange}
                      required
                    >
                      <option value="">Select Payment Type</option>
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="UPI">UPI</option>
                    </select>

                    <label>Transaction Type:</label>
                    <select
                      name="transactionType"
                      value={this.state.transactionToEdit.transactionType}
                      onChange={this.handleEditInputChange}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                    </select>

                    <label>Note:</label>
                    <textarea
                      name="note"
                      value={this.state.transactionToEdit.note}
                      onChange={this.handleEditInputChange}
                      placeholder="Optional note..."
                    />

                    <div className="popup-actions">
                      <button type="submit" className="update-btn">Update</button>
                      <button type="button" className="cancel-btn" onClick={() => this.setState({ showEditTransaction: false })}>
                        Cancel
                      </button>
                      <button type="button" className="delete-btn" onClick={this.handleDeleteTransaction}>
                        Delete
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          
          <div className="transaction-list">
            <div className="table-wrapper">
              {filteredTransactions.length === 0 ? (
                <p>No transactions to display.</p>
              ) : (
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Note</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.map((txn) => (
                      <tr key={txn.id}>
                        <td>{txn.date.toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                              })
                              }
                          </td>
                        <td>{txn.category}</td>
                        <td className={txn.transactionType === "Income" ? "income-text" : "expense-text"}>
                          {txn.transactionType}
                        </td>
                        <td>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(txn.amount)}</td>
                        <td>{txn.paymentType}</td>
                        <td>{txn.note}</td>
                        <td>
                          <button onClick={() => this.setState({ 
                            showEditTransaction: true, 
                            transactionToEdit: txn // txn is the selected transaction
                          })}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={this.state.currentPage === i + 1 ? "active-page" : ""}
                  onClick={() => this.setState({ currentPage: i + 1 })}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    );
  }
}

export default Transactions;
