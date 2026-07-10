// Test script to verify authentication changes
console.log('Testing authentication-aware Home page...');

// Check if authentication context is available
const authContext = window.useAuth;
if (authContext) {
  console.log('✅ Authentication context is available');
} else {
  console.log('❌ Authentication context not found');
}

// Check current authentication status
const currentPath = window.location.pathname;
console.log('Current path:', currentPath);

// Check if user is authenticated
const token = localStorage.getItem('token');
console.log('Token present:', !!token);

// Check for auth buttons vs dashboard buttons
const signInButton = document.querySelector('a[href="/login"]');
const joinButton = document.querySelector('a[href="/signup"]');
const dashboardButton = document.querySelector('a[href*="dashboard"]');

console.log('Sign In button found:', !!signInButton);
console.log('Join button found:', !!joinButton);
console.log('Dashboard button found:', !!dashboardButton);

if (token && (signInButton || joinButton)) {
  console.log('🔧 Issue: User is authenticated but auth buttons are still showing');
} else if (!token && dashboardButton) {
  console.log('🔧 Issue: User is not authenticated but dashboard button is showing');
} else {
  console.log('✅ Button display is correct for current authentication state');
}
