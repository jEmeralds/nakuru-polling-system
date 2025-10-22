const https = require('https')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

console.log('🔍 Enhanced Supabase connection test...')
console.log('Node.js version:', process.version)
console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('SUPABASE_ANON_KEY length:', process.env.SUPABASE_ANON_KEY?.length)

// Test 1: Basic HTTPS connectivity
async function testHttps() {
  console.log('\n📡 Test 1: Basic HTTPS connectivity...')
  
  return new Promise((resolve) => {
    const url = new URL(process.env.SUPABASE_URL)
    
    console.log('Testing connection to:', url.hostname)
    
    const req = https.get({
      hostname: url.hostname,
      port: 443,
      path: '/',
      timeout: 10000,
      headers: {
        'User-Agent': 'Node.js'
      }
    }, (res) => {
      console.log('✅ HTTPS connection successful')
      console.log('Status:', res.statusCode)
      console.log('Headers:', Object.keys(res.headers).join(', '))
      resolve(true)
    })
    
    req.on('error', (error) => {
      console.log('❌ HTTPS connection failed:', error.message)
      console.log('Error code:', error.code)
      console.log('Error details:', error)
      resolve(false)
    })
    
    req.on('timeout', () => {
      console.log('❌ HTTPS connection timeout')
      req.destroy()
      resolve(false)
    })
  })
}

// Test 2: DNS Resolution
async function testDNS() {
  console.log('\n🔍 Test 2: DNS Resolution...')
  
  const dns = require('dns').promises
  const url = new URL(process.env.SUPABASE_URL)
  
  try {
    const addresses = await dns.lookup(url.hostname)
    console.log('✅ DNS resolution successful:', addresses)
    return true
  } catch (error) {
    console.log('❌ DNS resolution failed:', error.message)
    return false
  }
}

// Test 3: Network connectivity check
async function testNetwork() {
  console.log('\n🌐 Test 3: Network connectivity check...')
  
  // Test google first as baseline
  return new Promise((resolve) => {
    const req = https.get('https://google.com', {timeout: 5000}, (res) => {
      console.log('✅ Internet connection working (Google accessible)')
      resolve(true)
    })
    
    req.on('error', (error) => {
      console.log('❌ No internet connection:', error.message)
      resolve(false)
    })
    
    req.on('timeout', () => {
      console.log('❌ Internet connection timeout')
      req.destroy()
      resolve(false)
    })
  })
}

// Test 4: Simple fetch test
async function testFetch() {
  console.log('\n🔗 Test 4: Simple fetch test...')
  
  try {
    // Test with a simple GET request first
    const response = await fetch(process.env.SUPABASE_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js'
      }
    })
    
    console.log('✅ Fetch successful')
    console.log('Status:', response.status)
    console.log('Headers:', Array.from(response.headers.keys()).join(', '))
    return true
    
  } catch (error) {
    console.log('❌ Fetch failed:', error.message)
    console.log('Error name:', error.name)
    console.log('Error cause:', error.cause)
    return false
  }
}

// Test 5: Supabase client connection with detailed logging
async function testSupabase() {
  console.log('\n🔗 Test 5: Supabase client connection...')
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  )
  
  try {
    console.log('Attempting to query counties table...')
    
    const { data, error } = await supabase
      .from('counties')
      .select('name')
      .limit(1)
    
    if (error) {
      console.log('❌ Supabase query error:', error)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    console.log('📍 Data received:', data)
    return true
    
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message)
    console.log('Error name:', error.name)
    console.log('Error stack:', error.stack)
    return false
  }
}

// Test 6: Environment check
function testEnvironment() {
  console.log('\n⚙️ Test 6: Environment check...')
  
  console.log('OS:', process.platform)
  console.log('Node version:', process.version)
  console.log('Working directory:', process.cwd())
  
  // Check proxy settings
  const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy']
  const proxies = proxyVars.filter(v => process.env[v])
  
  if (proxies.length > 0) {
    console.log('🔍 Proxy settings detected:', proxies.map(v => `${v}=${process.env[v]}`))
  } else {
    console.log('✅ No proxy settings detected')
  }
}

// Run all tests
async function runAllTests() {
  try {
    testEnvironment()
    
    const networkOk = await testNetwork()
    if (!networkOk) {
      console.log('\n❌ Basic internet connectivity failed. Check your connection.')
      return
    }
    
    const dnsOk = await testDNS()
    if (!dnsOk) {
      console.log('\n❌ DNS resolution failed. Try using different DNS servers.')
      return
    }
    
    const httpsOk = await testHttps()
    if (!httpsOk) {
      console.log('\n❌ HTTPS connection to Supabase failed. Check firewall/proxy settings.')
      return
    }
    
    const fetchOk = await testFetch()
    if (!fetchOk) {
      console.log('\n❌ Basic fetch failed. This might be a Node.js or network configuration issue.')
      return
    }
    
    await testSupabase()
    
  } catch (error) {
    console.log('\n💥 Unexpected error during tests:', error.message)
    console.log('Stack:', error.stack)
  }
}

runAllTests()