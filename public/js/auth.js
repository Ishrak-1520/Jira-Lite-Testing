// =============================================================================
// Auth Module — Login & Register UI Logic
// =============================================================================

const Auth = (() => {
  function init() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        const formId = tab.dataset.tab === 'login' ? 'login-form' : 'register-form';
        document.getElementById(formId).classList.add('active');
      });
    });

    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      UI.setLoading(btn, true);

      try {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const data = await API.login(username, password);
        API.setToken(data.token);
        API.setUser(data.user);
        UI.toast('Welcome back, ' + data.user.displayName + '!', 'success');
        App.showApp();
      } catch (err) {
        UI.toast(err.message || 'Login failed', 'error');
      } finally {
        UI.setLoading(btn, false);
      }
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('register-btn');
      UI.setLoading(btn, true);

      try {
        const data = await API.register({
          displayName: document.getElementById('reg-displayname').value.trim(),
          email: document.getElementById('reg-email').value.trim(),
          username: document.getElementById('reg-username').value.trim(),
          password: document.getElementById('reg-password').value
        });
        API.setToken(data.token);
        API.setUser(data.user);
        UI.toast('Account created! Welcome, ' + data.user.displayName + '!', 'success');
        App.showApp();
      } catch (err) {
        UI.toast(err.message || 'Registration failed', 'error');
      } finally {
        UI.setLoading(btn, false);
      }
    });
  }

  return { init };
})();
