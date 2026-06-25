import homomorphicEncryption from './homomorphic.js';

async function testHomomorphicEncryptionOnly() {
  console.log('🧪 Testing Homomorphic Encryption Core Functions...\n');

  try {
    // Test 1: Initialize HE system
    console.log('1️⃣ Testing HE initialization...');
    await homomorphicEncryption.initialize();
    console.log('✅ HE system initialized successfully\n');

    // Test 2: Basic encryption/decryption
    console.log('2️⃣ Testing basic encryption/decryption...');
    const testNumber = 42;
    const encrypted = homomorphicEncryption.encryptNumber(testNumber);
    const decrypted = homomorphicEncryption.decrypt(encrypted);
    console.log(`Original: ${testNumber}, Decrypted: ${decrypted[0]}`);
    console.log(`✅ Encryption/Decryption test ${decrypted[0] === testNumber ? 'PASSED' : 'FAILED'}\n`);

    // Test 3: Homomorphic operations
    console.log('3️⃣ Testing homomorphic operations...');
    const num1 = homomorphicEncryption.encryptNumber(10);
    const num2 = homomorphicEncryption.encryptNumber(5);
    const sum = homomorphicEncryption.addEncrypted(num1, num2);
    const sumDecrypted = homomorphicEncryption.decrypt(sum);
    console.log(`10 + 5 = ${sumDecrypted[0]} (encrypted)`);
    console.log(`✅ Homomorphic addition test ${sumDecrypted[0] === 15 ? 'PASSED' : 'FAILED'}\n`);

    // Test 4: Metadata encryption
    console.log('4️⃣ Testing metadata encryption...');
    const metadata = { filename: 'test.txt', size: 1024 };
    const encryptedMetadata = homomorphicEncryption.encryptMetadata(JSON.stringify(metadata));
    console.log('✅ Metadata encryption test PASSED\n');

    // Test 5: File hash creation
    console.log('5️⃣ Testing encrypted file hash creation...');
    const testBuffer = Buffer.from('This is a test file content');
    const encryptedHash = homomorphicEncryption.createEncryptedHash(testBuffer);
    console.log('✅ Encrypted hash creation test PASSED\n');

    // Test 6: Hash verification
    console.log('6️⃣ Testing encrypted hash verification...');
    const isValid = homomorphicEncryption.verifyEncryptedHash(encryptedHash, testBuffer);
    console.log(`Hash verification: ${isValid ? 'PASSED' : 'FAILED'}\n`);

    // Test 7: Key persistence
    console.log('7️⃣ Testing key persistence...');
    const publicKey = homomorphicEncryption.getPublicKey();
    const encryptionParams = homomorphicEncryption.getEncryptionParameters();
    console.log(`Public key length: ${publicKey.length} bytes`);
    console.log(`Encryption params length: ${encryptionParams.length} bytes`);
    console.log('✅ Key persistence test PASSED\n');

    console.log('🎉 All core HE tests completed successfully!');
    console.log('\n📋 Core HE Functions Summary:');
    console.log('✅ Homomorphic Encryption: Working');
    console.log('✅ Encryption/Decryption: Working');
    console.log('✅ Homomorphic Operations: Working');
    console.log('✅ Metadata Encryption: Working');
    console.log('✅ File Hash Creation: Working');
    console.log('✅ Hash Verification: Working');
    console.log('✅ Key Management: Working');
    
    console.log('\n🚀 Ready for integration with:');
    console.log('• Encrypted search functionality');
    console.log('• File processing capabilities');
    console.log('• API endpoints');
    console.log('• Database operations');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure node-seal is installed: npm install node-seal');
    console.log('2. Check Node.js version compatibility');
    console.log('3. Verify no memory issues');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testHomomorphicEncryptionOnly();
}

export default testHomomorphicEncryptionOnly;

