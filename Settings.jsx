import React, { Component } from "react";
import { callApi } from "../api";
import {
  FaBars, FaChartPie, FaMoneyBill, FaLightbulb,
  FaBell, FaList, FaCog
} from "react-icons/fa";
import "../assets/DashBoard.css";
import "../assets/Settings.css";

class EnhancedSettings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: JSON.parse(localStorage.getItem("user")) || {},
      sidebarExpanded: false,
      newPassword: "",
      confirmPassword: "",
      darkMode: false,
      receiveAlerts: false,
      twoFactorEnabled: false,
      profilePictureUrl: null,
      loading: false
    };
  }

  componentDidMount() {
    if (!this.state.user.email) {
      window.location.replace("/");
      return;
    }
    this.fetchUserData();
  }

  fetchUserData = () => {
    callApi(
      "GET",
      `http://localhost:8080/settings/get-settings/${this.state.user.email}`,
      "",
      (response) => {
        try {
          const userData = JSON.parse(response);
          this.setState({
            user: userData,
            darkMode: userData.darkMode || false,
            receiveAlerts: userData.receiveAlerts || false,
            twoFactorEnabled: userData.twoFactorEnabled || false,
            profilePictureUrl: userData.profilePictureUrl || null
          });
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    );
  };

  handleLogout = () => {
    localStorage.removeItem("user");
    window.location.replace("/");
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      user: {
        ...prevState.user,
        [name]: value
      }
    }));
  };

  handleToggleChange = (e) => {
    const { name, checked } = e.target;
    this.setState({ [name]: checked });
  };

  handleSaveChanges = (e) => {
    e.preventDefault();
    const { user, newPassword, confirmPassword, darkMode, receiveAlerts, twoFactorEnabled } = this.state;

    if (newPassword && newPassword !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    this.setState({ loading: true });

    // Update profile settings
    callApi(
      "PUT",
      `http://localhost:8080/settings/update-profile/${user.email}`,
      {
        fullname: user.fullname,
        phoneNumber: user.phoneNumber,
        profilePictureUrl: this.state.profilePictureUrl,
        languagePreference: user.languagePreference,
        darkMode,
        twoFactorEnabled
      },
      () => {
        // Update password if changed
        if (newPassword) {
          callApi(
            "PUT",
            `http://localhost:8080/settings/update-password/${user.email}`,
            newPassword,
            () => {
              // Update alert preferences
              callApi(
                "PUT",
                `http://localhost:8080/settings/update-alert-preferences/${user.email}`,
                receiveAlerts,
                () => {
                  this.setState({
                    loading: false,
                    newPassword: "",
                    confirmPassword: ""
                  });
                  alert("Settings saved successfully!");
                  this.fetchUserData();
                }
              );
            }
          );
        } else {
          // Update alert preferences without password change
          callApi(
            "PUT",
            `http://localhost:8080/settings/update-alert-preferences/${user.email}`,
            receiveAlerts,
            () => {
              this.setState({ loading: false });
              alert("Settings saved successfully!");
              this.fetchUserData();
            }
          );
        }
      }
    );
  };

  handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    fetch(`http://localhost:8080/settings/upload-profile-picture/${this.state.user.email}`, {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        this.setState({ profilePictureUrl: data.profilePictureUrl });
        callApi(
          "PUT",
          `http://localhost:8080/settings/update-profile-picture/${this.state.user.email}`,
          data.profilePictureUrl,
          () => {
            alert("Profile picture updated!");
          }
        );
      })
      .catch(error => {
        console.error("Upload error:", error);
        alert("Failed to upload profile picture");
      });
  };

  render() {
    const {
      sidebarExpanded,
      user,
      newPassword,
      confirmPassword,
      darkMode,
      receiveAlerts,
      twoFactorEnabled,
      profilePictureUrl,
      loading
    } = this.state;

    return (
      <div className={`dashboard-container ${darkMode ? "dark-mode" : ""}`}>
        {/* Sidebar */}
        <aside
          className={`sidebar ${sidebarExpanded ? "expanded" : ""}`}
          onMouseEnter={() => this.setState({ sidebarExpanded: true })}
          onMouseLeave={() => this.setState({ sidebarExpanded: false })}
        >
          <button
            className="toggle-btn"
            onClick={() => this.setState(prev => ({ sidebarExpanded: !prev.sidebarExpanded }))}
          >
            <FaBars />
          </button>
          <nav className="sidebar-links">
            <a href="/dashboard"><FaChartPie /> <span>Dashboard</span></a>
            <a href="/transactions"><FaMoneyBill /> <span>Transactions</span></a>
            <a href="/insights"><FaLightbulb /> <span>AI Insights</span></a>
            <a href="/budgetandsavings"><FaList /> <span>Budget Planner</span></a>
            <a href="/settings" className="active"><FaCog /> <span>Settings</span></a>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="dashboard-content">
          <header className="dashboard-header">
            <div className="header-title">Settings</div>

            <div className="user-profile">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  className="profile-picture"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${user.fullname}&background=random`;
                  }}
                />
              ) : (
                <div className="default-profile-picture">
                  {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <span>Welcome, {user.fullname || "User"}</span>
            </div>

            <button className="logout-btn" onClick={this.handleLogout}>
              Logout
            </button>
          </header>

          <div className="content-section">
            <form className="settings-form" onSubmit={this.handleSaveChanges}>
              <label>
                Full Name:
                <input
                  type="text"
                  name="fullname"
                  value={user.fullname || ""}
                  onChange={this.handleInputChange}
                  required
                />
              </label>

              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={user.email || ""}
                  disabled
                />
              </label>

              <label>
                Phone Number:
                <input
                  type="tel"
                  name="phoneNumber"
                  value={user.phoneNumber || ""}
                  onChange={this.handleInputChange}
                />
              </label>

              <label>
                New Password:
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => this.setState({ newPassword: e.target.value })}
                  placeholder="Leave blank to keep current"
                />
              </label>

              <label>
                Confirm Password:
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => this.setState({ confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </label>

              <div className="toggle-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    name="darkMode"
                    checked={darkMode}
                    onChange={this.handleToggleChange}
                  />
                  <span className="toggle-text">Dark Mode</span>
                </label>

                <label className="toggle-label">
                  <input
                    type="checkbox"
                    name="receiveAlerts"
                    checked={receiveAlerts}
                    onChange={this.handleToggleChange}
                  />
                  <span className="toggle-text">Email Notifications</span>
                </label>

                <label className="toggle-label">
                  <input
                    type="checkbox"
                    name="twoFactorEnabled"
                    checked={twoFactorEnabled}
                    onChange={this.handleToggleChange}
                  />
                  <span className="toggle-text">Two-Factor Authentication</span>
                </label>
              </div>

              <label className="file-upload-label">
                Profile Picture:
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={this.handleProfilePictureChange}
                    className="file-upload-input"
                  />
                  <span className="file-upload-button">Choose File</span>
                  <span className="file-upload-name">
                    {profilePictureUrl ? "Change picture" : "No file chosen"}
                  </span>
                </div>
              </label>

              <button
                type="submit"
                className="save-btn"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default EnhancedSettings;