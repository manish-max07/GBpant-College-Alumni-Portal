const axios = require('axios');

async function blockIP() {
  const ipToBlock = '103.165.29.190';
  const reason = 'SECURITY_THREAT_MANUAL_BLOCK';
  
  console.log(`🔒 Blocking IP: ${ipToBlock}`);
  console.log(`📝 Reason: ${reason}`);
  console.log('');
  
  try {
    const response = await axios.post('http://localhost:5000/api/debug/block-ip', {
      ip: ipToBlock,
      reason: reason
    });
    
    if (response.data.success) {
      console.log('✅ SUCCESS: IP blocked successfully!');
      console.log('📄 Response:', response.data.message);
      console.log('🔒 Permanently blocked IPs:', response.data.permanentlyBlockedIPs);
    } else {
      console.log('❌ FAILED: Could not block IP');
      console.log('📄 Message:', response.data.message);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ ERROR: Server not running on http://localhost:5000');
      console.log('💡 Please start the backend server first with: npm start');
    } else {
      console.log('❌ ERROR:', error.response?.data?.message || error.message);
      console.log('📄 Status:', error.response?.status);
    }
  }
}

// Also test the blocked IP to make sure it works
async function testBlockedIP() {
  console.log('\n🧪 Testing if blocked IP is rejected...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/signup', {
      fullName: 'Test User',
      email: 'test@gmail.com',
      mobile: '+919999999999',
      rollNo: 'TEST001',
      isCurrentStudent: false
    }, {
      headers: {
        'X-Forwarded-For': '103.165.29.190',
        'X-Real-IP': '103.165.29.190',
        'User-Agent': 'Test Agent'
      }
    });
    
    console.log('❌ ERROR: Blocked IP was still allowed!');
    
  } catch (error) {
    if (error.response?.status === 403 && 
        error.response?.data?.errorCode === 'IP_PERMANENTLY_BLOCKED') {
      console.log('✅ SUCCESS: IP 103.165.29.190 is correctly blocked!');
      console.log('📄 Block message:', error.response.data.message);
    } else {
      console.log('⚠️ Other error:', error.response?.data?.message || error.message);
    }
  }
}

async function main() {
  console.log('🛡️  IP BLOCKING UTILITY');
  console.log('========================');
  
  await blockIP();
  await testBlockedIP();
  
  console.log('\n✅ IP blocking process completed!');
}

main();
