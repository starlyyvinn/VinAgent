// auth.js - Firebase Authentication dengan Google + GitHub + Email

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyAQQ4w69yQxhIWC63E7J4jdlQpJK5rS1Ow",
  authDomain: "vinagents.firebaseapp.com",
  projectId: "vinagents",
  storageBucket: "vinagents.firebasestorage.app",
  messagingSenderId: "695449179255",
  appId: "1:695449179255:web:307e1797a17f882689e272",
  measurementId: "G-G5PNBDB7Z8"
};

console.log('🔥 Firebase Config:', {
    apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Optional: Tambah scope
googleProvider.addScope('profile');
googleProvider.addScope('email');
githubProvider.addScope('user:email');
githubProvider.addScope('read:user');

// ============= LOGIN MANUAL =============
async function loginManual(email, password, rememberMe = false) {
    try {
        console.log('📧 Login with email:', email);
        
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        console.log(`🔐 Using ${rememberMe ? 'LOCAL' : 'SESSION'} persistence`);
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('✅ Login success:', user.email);
        
        return { 
            success: true, 
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified
            }
        };
        
    } catch (error) {
        console.error('❌ Login error:', error.code, error.message);
        return handleAuthError(error);
    }
}

// ============= REGISTER =============
async function registerManual(email, password) {
    try {
        console.log('📝 Register attempt:', email);
        
        if (password.length < 6) {
            return { success: false, error: 'Password minimal 6 karakter' };
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('✅ Register success:', user.email);
        
        return { 
            success: true, 
            user: {
                uid: user.uid,
                email: user.email
            }
        };
        
    } catch (error) {
        console.error('❌ Register error:', error.code, error.message);
        return handleAuthError(error);
    }
}

// ============= LOGIN DENGAN GOOGLE =============
async function loginWithGoogle(rememberMe = false) {
    try {
        console.log('🟢 Login with Google');
        
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        console.log('✅ Google login success:', user.email);
        
        return { 
            success: true, 
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }
        };
        
    } catch (error) {
        console.error('❌ Google login error:', error.code, error.message);
        return handleAuthError(error);
    }
}

// ============= LOGIN DENGAN GITHUB =============
async function loginWithGitHub(rememberMe = false) {
    try {
        console.log('🐙 Login with GitHub');
        
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        
        const result = await signInWithPopup(auth, githubProvider);
        const user = result.user;
        
        console.log('✅ GitHub login success:', user.email);
        
        return { 
            success: true, 
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }
        };
        
    } catch (error) {
        console.error('❌ GitHub login error:', error.code, error.message);
        return handleAuthError(error);
    }
}

// ============= LOGOUT =============
async function logout() {
    try {
        await signOut(auth);
        console.log('✅ Logout success');
        return { success: true };
    } catch (error) {
        console.error('❌ Logout error:', error);
        return { success: false, error: error.message };
    }
}

// ============= RESET PASSWORD =============
async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log('✅ Reset email sent to:', email);
        return { success: true, message: 'Email reset terkirim. Cek inbox/spam.' };
    } catch (error) {
        console.error('❌ Reset error:', error.code, error.message);
        return handleAuthError(error);
    }
}

// ============= HANDLE ERROR =============
function handleAuthError(error) {
    let message = 'Terjadi kesalahan';
    
    switch (error.code) {
        case 'auth/invalid-email':
            message = 'Email tidak valid';
            break;
        case 'auth/user-disabled':
            message = 'Akun dinonaktifkan';
            break;
        case 'auth/user-not-found':
            message = 'Email belum terdaftar. Silakan sign up dulu!';
            break;
        case 'auth/wrong-password':
            message = 'Password salah';
            break;
        case 'auth/invalid-credential':
            message = 'Email atau password salah. Pastikan Anda sudah sign up.';
            break;
        case 'auth/email-already-in-use':
            message = 'Email sudah terdaftar. Silakan login.';
            break;
        case 'auth/weak-password':
            message = 'Password terlalu lemah (minimal 6 karakter)';
            break;
        case 'auth/popup-closed-by-user':
            message = 'Popup ditutup sebelum selesai';
            break;
        case 'auth/popup-blocked':
            message = 'Popup diblokir browser. Izinkan popup!';
            break;
        case 'auth/unauthorized-domain':
            message = 'Domain tidak terdaftar di Firebase. Tambahkan domain ini di Firebase Console.';
            break;
        case 'auth/account-exists-with-different-credential':
            message = 'Email sudah terdaftar dengan metode lain. Coba login dengan metode yang sesuai.';
            break;
        default:
            message = error.message;
    }
    
    return { success: false, error: message, code: error.code };
}

// ============= AUTH STATE =============
function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, (user) => {
        console.log('🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user');
        callback(user ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified
        } : null);
    });
}

// Export ke window
window.auth = {
    loginManual,
    registerManual,
    loginWithGoogle,
    loginWithGitHub,
    logout,
    resetPassword,
    onAuthStateChange
};

console.log('🔥 Firebase Auth siap dengan Google + GitHub + Email!');
