import ENDPOINTS from './api';

export async function register({ name, email, password }) {
    const res = await fetch(ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
        throw new Error(data.message || 'Registrasi gagal');
    }
    
    return data;
    }

    export async function login({ email, password }) {
    const res = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
        throw new Error(data.message || 'Login gagal');
    }
    
    return data;
}