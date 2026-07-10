// Quick test to verify the fix
console.log('Testing Home page with authentication...');

// Check if we can access the page without errors
setTimeout(() => {
  const body = document.body;
  const hasWhiteScreen = body.innerHTML.trim() === '' || body.children.length === 0;
  
  if (hasWhiteScreen) {
    console.log('❌ Still has white screen issue');
  } else {
    console.log('✅ Page is loading correctly');
  }
  
  // Check for auth-specific elements
  const authButtons = document.querySelectorAll('a[href="/login"], a[href="/signup"]');
  const dashboardButton = document.querySelector('a[href*="dashboard"]');
  const userDropdown = document.querySelector('[aria-expanded]');
  
  console.log(`Auth buttons found: ${authButtons.length}`);
  console.log(`Dashboard button found: ${!!dashboardButton}`);
  console.log(`User dropdown found: ${!!userDropdown}`);
}, 2000);
