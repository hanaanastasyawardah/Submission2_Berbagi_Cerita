import { login } from '../../data/auth-api';
import { validateEmail } from '../../utils/index';

export default class LoginPage {
  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Login - Berbagi Cerita</h1>
        <form id="login-form" class="auth-form" aria-label="Form login" novalidate autocomplete="on">
          <div class="field">
            <label for="email">Email <span style="color: #d32f2f;">*</span></label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              aria-required="true"
              aria-describedby="email-error"
              placeholder="contoh@email.com"
              autocomplete="email"
            />
            <span id="email-error" class="field-error" role="alert"></span>
          </div>
          
          <div class="field">
            <label for="password">Password <span style="color: #d32f2f;">*</span></label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              aria-required="true"
              aria-describedby="password-error"
              placeholder="Minimal 8 karakter"
              autocomplete="current-password"
            />
            <span id="password-error" class="field-error" role="alert"></span>
          </div>
          
          <div class="actions">
            <button type="submit">Login</button>
          </div>
          
          <div id="msg" aria-live="polite" aria-atomic="true"></div>
          
          <p style="text-align: center; margin-top: 1rem;">
            Belum punya akun? <a href="#/register" style="color: var(--dark-pink); font-weight: 600;">Daftar di sini</a>
          </p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('login-form');
    const msg = document.getElementById('msg');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Real-time validation
    emailInput.addEventListener('blur', () => {
      const email = emailInput.value.trim();
      const error = document.getElementById('email-error');
      
      if (email && !validateEmail(email)) {
        error.textContent = 'Format email tidak valid';
        emailInput.classList.add('invalid');
      } else {
        error.textContent = '';
        emailInput.classList.remove('invalid');
      }
    });

    passwordInput.addEventListener('blur', () => {
      const password = passwordInput.value;
      const error = document.getElementById('password-error');
      
      if (password && password.length < 8) {
        error.textContent = 'Password minimal 8 karakter';
        passwordInput.classList.add('invalid');
      } else {
        error.textContent = '';
        passwordInput.classList.remove('invalid');
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      
      // Validate
      let isValid = true;
      
      if (!validateEmail(email)) {
        document.getElementById('email-error').textContent = 'Format email tidak valid';
        emailInput.classList.add('invalid');
        isValid = false;
      }
      
      if (password.length < 8) {
        document.getElementById('password-error').textContent = 'Password minimal 8 karakter';
        passwordInput.classList.add('invalid');
        isValid = false;
      }
      
      if (!isValid) {
        msg.textContent = 'Mohon perbaiki input yang tidak valid';
        msg.style.background = '#ffebee';
        msg.style.borderColor = '#d32f2f';
        return;
      }
      
      msg.textContent = 'Memproses login...';
      msg.style.background = '';
      msg.style.borderColor = '';
      
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      
      try {
        const result = await login({ email, password });
        const token = result.loginResult?.token;
        
        if (!token) {
          throw new Error('Token tidak diterima dari server');
        }
        
        // Menyimpan token di localStorage
        localStorage.setItem('story_token', token); 
        
        msg.textContent = '✓ Login berhasil! Redirecting...';
        msg.style.background = '#e8f5e9';
        msg.style.borderColor = '#4caf50';
        
        setTimeout(() => {
          location.hash = '/';
          // Trigger hashchange untuk update navigation
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }, 1500);
        
      } catch (err) {
        msg.textContent = `✗ Login gagal: ${err.message}`;
        msg.style.background = '#ffebee';
        msg.style.borderColor = '#d32f2f';
        submitBtn.disabled = false;
      }
    });
  }
}
