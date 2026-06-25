import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const VoiceCommandContext = createContext();

export const useVoiceCommand = () => {
  const context = useContext(VoiceCommandContext);
  if (!context) {
    throw new Error('useVoiceCommand must be used within VoiceCommandProvider');
  }
  return context;
};

export const VoiceCommandProvider = ({ children }) => {
  const [showVoiceCommand, setShowVoiceCommand] = useState(false);
  const [isVoiceTriggered, setIsVoiceTriggered] = useState(false);
  const [voiceSelectedFiles, setVoiceSelectedFiles] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const voiceTriggerRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    voiceTriggerRef.current = isVoiceTriggered;
  }, [isVoiceTriggered]);

  // Open voice command modal
  const openVoiceCommand = useCallback(() => {
    console.log('🎤 Opening voice command modal');
    setShowVoiceCommand(true);
    setIsVoiceTriggered(false);
    setIsProcessing(false);
  }, []);

  // Close voice command modal with cleanup
  const closeVoiceCommand = useCallback(() => {
    console.log('🎤 Closing voice command modal');
    setShowVoiceCommand(false);
    // Don't reset isVoiceTriggered immediately - let file selection complete
    setIsProcessing(false);
  }, []);

  // Trigger file selection from voice command
const triggerVoiceFileSelection = useCallback(() => {
  if (isProcessing) {
    console.log('🔄 Voice command already processing, skipping...');
    return;
  }

  console.log('🎤 Voice command: Triggering file selection');
  setIsProcessing(true);
  setIsVoiceTriggered(true);
  
  // Don't close modal here - let VoiceUploadTrigger handle it
  console.log('📁 Voice trigger set to TRUE');
}, [isProcessing]);

  // Handle files selected via voice
  const handleVoiceFilesReady = useCallback((files) => {
    console.log(`🎤 Voice files ready: ${files.length} files`);
    setVoiceSelectedFiles(files);
    setIsVoiceTriggered(false);
    setIsProcessing(false);
    
    // Close modal after successful file selection
    setTimeout(() => {
      closeVoiceCommand();
    }, 1000);
  }, [closeVoiceCommand]);

  // Clear voice files after use
  const clearVoiceFiles = useCallback(() => {
    console.log('🎤 Clearing voice files');
    setVoiceSelectedFiles(null);
    setIsVoiceTriggered(false);
    setIsProcessing(false);
  }, []);

  // Reset voice trigger state
  const resetVoiceTrigger = useCallback(() => {
    console.log('🎤 Resetting voice trigger');
    setIsVoiceTriggered(false);
    setIsProcessing(false);
  }, []);

  // Process voice commands centrally
  const processVoiceCommand = useCallback((command, data = null) => {
    console.log('🎤 Central voice command processing:', command, data);
    
    if (isProcessing) {
      console.log('🔄 Command processing in progress, skipping...');
      return false;
    }

    setIsProcessing(true);

    try {
      const normalizedCommand = command.toLowerCase().trim();
      
      // File upload commands
      if (normalizedCommand.includes('upload') || 
          normalizedCommand.includes('add files') || 
          normalizedCommand.includes('select files') ||
          normalizedCommand.includes('browse files')) {
        console.log('📁 Processing file upload command:', normalizedCommand);
        triggerVoiceFileSelection();
        return true;
      }

      // Navigation commands - close modal immediately
      const navigationCommands = [
        'open upload', 'go to dashboard', 'view my files', 
        'open profile', 'open settings', 'help', 'search'
      ];
      
      if (navigationCommands.includes(normalizedCommand)) {
        console.log(`🔧 Navigation command "${command}" processed`);
        setTimeout(() => {
          closeVoiceCommand();
        }, 500);
        return command;
      }

      console.log('❓ Unknown command:', command);
      setIsProcessing(false);
      return false;

    } catch (error) {
      console.error('❌ Error processing voice command:', error);
      setIsProcessing(false);
      return false;
    }
  }, [closeVoiceCommand, triggerVoiceFileSelection, isProcessing]);

  // Auto-reset if voice trigger stays active too long without file selection
  useEffect(() => {
    let timeoutId;
    
    if (isVoiceTriggered && !voiceSelectedFiles) {
      timeoutId = setTimeout(() => {
        console.log('⏰ Auto-resetting voice trigger due to timeout (no file selection)');
        resetVoiceTrigger();
        closeVoiceCommand();
      }, 15000); // 15 seconds timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVoiceTriggered, voiceSelectedFiles, resetVoiceTrigger, closeVoiceCommand]);

  const contextValue = {
    // State
    showVoiceCommand,
    isVoiceTriggered,
    voiceSelectedFiles,
    isProcessing,
    
    // State setters
    setShowVoiceCommand,
    setIsVoiceTriggered,
    setVoiceSelectedFiles,
    
    // Actions
    openVoiceCommand,
    closeVoiceCommand,
    triggerVoiceFileSelection,
    handleVoiceFilesReady,
    clearVoiceFiles,
    resetVoiceTrigger,
    processVoiceCommand
  };

  return (
    <VoiceCommandContext.Provider value={contextValue}>
      {children}
    </VoiceCommandContext.Provider>
  );
};