import React, { Component } from "react";
import "../assets/styles.css";
import { callApi, setSession } from "../api";

class MainLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoginOpen: false,
      isRegisterOpen: false,
      isForgotPasswordOpen: false,
      isResponseVisible: false,
      responseMessage: "",
      responseType: "",
      captchaText: "",
      userCaptchaInput: "",
      captchaError: false
    };
    this.userRegistration = this.userRegistration.bind(this);
    this.getResponse = this.getResponse.bind(this);
    this.forgetPassword = this.forgetPassword.bind(this);
    this.signin = this.signin.bind(this);
    this.generateCaptcha = this.generateCaptcha.bind(this);
    this.validateCaptcha = this.validateCaptcha.bind(this);
  }

  componentDidMount() {
    this.generateCaptcha();
  }

  generateCaptcha() {
    // Generate a simple 5-character captcha
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let captcha = "";
    for (let i = 0; i < 5; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.setState({ captchaText: captcha, userCaptchaInput: "", captchaError: false });
  }

  validateCaptcha() {
    const { captchaText, userCaptchaInput } = this.state;
    return captchaText === userCaptchaInput;
  }

  showSignin = () => {
    this.setState({ 
      isLoginOpen: true, 
      isRegisterOpen: false, 
      isForgotPasswordOpen: false 
    }, () => {
      this.generateCaptcha();
      setTimeout(() => {
        document.getElementById("username").value = "";
        document.getElementById("signinpassword").value = "";
        document.getElementById("username").focus();
      }, 100);
    });
  };

  showSignup = () => {
    this.setState({ isRegisterOpen: true, isLoginOpen: false, isForgotPasswordOpen: false });
    setTimeout(() => {
      document.getElementById("fullname").value = "";
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
      document.getElementById("confirmPassword").value = "";
      document.getElementById("fullname").focus();
    }, 100);
  };

  closeModal = (event) => {
    if (event.target.id === "popup") {
      this.setState({ isLoginOpen: false, isRegisterOpen: false, isForgotPasswordOpen: false });
    }
  };

  userRegistration() {
    let fullname = document.getElementById("fullname");
    let email = document.getElementById("email");
    let password = document.getElementById("password");
    let confirmPassword = document.getElementById("confirmPassword");

    fullname.style.border = "";
    email.style.border = "";
    password.style.border = "";
    confirmPassword.style.border = "";

    if (fullname.value == "") {
      fullname.style.border = "1px solid red";
      fullname.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.style.border = "1px solid red";
      email.focus();
      return;
    }
    if (password.value == "") {
      password.style.border = "1px solid red";
      password.focus();
      return;
    }
    if (password.value !== confirmPassword.value) {
      confirmPassword.style.border = "1px solid red";
      confirmPassword.focus();
      return;
    }

    if (!fullname || !email || !password || !confirmPassword) {
      alert("All fields are required!");
      return;
    }

    if (password.value !== confirmPassword.value) {
      alert("Passwords do not match!");
      return;
    }

    let data = JSON.stringify({
      fullname: fullname.value,
      email: email.value,
      password: password.value,
    });

    callApi("POST", "http://localhost:8080/expense_users/signup", data, this.getResponse);
  }

  getResponse(res) {
    let resp = res.split("::");
    alert(resp[1]);

    if (resp[0] === "200") {
      this.showSignin();
    }
  }

  forgetPassword() {
    let username = document.getElementById("username");
    username.style.border = "";
    if (!username) {
      alert("Email input field not found.");
      return;
    }

    username.style.border = ""; // Reset border
    if (username.value.trim() === "") {
      username.style.border = "1px solid red";
      username.focus();
      return;
    }

    let url = `http://localhost:8080/expense_users/forgotpassword/${username.value}`;
    callApi("GET", url, "", (res) => {
      let data = res.split("::");
      if (data[0] === "200") {
        alert("Password reset link has been sent to your email!");
        this.setState({ isForgotPasswordOpen: false });
      } else {
        alert(data[1]);
      }
    });
  }

  forgetpasswordResponse = res => {
    let data = res.split("::");
    this.setState({ forgotPasswordResponse: data[1], isResponseSuccess: data[0] === "200" });
  }

  signin() {
    let email = document.getElementById("username");
    let password = document.getElementById("signinpassword");

    email.style.border = "";
    password.style.border = "";

    if (email.value.trim() === "") {
      email.style.border = "1px solid red";
      email.focus();
      return;
    }
    if (password.value.trim() === "") {
      password.style.border = "1px solid red";
      password.focus();
      return;
    }

    // Validate CAPTCHA
    if (!this.validateCaptcha()) {
      this.setState({ captchaError: true });
      return;
    }

    let data = JSON.stringify({
      email: email.value,
      password: password.value
    });

    callApi("POST", "http://localhost:8080/expense_users/signin", data, this.signinResponse);
  }

  signinResponse(res) {
    let resp = res.split("::");

    if (resp[0] === "200") {
      let token = resp[1]; // Extract token
      localStorage.setItem("jwtToken", token);  // Save token in storage

      // Fetch user details after successful login
      let email = document.getElementById("username").value;
      callApi("GET", `http://localhost:8080/expense_users/getUser/${email}`, "", (userData) => {
        let user = JSON.parse(userData);
        localStorage.setItem("user", JSON.stringify(user)); // Save user details

        alert("Login Successful!");
        window.location.replace("/dashboard");  // Redirect to Dashboard
      });
    } else {
      let responseDiv = document.getElementById("responseDiv1");
      responseDiv.innerHTML = `<br/><br/><label style="color:red">${resp[1]}</label>`;
    }
  }

  render() {
    const { captchaText, userCaptchaInput, captchaError } = this.state;

    return (
      <div>
        {/* Header Section */}
        <header>
          <h1>ArthaGuru - Personal Finance Assistant</h1>
          <nav>
            <a href="/" className="active">Home</a>
            <button className="nav-btn" onClick={this.showSignin}>Login</button>
            <button className="nav-btn" onClick={this.showSignup}>Register</button>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="intro">
          <h2>Welcome to <span className="brand-name">ArthaGuru</span> - Your Smart Finance Partner!</h2>
          
          <p className="tagline">
            <i className="fas fa-hand-holding-usd"></i> Empower your financial journey with AI-driven insights!
          </p>

          <p className="welcome-message">
            Managing your money shouldn't be stressful. With <b>ArthaGuru</b>, you get smart tracking, personalized budgets, 
            and secure management—all in one place.
          </p>

          <div className="key-benefits">
            <div className="benefit-item">
              <i className="fas fa-lightbulb"></i>
              <p>Gain financial clarity</p>
            </div>
            <div className="benefit-item">
              <i className="fas fa-rocket"></i>
              <p>Achieve your goals faster</p>
            </div>
            <div className="benefit-item">
              <i className="fas fa-shield-alt"></i>
              <p>Stay secure & worry-free</p>
            </div>
          </div>

          <button className="get-started" onClick={this.showSignup}>
            <i className="fas fa-sign-in-alt"></i> Get Started
          </button>
        </section>

        {/* Features Section */}
        <section className="features-page">
            <h2 className="features-title">Why Choose ArthaGuru?</h2>

            <div className="features-container">
              <div className="feature-card">
                <div className="feature-icon"><i className="fas fa-wallet"></i></div>
                <h3>Track Expenses</h3>
                <p>Easily monitor and categorize your spending with AI insights.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fas fa-piggy-bank"></i></div>
                <h3>Budget Recommendations</h3>
                <p>Receive personalized budget suggestions for better planning.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fas fa-chart-line"></i></div>
                <h3>Analytics</h3>
                <p>Visualize your financial health with detailed graphs and reports.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fas fa-bell"></i></div>
                <h3>Smart Alerts</h3>
                <p>Get notified when you overspend or need to save more.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fas fa-hand-holding-usd"></i></div>
                <h3>Investment Insights</h3>
                <p>AI-driven recommendations to grow your wealth efficiently.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon"><i className="fas fa-shield-alt"></i></div>
                <h3>Secure & Private</h3>
                <p>Your financial data is encrypted and protected at all times.</p>
              </div>
            </div>
        </section>

        {/* Footer Section */}
        <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>ArthaGuru</h3>
            <p>Your trusted personal finance assistant.</p>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/features">Features</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Follow Us</h3>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook"></i></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin"></i></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Nithish. All rights reserved.</p>
        </div>
        </footer>

        {/* Login Modal */}
        {this.state.isLoginOpen && (
          <div className="modal" onClick={this.closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <span className="close" onClick={() => this.setState({ isLoginOpen: false })}>&times;</span>
              <h3 className="modal-title">Login</h3>
              <input type="email" id="username" placeholder="Enter your email" />
              <input type="password" id="signinpassword" placeholder="Enter your password" />
              
              {/* CAPTCHA Section */}
              <div className="captcha-container">
                <div className="captcha-display">
                  <span className="captcha-text">{captchaText}</span>
                  <button 
                    className="captcha-refresh" 
                    onClick={this.generateCaptcha}
                    title="Refresh CAPTCHA"
                  >
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter CAPTCHA"
                  value={userCaptchaInput}
                  onChange={(e) => this.setState({ userCaptchaInput: e.target.value })}
                />
                {captchaError && (
                  <p className="error-message">CAPTCHA verification failed. Please try again.</p>
                )}
              </div>
              
              <button className="btn-primary" onClick={this.signin}>Login</button>
              {this.state.signinError && <p className="error-message">{this.state.signinError}</p>}
              <p className="link" onClick={() => this.setState({ isForgotPasswordOpen: true, isLoginOpen: false })}>
                <span>Forgot Password?</span>
              </p>
              <p className="switch-modal">
                Don't have an account?{" "}
                <span onClick={() => this.setState({ isRegisterOpen: true, isLoginOpen: false })} className="switch-link">Sign up</span>
              </p>
            </div>
          </div>
        )}

        {/* Register Modal */}
        {this.state.isRegisterOpen && (
          <div className="modal" onClick={this.closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <span className="close" onClick={() => this.setState({ isRegisterOpen: false })}>&times;</span>
              <h3 className="modal-title">Register</h3>
              <input type="text" id="fullname" placeholder="Full Name" />
              <input type="email" id="email" placeholder="Email" />
              <input type="password" id="password" placeholder="Password" />
              <input type="password" id="confirmPassword" placeholder="Confirm Password" />
              <button className="btn-primary" onClick={this.userRegistration}>Sign Up</button>
              {this.state.registrationError && <p className="error-message">{this.state.registrationError}</p>}
              <p className="switch-modal">
                Already have an account?{" "}
                <span onClick={() => this.setState({ isLoginOpen: true, isRegisterOpen: false })} className="switch-link">Login here</span>
              </p>
            </div>
          </div>
        )}

        {/* Forgot Password Modal */}
        {this.state.isForgotPasswordOpen && (
          <div className="modal" onClick={this.closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <span className="close" onClick={() => this.setState({ isForgotPasswordOpen: false })}>&times;</span>
              <h3 className="modal-title">Reset Password</h3>
              <input type="email" id="username" placeholder="Enter your registered email" />
              <button className="btn-primary" onClick={this.forgetPassword}>Send Reset Link</button>
              {this.state.forgotPasswordResponse && (
                <p className={`response-message ${this.state.isResponseSuccess ? "success" : "error"}`}>
                  {this.state.forgotPasswordResponse}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default MainLayout;