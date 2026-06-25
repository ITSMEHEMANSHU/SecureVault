import SEAL from 'node-seal';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

class HomomorphicEncryption {
  constructor() {
    this.seal = null;
    this.context = null;
    this.publicKey = null;
    this.secretKey = null;
    this.relinKeys = null;
    this.encryptor = null;
    this.evaluator = null;
    this.decryptor = null;
    this.encoder = null;
    this.isInitialized = false;
  }

  // ✅ ADD THIS METHOD to initialize SEAL separately
  async initializeSEAL() {
    this.seal = await SEAL();
    
    // Create encryption parameters
    const parms = this.seal.EncryptionParameters(this.seal.SchemeType.bfv);
    parms.setPolyModulusDegree(4096);
    parms.setCoeffModulus(this.seal.CoeffModulus.BFVDefault(4096));
    parms.setPlainModulus(this.seal.PlainModulus.Batching(4096, 20));
    
    // Create context
    this.context = this.seal.Context(parms, true, this.seal.SecurityLevel.tc128);
    
    if (!this.context.parametersSet()) {
      throw new Error('Invalid encryption parameters');
    }
  }

  async initialize() {
    try {
      console.log('🔐 Initializing Homomorphic Encryption...');
      
      // ✅ FIX: Initialize SEAL first
      if (!this.seal) {
        await this.initializeSEAL();
      }
      
      // Create key generator
      const keygen = this.seal.KeyGenerator(this.context);
      
      // Generate keys
      this.publicKey = keygen.createPublicKey();
      this.secretKey = keygen.secretKey();
      this.relinKeys = keygen.createRelinKeys();
      
      // Create encryptor, evaluator, decryptor, and encoder
      this.encryptor = this.seal.Encryptor(this.context, this.publicKey);
      this.evaluator = this.seal.Evaluator(this.context);
      this.decryptor = this.seal.Decryptor(this.context, this.secretKey);
      this.encoder = this.seal.BatchEncoder(this.context);
      
      this.isInitialized = true;
      console.log('✅ Homomorphic Encryption initialized successfully');
      
      // Save keys to files for persistence
      await this.saveKeys();
      
    } catch (error) {
      console.error('❌ Failed to initialize Homomorphic Encryption:', error);
      throw error;
    }
  }

  async loadKeys() {
    try {
      const keysDir = path.join(process.cwd(), 'he-keys');
      if (!fs.existsSync(keysDir)) {
        fs.mkdirSync(keysDir, { recursive: true });
        return false;
      }

      const publicKeyPath = path.join(keysDir, 'public.key');
      const secretKeyPath = path.join(keysDir, 'secret.key');
      const relinKeysPath = path.join(keysDir, 'relin.keys');

      if (fs.existsSync(publicKeyPath) && fs.existsSync(secretKeyPath) && fs.existsSync(relinKeysPath)) {
        console.log('🔑 Loading existing HE keys...');
        
        // ✅ FIX: Check if SEAL is initialized first
        if (!this.seal) {
          console.log('⚠️ SEAL not initialized, initializing first...');
          await this.initializeSEAL();
        }
        
        this.publicKey = this.seal.PublicKey();
        this.publicKey.load(this.context, fs.readFileSync(publicKeyPath));
        
        this.secretKey = this.seal.SecretKey();
        this.secretKey.load(this.context, fs.readFileSync(secretKeyPath));
        
        this.relinKeys = this.seal.RelinKeys();
        this.relinKeys.load(this.context, fs.readFileSync(relinKeysPath));
        
        // Recreate encryptor, evaluator, decryptor
        this.encryptor = this.seal.Encryptor(this.context, this.publicKey);
        this.evaluator = this.seal.Evaluator(this.context);
        this.decryptor = this.seal.Decryptor(this.context, this.secretKey);
        this.encoder = this.seal.BatchEncoder(this.context);
        
        this.isInitialized = true;
        console.log('✅ HE keys loaded successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to load HE keys:', error);
      return false;
    }
  }

  async saveKeys() {
    try {
      const keysDir = path.join(process.cwd(), 'he-keys');
      if (!fs.existsSync(keysDir)) {
        fs.mkdirSync(keysDir, { recursive: true });
      }

      const publicKeyPath = path.join(keysDir, 'public.key');
      const secretKeyPath = path.join(keysDir, 'secret.key');
      const relinKeysPath = path.join(keysDir, 'relin.keys');

      fs.writeFileSync(publicKeyPath, this.publicKey.save());
      fs.writeFileSync(secretKeyPath, this.secretKey.save());
      fs.writeFileSync(relinKeysPath, this.relinKeys.save());
      
      console.log('💾 HE keys saved successfully');
    } catch (error) {
      console.error('❌ Failed to save HE keys:', error);
    }
  }

  // Encrypt a number or array of numbers
  encryptNumber(number) {
    if (!this.isInitialized) {
      throw new Error('Homomorphic encryption not initialized');
    }

    try {
      // Convert to plaintext
      const plaintext = this.seal.PlainText();
      this.encoder.encode(new Int32Array([number]), plaintext);
      
      // Encrypt
      const ciphertext = this.seal.CipherText();
      this.encryptor.encrypt(plaintext, ciphertext);
      
      // Return serialized ciphertext
      return ciphertext.save();
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw error;
    }
  }

  // Encrypt an array of numbers (batch encryption)
  encryptArray(numbers) {
    if (!this.isInitialized) {
      throw new Error('Homomorphic encryption not initialized');
    }

    try {
      const plaintext = this.seal.PlainText();
      this.encoder.encode(new Int32Array(numbers), plaintext);
      
      const ciphertext = this.seal.CipherText();
      this.encryptor.encrypt(plaintext, ciphertext);
      
      return ciphertext.save();
    } catch (error) {
      console.error('❌ Array encryption failed:', error);
      throw error;
    }
  }

  // Decrypt a ciphertext
  decrypt(ciphertextData) {
    if (!this.isInitialized) {
      throw new Error('Homomorphic encryption not initialized');
    }

    try {
      const ciphertext = this.seal.CipherText();
      ciphertext.load(this.context, ciphertextData);
      
      const plaintext = this.seal.PlainText();
      this.decryptor.decrypt(ciphertext, plaintext);
      
      const result = this.encoder.decode(plaintext);
      return result;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw error;
    }
  }

  // Add two encrypted numbers
  addEncrypted(ciphertext1Data, ciphertext2Data) {
    if (!this.isInitialized) {
      throw new Error('Homomorphic encryption not initialized');
    }

    try {
      const ciphertext1 = this.seal.CipherText();
      const ciphertext2 = this.seal.CipherText();
      const result = this.seal.CipherText();
      
      ciphertext1.load(this.context, ciphertext1Data);
      ciphertext2.load(this.context, ciphertext2Data);
      
      this.evaluator.add(ciphertext1, ciphertext2, result);
      
      return result.save();
    } catch (error) {
      console.error('❌ Homomorphic addition failed:', error);
      throw error;
    }
  }

  // Multiply encrypted number by a plain number
  multiplyByPlain(ciphertextData, plainNumber) {
    if (!this.isInitialized) {
      throw new Error('Homomorphic encryption not initialized');
    }

    try {
      const ciphertext = this.seal.CipherText();
      const result = this.seal.CipherText();
      
      ciphertext.load(this.context, ciphertextData);
      
      const plaintext = this.seal.PlainText();
      this.encoder.encode(new Int32Array([plainNumber]), plaintext);
      
      this.evaluator.multiplyPlain(ciphertext, plaintext, result);
      
      return result.save();
    } catch (error) {
      console.error('❌ Homomorphic multiplication failed:', error);
      throw error;
    }
  }

  // Create encrypted hash for file verification
  createEncryptedHash(fileBuffer) {
    try {
      // Create SHA-256 hash
      const hash = crypto.createHash('sha256').update(fileBuffer).digest();
      
      // Convert hash to numbers (first 8 bytes for simplicity)
      const hashNumbers = [];
      for (let i = 0; i < 8; i++) {
        hashNumbers.push(hash[i]);
      }
      
      // Encrypt the hash
      return this.encryptArray(hashNumbers);
    } catch (error) {
      console.error('❌ Failed to create encrypted hash:', error);
      throw error;
    }
  }

  // Verify encrypted hash matches
  verifyEncryptedHash(encryptedHashData, fileBuffer) {
    try {
      // Create new hash from file
      const newHash = crypto.createHash('sha256').update(fileBuffer).digest();
      const newHashNumbers = [];
      for (let i = 0; i < 8; i++) {
        newHashNumbers.push(newHash[i]);
      }
      
      // Encrypt new hash
      const newEncryptedHash = this.encryptArray(newHashNumbers);
      
      // Subtract the hashes (should be zero if they match)
      const difference = this.addEncrypted(encryptedHashData, this.multiplyByPlain(newEncryptedHash, -1));
      
      // Decrypt and check if result is zero
      const result = this.decrypt(difference);
      
      // Check if all values are zero (or close to zero due to noise)
      const isMatch = result.every(val => Math.abs(val) < 1);
      
      return isMatch;
    } catch (error) {
      console.error('❌ Failed to verify encrypted hash:', error);
      return false;
    }
  }

  // Encrypt file metadata for search
  encryptMetadata(metadata) {
    try {
      const metadataString = JSON.stringify(metadata);
      const metadataBytes = Buffer.from(metadataString, 'utf8');
      
      // Convert to numbers (first 32 bytes for simplicity)
      const numbers = [];
      for (let i = 0; i < Math.min(32, metadataBytes.length); i++) {
        numbers.push(metadataBytes[i]);
      }
      
      // Pad with zeros if needed
      while (numbers.length < 32) {
        numbers.push(0);
      }
      
      return this.encryptArray(numbers);
    } catch (error) {
      console.error('❌ Failed to encrypt metadata:', error);
      throw error;
    }
  }

  // Search encrypted metadata (simplified - checks if encrypted query matches)
  searchEncryptedMetadata(encryptedMetadata, query) {
    try {
      // Encrypt the query
      const queryBytes = Buffer.from(query, 'utf8');
      const queryNumbers = [];
      for (let i = 0; i < Math.min(32, queryBytes.length); i++) {
        queryNumbers.push(queryBytes[i]);
      }
      while (queryNumbers.length < 32) {
        queryNumbers.push(0);
      }
      
      const encryptedQuery = this.encryptArray(queryNumbers);
      
      // Calculate difference
      const difference = this.addEncrypted(encryptedMetadata, this.multiplyByPlain(encryptedQuery, -1));
      
      // Decrypt and check similarity
      const result = this.decrypt(difference);
      const similarity = result.reduce((sum, val) => sum + Math.abs(val), 0);
      
      // Return similarity score (lower is more similar)
      return similarity < 100; // Threshold for match
    } catch (error) {
      console.error('❌ Failed to search encrypted metadata:', error);
      return false;
    }
  }

  // Get public key for client-side encryption
  getPublicKey() {
    if (!this.isInitialized) {
      throw new Error('Homomorphic encryption not initialized');
    }
    return this.publicKey.save();
  }

  // Get encryption parameters for client-side operations
  // Get encryption parameters for client-side operations
// Get encryption parameters for client-side operations
getEncryptionParameters() {
  if (!this.isInitialized) {
    throw new Error('Homomorphic encryption not initialized');
  }
  
  // ✅ SIMPLE FIX: Return basic parameter info without using this.context.save()
  return {
    schemeType: 'BFV',
    polyModulusDegree: 4096,
    securityLevel: 'tc128',
    status: 'initialized',
    timestamp: new Date().toISOString()
  };
}
}

// Create singleton instance
const homomorphicEncryption = new HomomorphicEncryption();

export default homomorphicEncryption;