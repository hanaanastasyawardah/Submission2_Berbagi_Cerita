import { register } from '../../data/auth-api';
import { validateEmail, validatePassword } from '../../utils/index';

export default class RegisterPage {
    async render() {
        return `
        <section class="container">
            <h1 class="page-title">Daftar - Berbagi Cerita</h1>
            <form id="register-form" class="auth-form" aria-label="Form registrasi" novalidate autocomplete="on">
            <div class="field">
                <label for="name">Nama Lengkap <span style="color: #d32f2f;">*</span></label>
                <input 
                id="name" 
                name="name" 
                type="text" 
                required 
                aria-required="true"
                aria-describedby="name-error"
                placeholder="Masukkan nama lengkap Anda"
                autocomplete="name"
                />
                <span id="name-error" class="field-error" role="alert"></span>
            </div>
            
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
                aria-describedby="password-error password-help"
                placeholder="Minimal 8 karakter"
                autocomplete="new-password"
                />
                <small id="password-help">Password harus minimal 8 karakter</small>
                <span id="password-error" class="field-error" role="alert"></span>
            </div>
            
            <div class="actions">
                <button type="submit">Daftar</button>
            </div>
            
            <div id="msg" aria-live="polite" aria-atomic="true"></div>
            
            <p style="text-align: center; margin-top: 1rem;">
                Sudah punya akun? <a href="#/login" style="color: var(--dark-pink); font-weight: 600;">Login di sini</a>
            </p>
            </form>
        </section>
        `;
    }

    async afterRender() {
        const form = document.getElementById('register-form');
        const msg = document.getElementById('msg');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        // Real-time validation
        nameInput.addEventListener('blur', () => {
        const name = nameInput.value.trim();
        const error = document.getElementById('name-error');
        
        if (name && name.length < 3) {
            error.textContent = 'Nama minimal 3 karakter';
            nameInput.classList.add('invalid');
        } else {
            error.textContent = '';
            nameInput.classList.remove('invalid');
        }
        });

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

        passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const error = document.getElementById('password-error');
        
        if (password.length > 0 && password.length < 8) {
            error.textContent = `Masih kurang ${8 - password.length} karakter`;
            passwordInput.classList.add('invalid');
        } else {
            error.textContent = '';
            passwordInput.classList.remove('invalid');
        }
        });

        form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validate
        let isValid = true;
        
        if (name.length < 3) {
            document.getElementById('name-error').textContent = 'Nama minimal 3 karakter';
            nameInput.classList.add('invalid');
            isValid = false;
        }
        
        if (!validateEmail(email)) {
            document.getElementById('email-error').textContent = 'Format email tidak valid';
            emailInput.classList.add('invalid');
            isValid = false;
        }
        
        if (!validatePassword(password)) {
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
        
        msg.textContent = 'Memproses registrasi...';
        msg.style.background = '';
        msg.style.borderColor = '';
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        
        try {
            await register({ name, email, password });
            
            msg.textContent = '✓ Registrasi berhasil! Silakan login. Redirecting...';
            msg.style.background = '#e8f5e9';
            msg.style.borderColor = '#4caf50';
            
            form.reset();
            
            setTimeout(() => {
            location.hash = '/login';
            }, 2000);
            
        } catch (err) {
            msg.textContent = `✗ Registrasi gagal: ${err.message}`;
            msg.style.background = '#ffebee';
            msg.style.borderColor = '#d32f2f';
            submitBtn.disabled = false;
        }
        });
    }
}
