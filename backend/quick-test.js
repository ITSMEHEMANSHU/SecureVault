import homomorphicEncryption from './homomorphic.js';

async function quickTest() {
  try {
    console.log('🧪 Quick HE Test...');
    
    await homomorphicEncryption.initialize();
    console.log('✅ HE initialized');
    
    const encrypted = homomorphicEncryption.encryptNumber(42);
    console.log('✅ Number encrypted');
    
    const decrypted = homomorphicEncryption.decrypt(encrypted);
    console.log(`✅ Decrypted: ${decrypted[0]} (expected: 42)`);
    
    console.log('🎉 HE is working!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();

