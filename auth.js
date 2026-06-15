const SUPABASE_URL = "https://axgqawopidzljidnaodd.supabase.co";
const SUPABASE_KEY = "sb_publishable_NKLsMIAtibXaIyoIbjIl4Q_H4sPnLx2";

const _authClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function isLoggedIn() {
  const { data: { session } } = await _authClient.auth.getSession();
  return session !== null;
}

async function logout() {
  await _authClient.auth.signOut();
  window.location.href = "login.html";
}

const isLoginPage = window.location.pathname.endsWith("login.html");

if (isLoginPage) {
  _authClient.auth.getSession().then(({ data: { session } }) => {
    if (session) window.location.href = "index.html";
  });

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");

    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const pass = document.getElementById("loginPass").value;

      const { error } = await _authClient.auth.signInWithPassword({ email, password: pass });

      if (error) {
        if (loginError) loginError.classList.add("visible");
        document.getElementById("loginPass").value = "";
        document.getElementById("loginPass").focus();
      } else {
        window.location.href = "index.html";
      }
    });
  });
} else {
  _authClient.auth.getSession().then(({ data: { session } }) => {
    if (!session) window.location.href = "login.html";
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".logout")?.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });
}
