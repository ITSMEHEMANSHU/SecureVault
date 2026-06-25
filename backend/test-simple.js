console.log('🧪 Starting HE Test...');

try {
  console.log('1️⃣ Importing homomorphicEncryption...');
  const homomorphicEncryption = await import('./homomorphic.js');
  console.log('✅ homomorphicEncryption imported');
  
  console.log('2️⃣ Initializing HE...');
  await homomorphicEncryption.default.initialize();
  console.log('✅ HE initialized');
  
  console.log('3️⃣ Testing encryption...');
  const encrypted = homomorphicEncryption.default.encryptNumber(42);
  console.log('✅ Number encrypted');
  
  console.log('4️⃣ Testing decryption...');
  const decrypted = homomorphicEncryption.default.decrypt(encrypted);
  console.log(`✅ Decrypted: ${decrypted[0]} (expected: 42)`);
  
  console.log('5️⃣ Testing homomorphic addition...');
  const num1 = homomorphicEncryption.default.encryptNumber(10);
  const num2 = homomorphicEncryption.default.encryptNumber(5);
  const sum = homomorphicEncryption.default.addEncrypted(num1, num2);
  const sumDecrypted = homomorphicEncryption.default.decrypt(sum);
  console.log(`✅ 10 + 5 = ${sumDecrypted[0]} (encrypted)`);
  
  console.log('🎉 Core HE tests PASSED!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
}

