import express from 'express';
import homomorphicEncryption from '../homomorphic.js';
import encryptedSearch from '../encryptedSearch.js';
import encryptedFileProcessor from '../encryptedFileProcessor.js';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

// Initialize HE system on startup
let heInitialized = false;
const initializeHE = async () => {
  if (!heInitialized) {
    try {
      await homomorphicEncryption.loadKeys();
      if (!homomorphicEncryption.isInitialized) {
        await homomorphicEncryption.initialize();
      }
      await encryptedSearch.initialize();
      await encryptedFileProcessor.initialize();
      heInitialized = true;
      console.log('✅ Homomorphic Encryption system fully initialized');
    } catch (error) {
      console.error('❌ Failed to initialize HE system:', error);
    }
  }
};

// Initialize on module load
initializeHE();

// Get HE system status
router.get('/status', async (req, res) => {
  try {
    const status = {
      homomorphicEncryption: homomorphicEncryption.isInitialized,
      encryptedSearch: encryptedSearch.isInitialized,
      encryptedFileProcessor: encryptedFileProcessor.isInitialized,
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, status });
  } catch (error) {
    console.error('❌ Failed to get HE status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get public key for client-side operations
router.get('/public-key', async (req, res) => {
  try {
    await initializeHE();
    
    const publicKey = homomorphicEncryption.getPublicKey();
    const encryptionParams = homomorphicEncryption.getEncryptionParameters();
    
    res.json({
      success: true,
      publicKey,
      encryptionParams,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get public key:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Encrypted search endpoints
router.post('/search', async (req, res) => {
  try {
    await initializeHE();
    
    const { query, userId } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    console.log(`🔍 Encrypted search request: "${query}" for user: ${userId || 'all'}`);
    
    const results = await encryptedSearch.searchEncryptedFiles(query, userId);
    
    res.json({
      success: true,
      query,
      results,
      resultCount: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Encrypted search failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create search index for a file
router.post('/search/index/:fileId', async (req, res) => {
  try {
    await initializeHE();
    
    const { fileId } = req.params;
    const { fileName, fileContent } = req.body;
    
    console.log(`🔍 Creating search index for file: ${fileId}`);
    
    const result = await encryptedSearch.createSearchIndex(fileId, fileName || '', fileContent || '');
    
    res.json({
      success: true,
      fileId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to create search index:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get search statistics
router.get('/search/stats', async (req, res) => {
  try {
    await initializeHE();
    
    const stats = await encryptedSearch.getSearchStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get search stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// File processing endpoints
router.post('/process/:fileId', async (req, res) => {
  try {
    await initializeHE();
    
    const { fileId } = req.params;
    const { operation, parameters } = req.body;
    
    if (!operation) {
      return res.status(400).json({ success: false, error: 'Operation is required' });
    }

    console.log(`⚙️ Processing file ${fileId} with operation: ${operation}`);
    
    const result = await encryptedFileProcessor.processEncryptedFile(fileId, operation, parameters || {});
    
    res.json({
      success: true,
      fileId,
      operation,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ File processing failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch process files
router.post('/process/batch', async (req, res) => {
  try {
    await initializeHE();
    
    const { fileIds, operation, parameters } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ success: false, error: 'File IDs array is required' });
    }
    
    if (!operation) {
      return res.status(400).json({ success: false, error: 'Operation is required' });
    }

    console.log(`🔄 Batch processing ${fileIds.length} files for operation: ${operation}`);
    
    const results = await encryptedFileProcessor.batchProcessFiles(fileIds, operation, parameters || {});
    
    res.json({
      success: true,
      operation,
      results,
      successCount: results.filter(r => r.success).length,
      totalCount: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Batch processing failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get processing history for a file
router.get('/process/history/:fileId', async (req, res) => {
  try {
    await initializeHE();
    
    const { fileId } = req.params;
    
    const history = await encryptedFileProcessor.getProcessingHistory(fileId);
    
    res.json({
      success: true,
      fileId,
      history,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get processing history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create encrypted file hash
router.post('/hash/:fileId', async (req, res) => {
  try {
    await initializeHE();
    
    const { fileId } = req.params;
    const { fileBuffer } = req.body;
    
    if (!fileBuffer) {
      return res.status(400).json({ success: false, error: 'File buffer is required' });
    }

    console.log(`🔐 Creating encrypted hash for file: ${fileId}`);
    
    const result = await encryptedSearch.createEncryptedFileHash(fileId, Buffer.from(fileBuffer, 'base64'));
    
    res.json({
      success: true,
      fileId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to create encrypted hash:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify file integrity
router.post('/verify/:fileId', async (req, res) => {
  try {
    await initializeHE();
    
    const { fileId } = req.params;
    const { fileBuffer } = req.body;
    
    if (!fileBuffer) {
      return res.status(400).json({ success: false, error: 'File buffer is required' });
    }

    console.log(`🔍 Verifying file integrity for: ${fileId}`);
    
    const isValid = await encryptedSearch.verifyFileIntegrity(fileId, Buffer.from(fileBuffer, 'base64'));
    
    res.json({
      success: true,
      fileId,
      isValid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ File integrity verification failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Homomorphic encryption operations
router.post('/encrypt', async (req, res) => {
  try {
    await initializeHE();
    
    const { data, type = 'number' } = req.body;
    
    if (data === undefined) {
      return res.status(400).json({ success: false, error: 'Data is required' });
    }

    let encryptedData;
    if (type === 'array' && Array.isArray(data)) {
      encryptedData = homomorphicEncryption.encryptArray(data);
    } else if (typeof data === 'number') {
      encryptedData = homomorphicEncryption.encryptNumber(data);
    } else {
      encryptedData = homomorphicEncryption.encryptMetadata(JSON.stringify(data));
    }
    
    res.json({
      success: true,
      encryptedData,
      type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/decrypt', async (req, res) => {
  try {
    await initializeHE();
    
    const { encryptedData } = req.body;
    
    if (!encryptedData) {
      return res.status(400).json({ success: false, error: 'Encrypted data is required' });
    }

    const decryptedData = homomorphicEncryption.decrypt(encryptedData);
    
    res.json({
      success: true,
      decryptedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Homomorphic operations
router.post('/add', async (req, res) => {
  try {
    await initializeHE();
    
    const { ciphertext1, ciphertext2 } = req.body;
    
    if (!ciphertext1 || !ciphertext2) {
      return res.status(400).json({ success: false, error: 'Both ciphertexts are required' });
    }

    const result = homomorphicEncryption.addEncrypted(ciphertext1, ciphertext2);
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Homomorphic addition failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/multiply', async (req, res) => {
  try {
    await initializeHE();
    
    const { ciphertext, plainNumber } = req.body;
    
    if (!ciphertext || plainNumber === undefined) {
      return res.status(400).json({ success: false, error: 'Ciphertext and plain number are required' });
    }

    const result = homomorphicEncryption.multiplyByPlain(ciphertext, plainNumber);
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Homomorphic multiplication failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all files with HE capabilities
router.get('/files/:userId', async (req, res) => {
  try {
    await initializeHE();
    
    const { userId } = req.params;
    
    const { data: files, error } = await supabase
      .from('files')
      .select(`
        *,
        encrypted_search_index(id, encrypted_keywords),
        encrypted_file_hashes(id, encrypted_hash),
        file_processing_results(id, operation, processed_at)
      `)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Add HE capabilities info to each file
    const filesWithHE = files.map(file => ({
      ...file,
      heCapabilities: {
        hasSearchIndex: file.encrypted_search_index && file.encrypted_search_index.length > 0,
        hasEncryptedHash: file.encrypted_file_hashes && file.encrypted_file_hashes.length > 0,
        processingHistory: file.file_processing_results || []
      }
    }));

    res.json({
      success: true,
      files: filesWithHE,
      count: filesWithHE.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to fetch files with HE info:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
