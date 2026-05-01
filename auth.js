const AUTH_KEY = "fixtrack_auth";
const VALID_USER = "1Fix.admin";
const VALID_PASS = "Clara.Vera.26";

function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = "login.html";
}

const isLoginPage = window.location.pathname.endsWith("login.html");

if (isLoginPage) {
  if (isLoggedIn()) {
    window.location.href = "index.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");

    loginForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = document.getElementById("loginUser").value.trim();
      const pass = document.getElementById("loginPass").value;

      if (user === VALID_USER && pass === VALID_PASS) {
        localStorage.setItem(AUTH_KEY, "true");
        window.location.href = "index.html";
      } else {
        if (loginError) loginError.classList.add("visible");
        document.getElementById("loginPass").value = "";
        document.getElementById("loginPass").focus();
      }
    });
  });
} else {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".logout")?.addEventListener("click", logout);
  });
}
