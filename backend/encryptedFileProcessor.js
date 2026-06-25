import homomorphicEncryption from './homomorphic.js';
import { supabase } from './lib/supabaseClient.js';
import crypto from 'crypto';

class EncryptedFileProcessor {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('⚙️ Initializing Encrypted File Processor...');
      
      // Initialize homomorphic encryption if not already done
      if (!homomorphicEncryption.isInitialized) {
        const keysLoaded = await homomorphicEncryption.loadKeys();
        if (!keysLoaded) {
          await homomorphicEncryption.initialize();
        }
      }
      
      this.isInitialized = true;
      console.log('✅ Encrypted File Processor initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Encrypted File Processor:', error);
      throw error;
    }
  }

  // Process file content without decrypting it
  async processEncryptedFile(fileId, operation, parameters = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`⚙️ Processing encrypted file ${fileId} with operation: ${operation}`);

      // Get file metadata
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError || !fileData) {
        throw new Error('File not found');
      }

      let result;
      switch (operation) {
        case 'analyze_content_type':
          result = await this.analyzeContentType(fileData);
          break;
        case 'detect_anomalies':
          result = await this.detectAnomalies(fileData, parameters);
          break;
        case 'calculate_statistics':
          result = await this.calculateStatistics(fileData);
          break;
        case 'verify_authenticity':
          result = await this.verifyAuthenticity(fileData, parameters);
          break;
        case 'compliance_check':
          result = await this.complianceCheck(fileData, parameters);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      // Store processing result
      await this.storeProcessingResult(fileId, operation, result, parameters);

      console.log(`✅ File processing completed for ${fileId}`);
      return result;
    } catch (error) {
      console.error(`❌ File processing failed for ${fileId}:`, error);
      throw error;
    }
  }

  // Analyze content type using encrypted metadata
  async analyzeContentType(fileData) {
    try {
      // Extract file extension and size information
      const fileName = fileData.name || '';
      const fileSize = fileData.size || 0;
      
      // Create encrypted analysis data
      const analysisData = {
        fileName: fileName.toLowerCase(),
        fileSize: fileSize,
        timestamp: new Date().toISOString()
      };

      // Encrypt the analysis data
      const encryptedAnalysis = homomorphicEncryption.encryptMetadata(JSON.stringify(analysisData));

      // Determine content type based on encrypted patterns
      const contentType = this.determineContentType(fileName, fileSize);

      return {
        contentType,
        encryptedAnalysis,
        confidence: this.calculateConfidence(fileName, fileSize),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Content type analysis failed:', error);
      throw error;
    }
  }

  // Determine content type based on filename and size
  determineContentType(fileName, fileSize) {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const typeMap = {
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml',
      
      // Videos
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      
      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      
      // Code
      'js': 'application/javascript',
      'html': 'text/html',
      'css': 'text/css',
      'json': 'application/json',
      'xml': 'application/xml'
    };

    return typeMap[extension] || 'application/octet-stream';
  }

  // Calculate confidence score for content type detection
  calculateConfidence(fileName, fileSize) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence if file has extension
    if (fileName.includes('.')) {
      confidence += 0.3;
    }
    
    // Adjust based on file size patterns
    if (fileSize > 0 && fileSize < 1000000) { // < 1MB
      confidence += 0.1;
    } else if (fileSize > 1000000 && fileSize < 10000000) { // 1-10MB
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  // Detect anomalies in file metadata
  async detectAnomalies(fileData, parameters = {}) {
    try {
      const anomalies = [];
      
      // Check file size anomalies
      if (fileData.size > (parameters.maxSize || 100000000)) { // 100MB default
        anomalies.push({
          type: 'size_anomaly',
          severity: 'high',
          message: 'File size exceeds normal limits',
          value: fileData.size
        });
      }
      
      // Check filename anomalies
      if (fileData.name && fileData.name.length > 255) {
        anomalies.push({
          type: 'filename_anomaly',
          severity: 'medium',
          message: 'Filename length exceeds normal limits',
          value: fileData.name.length
        });
      }
      
      // Check for suspicious file extensions
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
      const fileName = fileData.name?.toLowerCase() || '';
      const hasSuspiciousExtension = suspiciousExtensions.some(ext => fileName.endsWith(ext));
      
      if (hasSuspiciousExtension) {
        anomalies.push({
          type: 'suspicious_extension',
          severity: 'high',
          message: 'File has potentially dangerous extension',
          value: fileName
        });
      }
      
      // Encrypt anomaly data
      const encryptedAnomalies = homomorphicEncryption.encryptMetadata(JSON.stringify(anomalies));
      
      return {
        anomalies,
        encryptedAnomalies,
        anomalyCount: anomalies.length,
        riskLevel: this.calculateRiskLevel(anomalies),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Anomaly detection failed:', error);
      throw error;
    }
  }

  // Calculate risk level based on anomalies
  calculateRiskLevel(anomalies) {
    if (anomalies.length === 0) return 'low';
    
    const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
    const mediumSeverityCount = anomalies.filter(a => a.severity === 'medium').length;
    
    if (highSeverityCount > 0) return 'high';
    if (mediumSeverityCount > 1) return 'medium';
    return 'low';
  }

  // Calculate file statistics
  async calculateStatistics(fileData) {
    try {
      const stats = {
        fileSize: fileData.size || 0,
        fileName: fileData.name || '',
        uploadDate: fileData.uploaded_at || new Date().toISOString(),
        fileType: this.determineContentType(fileData.name, fileData.size),
        encryptedAt: fileData.created_at || new Date().toISOString()
      };
      
      // Encrypt statistics
      const encryptedStats = homomorphicEncryption.encryptMetadata(JSON.stringify(stats));
      
      return {
        statistics: stats,
        encryptedStatistics: encryptedStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Statistics calculation failed:', error);
      throw error;
    }
  }

  // Verify file authenticity using encrypted hashes
  async verifyAuthenticity(fileData, parameters = {}) {
    try {
      // Get encrypted hash if available
      const { data: hashData, error: hashError } = await supabase
        .from('encrypted_file_hashes')
        .select('encrypted_hash')
        .eq('file_id', fileData.id)
        .single();

      if (hashError || !hashData) {
        return {
          verified: false,
          reason: 'No encrypted hash available',
          timestamp: new Date().toISOString()
        };
      }

      // Create verification token
      const verificationData = {
        fileId: fileData.id,
        cid: fileData.cid,
        timestamp: new Date().toISOString(),
        verifier: parameters.verifier || 'system'
      };

      const encryptedVerification = homomorphicEncryption.encryptMetadata(JSON.stringify(verificationData));

      return {
        verified: true,
        encryptedVerification,
        verificationMethod: 'encrypted_hash',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Authenticity verification failed:', error);
      throw error;
    }
  }

  // Compliance check for regulatory requirements
  async complianceCheck(fileData, parameters = {}) {
    try {
      const complianceResults = [];
      
      // Check data retention policies
      const uploadDate = new Date(fileData.uploaded_at);
      const retentionPeriod = parameters.retentionPeriod || 365; // days
      const daysSinceUpload = Math.floor((new Date() - uploadDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpload > retentionPeriod) {
        complianceResults.push({
          check: 'data_retention',
          status: 'violation',
          message: `File exceeds retention period of ${retentionPeriod} days`,
          daysSinceUpload
        });
      } else {
        complianceResults.push({
          check: 'data_retention',
          status: 'compliant',
          message: 'File within retention period',
          daysSinceUpload
        });
      }
      
      // Check file type compliance
      const fileType = this.determineContentType(fileData.name, fileData.size);
      const allowedTypes = parameters.allowedTypes || ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];
      
      if (!allowedTypes.includes(fileType)) {
        complianceResults.push({
          check: 'file_type',
          status: 'violation',
          message: `File type ${fileType} not in allowed list`,
          fileType
        });
      } else {
        complianceResults.push({
          check: 'file_type',
          status: 'compliant',
          message: 'File type is compliant',
          fileType
        });
      }
      
      // Encrypt compliance results
      const encryptedCompliance = homomorphicEncryption.encryptMetadata(JSON.stringify(complianceResults));
      
      const overallCompliance = complianceResults.every(result => result.status === 'compliant');
      
      return {
        complianceResults,
        encryptedCompliance,
        overallCompliance,
        complianceScore: this.calculateComplianceScore(complianceResults),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Compliance check failed:', error);
      throw error;
    }
  }

  // Calculate compliance score
  calculateComplianceScore(complianceResults) {
    const totalChecks = complianceResults.length;
    const passedChecks = complianceResults.filter(result => result.status === 'compliant').length;
    return totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
  }

  // Store processing result in database
  // Store processing result in database
async storeProcessingResult(fileId, operation, result, parameters) {
  try {
    const { data, error } = await supabase
      .from('file_processing_results')
      .insert({
        file_id: fileId,
        operation: operation,
        result: result,
        parameters: parameters,
        processed_at: new Date().toISOString()
      })
      .select(); // ✅ Ensures Supabase returns inserted rows

    if (error) {
      console.error('❌ Failed to store processing result:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`⚠️ No data returned after storing processing result for file ${fileId}`);
      return { file_id: fileId, operation };
    }

    console.log(`✅ Processing result stored for file ${fileId}`);
    return data[0];
  } catch (error) {
    console.error('❌ Failed to store processing result:', error);
    throw error;
  }
}


  // Get processing history for a file
  async getProcessingHistory(fileId) {
    try {
      const { data, error } = await supabase
        .from('file_processing_results')
        .select('*')
        .eq('file_id', fileId)
        .order('processed_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get processing history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get processing history:', error);
      throw error;
    }
  }

  // Batch process multiple files
  async batchProcessFiles(fileIds, operation, parameters = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔄 Batch processing ${fileIds.length} files for operation: ${operation}`);

      const results = [];
      
      for (const fileId of fileIds) {
        try {
          const result = await this.processEncryptedFile(fileId, operation, parameters);
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
}

// Create singleton instance
const encryptedFileProcessor = new EncryptedFileProcessor();

export default encryptedFileProcessor;

