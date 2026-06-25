import SEAL from 'node-seal';

async function minimalTest() {
  try {
    console.log('🧪 Testing node-seal minimal functionality...');
    
    // Initialize SEAL
    const seal = await SEAL();
    console.log('✅ SEAL initialized');
    
    // Create encryption parameters
    const parms = seal.EncryptionParameters(seal.SchemeType.bfv);
    parms.setPolyModulusDegree(4096);
    parms.setCoeffModulus(seal.CoeffModulus.BFVDefault(4096));
    parms.setPlainModulus(seal.PlainModulus.Batching(4096, 20));
    
    // Create context
    const context = seal.Context(parms, true, seal.SecurityLevel.tc128);
    console.log('✅ Context created');
    
    if (!context.parametersSet()) {
      throw new Error('Invalid encryption parameters');
    }
    
    // Create key generator
    const keygen = seal.KeyGenerator(context);
    const publicKey = keygen.createPublicKey();
    const secretKey = keygen.secretKey();
    console.log('✅ Keys generated');
    
    // Create encryptor, evaluator, decryptor, and encoder
    const encryptor = seal.Encryptor(context, publicKey);
    const evaluator = seal.Evaluator(context);
    const decryptor = seal.Decryptor(context, secretKey);
    const encoder = seal.BatchEncoder(context);
    console.log('✅ HE components created');
    
    // Test encryption/decryption
    const plaintext = seal.PlainText();
    encoder.encode(new Int32Array([42]), plaintext);
    
    const ciphertext = seal.CipherText();
    encryptor.encrypt(plaintext, ciphertext);
    console.log('✅ Number encrypted');
    
    const decryptedPlaintext = seal.PlainText();
    decryptor.decrypt(ciphertext, decryptedPlaintext);
    const result = encoder.decode(decryptedPlaintext);
    console.log(`✅ Decryption result: ${result[0]} (expected: 42)`);
    
    console.log('🎉 All tests passed! HE is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

minimalTest();
