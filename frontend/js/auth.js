/**
 * ============================================================
 * AUTH MODULE — Login & Registration
 * ============================================================
 */

function toggleAuthForm(event) {
    event.preventDefault();
    document.getElementById('login-form').classList.toggle('active');
    document.getElementById('register-form').classList.toggle('active');
    // Clear errors
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('register-error').classList.add('hidden');
}

async function handleLogin(event) {
    event.preventDefault();
    const btn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');
    
    setButtonLoading(btn, true);
    errorDiv.classList.add('hidden');

    try {
        const data = await AuthAPI.login({
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value
        });

        Auth.setToken(data.token);
        Auth.setUser({ username: data.username, fullName: data.fullName });
        showToast('Welcome back, ' + data.fullName + '!', 'success');
        initApp();
    } catch (error) {
        errorDiv.textContent = error.message || 'Invalid username or password';
        errorDiv.classList.remove('hidden');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const btn = document.getElementById('register-btn');
    const errorDiv = document.getElementById('register-error');

    setButtonLoading(btn, true);
    errorDiv.classList.add('hidden');

    try {
        const data = await AuthAPI.register({
            fullName: document.getElementById('reg-fullname').value,
            username: document.getElementById('reg-username').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value
        });

        Auth.setToken(data.token);
        Auth.setUser({ username: data.username, fullName: data.fullName });
        showToast('Account created! Welcome, ' + data.fullName + '!', 'success');
        initApp();
    } catch (error) {
        errorDiv.textContent = error.message || 'Registration failed';
        errorDiv.classList.remove('hidden');
    } finally {
        setButtonLoading(btn, false);
    }
}

function handleLogout() {
    Auth.clear();
    showPage('auth');
    showToast('Signed out successfully', 'info');
    // Clear form inputs
    document.querySelectorAll('input').forEach(i => i.value = '');
}

function setButtonLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (loading) {
        if (text) text.classList.add('hidden');
        if (loader) loader.classList.remove('hidden');
        btn.disabled = true;
    } else {
        if (text) text.classList.remove('hidden');
        if (loader) loader.classList.add('hidden');
        btn.disabled = false;
    }
}
