document.addEventListener("DOMContentLoaded", () => {
  console.log("Expense Tracker Loaded!");

  // Toggle password visibility function
  window.togglePassword = function (fieldId) {
      const field = document.getElementById(fieldId);
      field.type = field.type === "password" ? "text" : "password";
  };
});
