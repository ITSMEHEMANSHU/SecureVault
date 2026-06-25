import homomorphicEncryption from './homomorphic.js';
import { supabase } from './lib/supabaseClient.js';

class EncryptedSearch {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔍 Initializing Encrypted Search...');
      
      // Initialize homomorphic encryption if not already done
      if (!homomorphicEncryption.isInitialized) {
        const keysLoaded = await homomorphicEncryption.loadKeys();
        if (!keysLoaded) {
          await homomorphicEncryption.initialize();
        }
      }
      
      this.isInitialized = true;
      console.log('✅ Encrypted Search initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Encrypted Search:', error);
      throw error;
    }
  }

  // Create encrypted search index for a file
 async createSearchIndex(fileId, fileName, fileContent) {
  try {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`🔍 Creating search index for file: ${fileName}`);

    // Extract keywords from filename and content (first 1000 chars)
    const keywords = this.extractKeywords(fileName, fileContent);
    
    // Encrypt each keyword
    const encryptedKeywords = keywords.map(keyword => ({
      keyword: keyword,
      encrypted: homomorphicEncryption.encryptMetadata(keyword)
    }));

    // Store encrypted search index in database
    const { data, error } = await supabase
      .from('encrypted_search_index')
      .insert({
        file_id: fileId,
        encrypted_keywords: encryptedKeywords,
        created_at: new Date().toISOString()
      })
      .select(); // ← Add .select() to return the inserted data

    if (error) {
      console.error('❌ Failed to store search index:', error);
      throw error;
    }

    // Add null check
    if (!data || data.length === 0) {
      console.log(`✅ Search index created for file: ${fileName} (no data returned)`);
      return { file_id: fileId, encrypted_keywords: encryptedKeywords };
    }

    console.log(`✅ Search index created for file: ${fileName}`);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to create search index:', error);
    throw error;
  }
}

  // Extract keywords from filename and content
  extractKeywords(fileName, content) {
    const keywords = new Set();
    
    // Add filename words
    const fileNameWords = fileName.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    fileNameWords.forEach(word => keywords.add(word));
    
    // Add content keywords (first 1000 characters)
    if (content && content.length > 0) {
      const contentWords = content.toString().toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 50); // Limit to first 50 words
      
      contentWords.forEach(word => keywords.add(word));
    }
    
    return Array.from(keywords);
  }

  // Search encrypted files
  async searchEncryptedFiles(query, userId = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔍 Searching encrypted files for: "${query}"`);

      // Get all encrypted search indices
      let queryBuilder = supabase
        .from('encrypted_search_index')
        .select(`
          file_id,
          encrypted_keywords,
          files!inner(
            id,
            name,
            user_id,
            cid,
            size,
            uploaded_at
          )
        `);

      if (userId) {
        queryBuilder = queryBuilder.eq('files.user_id', userId);
      }

      const { data: searchIndices, error } = await queryBuilder;

      if (error) {
        console.error('❌ Failed to fetch search indices:', error);
        throw error;
      }

      if (!searchIndices || searchIndices.length === 0) {
        return [];
      }

      // Search through encrypted keywords
      const matchingFiles = [];
      
      for (const index of searchIndices) {
        const encryptedKeywords = index.encrypted_keywords;
        
        for (const keywordData of encryptedKeywords) {
          const isMatch = homomorphicEncryption.searchEncryptedMetadata(
            keywordData.encrypted,
            query.toLowerCase()
          );
          
          if (isMatch) {
            matchingFiles.push({
              fileId: index.file_id,
              fileName: index.files.name,
              cid: index.files.cid,
              size: index.files.size,
              uploadedAt: index.files.uploaded_at,
              matchType: 'keyword',
              matchedKeyword: keywordData.keyword
            });
            break; // Found a match, no need to check other keywords for this file
          }
        }
      }

      console.log(`✅ Found ${matchingFiles.length} matching files`);
      return matchingFiles;
    } catch (error) {
      console.error('❌ Encrypted search failed:', error);
      throw error;
    }
  }

  // Create encrypted file hash for integrity verification
  async createEncryptedFileHash(fileId, fileBuffer) {
  try {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`🔐 Creating encrypted hash for file: ${fileId}`);

    // Create encrypted hash
    const encryptedHash = homomorphicEncryption.createEncryptedHash(fileBuffer);

    // Store encrypted hash in database
    const { data, error } = await supabase
      .from('encrypted_file_hashes')
      .insert({
        file_id: fileId,
        encrypted_hash: encryptedHash,
        created_at: new Date().toISOString()
      })
      .select(); // ← Add .select() to return the inserted data

    if (error) {
      console.error('❌ Failed to store encrypted hash:', error);
      throw error;
    }

    // Add null check
    if (!data || data.length === 0) {
      console.log(`✅ Encrypted hash created for file: ${fileId} (no data returned)`);
      return { file_id: fileId, encrypted_hash: encryptedHash };
    }

    console.log(`✅ Encrypted hash created for file: ${fileId}`);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to create encrypted file hash:', error);
    throw error;
  }
}

  // Verify file integrity using encrypted hash
  async verifyFileIntegrity(fileId, fileBuffer) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔍 Verifying file integrity for: ${fileId}`);

      // Get encrypted hash from database
      const { data: hashData, error } = await supabase
        .from('encrypted_file_hashes')
        .select('encrypted_hash')
        .eq('file_id', fileId)
        .single();

      if (error || !hashData) {
        console.error('❌ Encrypted hash not found:', error);
        return false;
      }

      // Verify using homomorphic encryption
      const isValid = homomorphicEncryption.verifyEncryptedHash(
        hashData.encrypted_hash,
        fileBuffer
      );

      console.log(`✅ File integrity verification result: ${isValid}`);
      return isValid;
    } catch (error) {
      console.error('❌ Failed to verify file integrity:', error);
      return false;
    }
  }

  // Batch process files for encrypted operations
  async batchProcessFiles(fileIds, operation) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔄 Batch processing ${fileIds.length} files for operation: ${operation}`);

      const results = [];
      
      for (const fileId of fileIds) {
        try {
          // Get file data
          const { data: fileData, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single();

          if (fileError || !fileData) {
            results.push({ fileId, success: false, error: 'File not found' });
            continue;
          }

          // Perform operation based on type
          let result;
          switch (operation) {
            case 'create_search_index':
              result = await this.createSearchIndex(fileId, fileData.name, '');
              break;
            case 'verify_integrity':
              // This would require downloading the file first
              result = { message: 'Integrity verification requires file download' };
              break;
            default:
              result = { message: 'Unknown operation' };
          }

          results.push({ fileId, success: true, result });
        } catch (error) {
          results.push({ fileId, success: false, error: error.message });
        }
      }

      console.log(`✅ Batch processing completed: ${results.filter(r => r.success).length}/${fileIds.length} successful`);
      return results;
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      throw error;
    }
  }

  // Get search statistics
  async getSearchStats() {
    try {
      const { data: indexCount, error: indexError } = await supabase
        .from('encrypted_search_index')
        .select('id', { count: 'exact' });

      const { data: hashCount, error: hashError } = await supabase
        .from('encrypted_file_hashes')
        .select('id', { count: 'exact' });

      return {
        indexedFiles: indexCount?.length || 0,
        hashedFiles: hashCount?.length || 0,
        errors: {
          indexError: indexError?.message,
          hashError: hashError?.message
        }
      };
    } catch (error) {
      console.error('❌ Failed to get search stats:', error);
      return { indexedFiles: 0, hashedFiles: 0, errors: { general: error.message } };
    }
  }
}

// Create singleton instance
const encryptedSearch = new EncryptedSearch();

export default encryptedSearch;

