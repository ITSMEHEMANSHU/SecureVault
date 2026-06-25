// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useTheme } from '../../contexts/ThemeContext';
// import { useNavigate } from 'react-router-dom';
// import { Mic, MicOff, Upload, Search, User, Settings, X, Volume2, ChevronDown, ChevronUp, Keyboard, FolderOpen } from 'lucide-react';
// import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
// import VoiceUploadTrigger from './VoiceUploadTrigger'; // Import the trigger component


// export default function VoiceCommand({ onClose, onCommand }) {
//   const [showAllCommands, setShowAllCommands] = useState(false);
//   const [manualCommand, setManualCommand] = useState('');
//   const [lastCommand, setLastCommand] = useState('');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const { theme } = useTheme();
//   const navigate = useNavigate();
//   const commandsContainerRef = useRef(null);
//   const fileInputRef = useRef(null);

//   const {
//     transcript,
//     listening: isListening,
//     resetTranscript,
//     browserSupportsSpeechRecognition,
//     isMicrophoneAvailable
//   } = useSpeechRecognition();

//   // Enhanced voice commands with file selection functionality
//   const voiceCommands = [
//     {
//       command: 'upload my files',
//       description: 'Open file selection dialog',
//       icon: Upload,
//       action: () => {
//         console.log('🎤 Voice command: Opening file selection');
//         triggerFileSelection();
//         onCommand('upload');
//       }
//     },
//     {
//       command: 'upload files',
//       description: 'Open file selection dialog',
//       icon: Upload,
//       action: () => {
//         console.log('🎤 Voice command: Opening file selection');
//         triggerFileSelection();
//         onCommand('upload');
//       }
//     },
//     {
//       command: 'add files',
//       description: 'Open file selection dialog',
//       icon: Upload,
//       action: () => {
//         console.log('🎤 Voice command: Opening file selection');
//         triggerFileSelection();
//         onCommand('upload');
//       }
//     },
//     {
//       command: 'select files',
//       description: 'Open file selection dialog',
//       icon: FolderOpen,
//       action: () => {
//         console.log('🎤 Voice command: Opening file selection');
//         triggerFileSelection();
//         onCommand('upload');
//       }
//     },
//     {
//       command: 'browse files',
//       description: 'Open file selection dialog',
//       icon: FolderOpen,
//       action: () => {
//         console.log('🎤 Voice command: Opening file selection');
//         triggerFileSelection();
//         onCommand('upload');
//       }
//     },
//     {
//       command: 'open upload',
//       description: 'Navigate to upload page',
//       icon: Upload,
//       action: () => {
//         navigate('/upload');
//         onClose();
//       }
//     },
//     {
//       command: 'search for',
//       description: 'Search files and content',
//       icon: Search,
//       action: (query) => onCommand('search', query)
//     },
//     {
//       command: 'open profile',
//       description: 'Navigate to profile page',
//       icon: User,
//       action: () => {
//         navigate('/profile');
//         onClose();
//       }
//     },
//     {
//       command: 'open settings',
//       description: 'Navigate to settings',
//       icon: Settings,
//       action: () => onCommand('settings')
//     },
//     {
//       command: 'go to dashboard',
//       description: 'Navigate to dashboard',
//       icon: Settings,
//       action: () => {
//         navigate('/dashboard');
//         onClose();
//       }
//     },
//     {
//       command: 'view my files',
//       description: 'Navigate to files page',
//       icon: User,
//       action: () => {
//         navigate('/files');
//         onClose();
//       }
//     },
//     {
//       command: 'help',
//       description: 'Open help center',
//       icon: Volume2,
//       action: () => onCommand('help')
//     }
//   ];

//   // Function to trigger file selection
//   const triggerFileSelection = () => {
//     console.log('📁 Triggering file selection...');
    
//     // Create a hidden file input if it doesn't exist
//     if (!fileInputRef.current) {
//       fileInputRef.current = document.createElement('input');
//       fileInputRef.current.type = 'file';
//       fileInputRef.current.multiple = true;
//       fileInputRef.current.style.display = 'none';
      
//       // Handle file selection
//       fileInputRef.current.onchange = (event) => {
//         const files = event.target.files;
//         if (files.length > 0) {
//           console.log(`✅ ${files.length} file(s) selected via voice command`);
          
//           // Navigate to upload page with files ready
//           navigate('/upload');
          
//           // You can pass the files to the upload page via state or context
//           // For now, we'll just show a success message
//           setTimeout(() => {
//             alert(`🎤 Voice command successful! ${files.length} file(s) selected. They are ready for upload.`);
//           }, 500);
//         }
        
//         // Clean up
//         document.body.removeChild(fileInputRef.current);
//         fileInputRef.current = null;
//       };
      
//       document.body.appendChild(fileInputRef.current);
//     }
    
//     // Trigger file selection dialog
//     fileInputRef.current.click();
//     onClose(); // Close voice command modal
//   };

//   // Show only first 3 commands initially, then all when expanded
//   const displayedCommands = showAllCommands ? voiceCommands : voiceCommands.slice(0, 3);

//   // Process voice commands when transcript changes
//   useEffect(() => {
//     if (transcript && transcript.trim() && !isProcessing) {
//       console.log('🎤 Voice input received:', transcript);
//       setIsProcessing(true);
//       processVoiceCommand(transcript.toLowerCase().trim());
      
//       // Reset processing after a delay
//       setTimeout(() => {
//         setIsProcessing(false);
//         resetTranscript();
//       }, 1000);
//     }
//   }, [transcript]);

//   const processVoiceCommand = (command) => {
//     setLastCommand(command);
    
//     console.log('🎤 Processing voice command:', command);
    
//     // Find matching command
//     const matchedCommand = voiceCommands.find(cmd => 
//       command.includes(cmd.command)
//     );

//     if (matchedCommand) {
//       // Extract query for search commands
//       let query = '';
//       if (matchedCommand.command === 'search for' && command.includes('search for')) {
//         query = command.replace('search for', '').trim();
//       }

//       // Execute command action
//       console.log('✅ Executing voice command:', matchedCommand.command);
//       matchedCommand.action(query);
//     } else {
//       // No command matched
//       console.log('❌ No matching command found for:', command);
//       setTimeout(() => {
//         setLastCommand('');
//       }, 2000);
//     }
//   };

//   const startListening = () => {
//     if (!isListening) {
//       console.log('🎤 Starting continuous listening...');
//       SpeechRecognition.startListening({ 
//         continuous: true, // Keep listening until manually stopped
//         language: 'en-US'
//       });
//     }
//   };

//   const stopListening = () => {
//     if (isListening) {
//       console.log('🛑 Stopping listening...');
//       SpeechRecognition.stopListening();
//       resetTranscript();
//     }
//   };

//   const toggleListening = () => {
//     if (isListening) {
//       stopListening();
//     } else {
//       startListening();
//     }
//   };

//   const toggleCommandsView = () => {
//     setShowAllCommands(!showAllCommands);
//   };

//   const handleManualCommand = () => {
//     if (manualCommand.trim() && !isProcessing) {
//       setIsProcessing(true);
//       processVoiceCommand(manualCommand.toLowerCase().trim());
//       setManualCommand('');
      
//       // Reset processing after a delay
//       setTimeout(() => {
//         setIsProcessing(false);
//       }, 1000);
//     }
//   };

//   // Auto-stop listening after 10 seconds of inactivity
//   useEffect(() => {
//     let timeoutId;
    
//     if (isListening && !transcript) {
//       timeoutId = setTimeout(() => {
//         console.log('⏰ Auto-stopping listening due to inactivity');
//         stopListening();
//       }, 10000); // 10 seconds
//     }
    
//     return () => {
//       if (timeoutId) clearTimeout(timeoutId);
//     };
//   }, [isListening, transcript]);

//   // If browser doesn't support speech recognition
//   if (!browserSupportsSpeechRecognition) {
//     return (
//       <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           className={`rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col border ${
//             theme === 'dark'
//               ? 'bg-slate-800 border-white/20'
//               : 'bg-white border-gray-200'
//           }`}
//         >
//           {/* Header - Fixed */}
//           <div className={`p-6 border-b flex-shrink-0 ${
//             theme === 'dark' ? 'border-white/10' : 'border-gray-200'
//           }`}>
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-3">
//                 <div className={`p-2 rounded-lg ${
//                   theme === 'dark' ? 'bg-red-500/20' : 'bg-red-500/15'
//                 }`}>
//                   <MicOff className={`w-6 h-6 ${
//                     theme === 'dark' ? 'text-red-400' : 'text-red-500'
//                   }`} />
//                 </div>
//                 <div>
//                   <h2 className={`text-2xl font-bold ${
//                     theme === 'dark' ? 'text-white' : 'text-gray-900'
//                   }`}>
//                     Voice Not Supported
//                   </h2>
//                   <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
//                     Browser compatibility issue
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={onClose}
//                 className={`p-2 rounded-lg transition-colors ${
//                   theme === 'dark'
//                     ? 'hover:bg-white/10 text-gray-400 hover:text-white'
//                     : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
//                 }`}
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           {/* Main Content - Scrollable */}
//           <div className="flex-1 overflow-y-auto p-6">
//             <div className="text-center py-8">
//               <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
//                 theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
//               }`}>
//                 <MicOff className={`w-8 h-8 ${
//                   theme === 'dark' ? 'text-red-400' : 'text-red-500'
//                 }`} />
//               </div>
//               <h3 className={`text-lg font-semibold mb-2 ${
//                 theme === 'dark' ? 'text-white' : 'text-gray-900'
//               }`}>
//                 Voice Not Supported
//               </h3>
//               <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
//                 Your browser doesn't support speech recognition. Try Chrome or Edge.
//               </p>
              
//               {/* Manual Command Fallback */}
//               <div className={`mt-6 p-4 rounded-lg border ${
//                 theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
//               }`}>
//                 <h4 className={`text-sm font-semibold mb-2 ${
//                   theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
//                 }`}>
//                   <Keyboard className="w-4 h-4 inline mr-2" />
//                   Manual Command Input
//                 </h4>
//                 <div className="space-y-2">
//                   <input
//                     type="text"
//                     value={manualCommand}
//                     onChange={(e) => setManualCommand(e.target.value)}
//                     placeholder="Type 'upload my files' to select files"
//                     className={`w-full p-2 rounded text-sm border ${
//                       theme === 'dark' 
//                         ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
//                         : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                     }`}
//                     onKeyPress={(e) => e.key === 'Enter' && handleManualCommand()}
//                   />
//                   <button
//                     onClick={handleManualCommand}
//                     disabled={isProcessing}
//                     className={`w-full py-2 rounded text-sm font-medium ${
//                       isProcessing
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : theme === 'dark'
//                         ? 'bg-green-600 hover:bg-green-700 text-white'
//                         : 'bg-green-500 hover:bg-green-600 text-white'
//                     }`}
//                   >
//                     {isProcessing ? 'Processing...' : 'Execute Command'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Footer */}
//           <div className={`p-4 border-t flex-shrink-0 ${
//             theme === 'dark' ? 'border-white/10' : 'border-gray-200'
//           }`}>
//             <p className={`text-xs text-center ${
//               theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
//             }`}>
//               Using react-speech-recognition • Browser not supported
//             </p>
//           </div>
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <motion.div
//         initial={{ opacity: 0, scale: 0.9 }}
//         animate={{ opacity: 1, scale: 1 }}
//         className={`rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col border ${
//           theme === 'dark'
//             ? 'bg-slate-800 border-white/20'
//             : 'bg-white border-gray-200'
//         }`}
//       >
//         {/* Header - Fixed */}
//         <div className={`p-6 border-b flex-shrink-0 ${
//           theme === 'dark' ? 'border-white/10' : 'border-gray-200'
//         }`}>
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className={`p-2 rounded-lg ${
//                 theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-500/15'
//               }`}>
//                 <Mic className={`w-6 h-6 ${
//                   theme === 'dark' ? 'text-purple-400' : 'text-purple-500'
//                 }`} />
//               </div>
//               <div>
//                 <h2 className={`text-2xl font-bold ${
//                   theme === 'dark' ? 'text-white' : 'text-gray-900'
//                 }`}>
//                   Voice Commands
//                 </h2>
//                 <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
//                   {isListening ? '🎤 Listening... Speak now!' : 'Click microphone to start'}
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className={`p-2 rounded-lg transition-colors ${
//                 theme === 'dark'
//                   ? 'hover:bg-white/10 text-gray-400 hover:text-white'
//                   : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
//               }`}
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* Main Content - Scrollable */}
//         <div className="flex-1 overflow-y-auto">
//           <div className="p-6">
//             {/* Voice Visualization */}
//             <div className="flex justify-center mb-6">
//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={toggleListening}
//                 disabled={isProcessing}
//                 className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
//                   isListening
//                     ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
//                     : isProcessing
//                     ? 'bg-gray-400 cursor-not-allowed'
//                     : theme === 'dark'
//                     ? 'bg-purple-600 text-white hover:bg-purple-700'
//                     : 'bg-purple-500 text-white hover:bg-purple-600'
//                 }`}
//               >
//                 {isListening ? (
//                   <>
//                     <MicOff className="w-8 h-8" />
//                     <motion.div
//                       className="absolute inset-0 rounded-full border-2 border-red-400"
//                       animate={{ scale: [1, 1.2, 1] }}
//                       transition={{ duration: 1.5, repeat: Infinity }}
//                     />
//                   </>
//                 ) : (
//                   <Mic className="w-8 h-8" />
//                 )}
//               </motion.button>
//             </div>

//             {/* Listening Status */}
//             <div className={`text-center mb-4 ${
//               theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
//             }`}>
//               {isListening && (
//                 <motion.div
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   className="flex items-center justify-center space-x-2"
//                 >
//                   <div className="flex space-x-1">
//                     {[1, 2, 3].map(i => (
//                       <motion.div
//                         key={i}
//                         className="w-1 h-4 bg-red-400 rounded-full"
//                         animate={{ height: [4, 16, 4] }}
//                         transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
//                       />
//                     ))}
//                   </div>
//                   <span className="text-sm">Listening continuously... Say a command</span>
//                 </motion.div>
//               )}
//             </div>

//             {/* Transcript Display */}
//             <div className={`text-center mb-6 p-4 rounded-xl border ${
//               theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
//             }`}>
//               <p className={`text-sm font-medium mb-2 ${
//                 theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//               }`}>
//                 {isListening ? 'Speak your command now' : 'Click microphone to start speaking'}
//               </p>
              
//               <AnimatePresence>
//                 {transcript && (
//                   <motion.p
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -10 }}
//                     className={`text-lg font-semibold break-words ${
//                       theme === 'dark' ? 'text-white' : 'text-gray-900'
//                     }`}
//                   >
//                     "{transcript}"
//                   </motion.p>
//                 )}
//               </AnimatePresence>

//               {/* Command Feedback */}
//               <AnimatePresence>
//                 {lastCommand && (
//                   <motion.div
//                     initial={{ opacity: 0, scale: 0.9 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     exit={{ opacity: 0, scale: 0.9 }}
//                     className={`mt-3 p-3 rounded-lg ${
//                       voiceCommands.some(cmd => lastCommand.includes(cmd.command))
//                         ? theme === 'dark' ? 'bg-green-500/20 border-green-500/30' : 'bg-green-100 border-green-200'
//                         : theme === 'dark' ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-yellow-100 border-yellow-200'
//                     } border`}
//                   >
//                     <p className={`text-sm font-medium ${
//                       voiceCommands.some(cmd => lastCommand.includes(cmd.command))
//                         ? theme === 'dark' ? 'text-green-400' : 'text-green-700'
//                         : theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'
//                     }`}>
//                       {voiceCommands.some(cmd => lastCommand.includes(cmd.command))
//                         ? '✓ Command recognized!'
//                         : '? Command not recognized'
//                       }
//                     </p>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>

//             {/* Available Commands */}
//             <div className="space-y-3" ref={commandsContainerRef}>
//               <div className="flex items-center justify-between">
//                 <h4 className={`font-semibold text-sm ${
//                   theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//                 }`}>
//                   AVAILABLE COMMANDS:
//                 </h4>
//                 {voiceCommands.length > 3 && (
//                   <button
//                     onClick={toggleCommandsView}
//                     className={`flex items-center space-x-1 text-xs px-3 py-1 rounded-full transition-colors ${
//                       theme === 'dark'
//                         ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
//                         : 'bg-purple-500/15 text-purple-600 hover:bg-purple-500/25'
//                     }`}
//                   >
//                     <span>{showAllCommands ? 'Show Less' : `Show All (${voiceCommands.length})`}</span>
//                     {showAllCommands ? (
//                       <ChevronUp className="w-3 h-3" />
//                     ) : (
//                       <ChevronDown className="w-3 h-3" />
//                     )}
//                   </button>
//                 )}
//               </div>
              
//               <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
//                 {displayedCommands.map((cmd, index) => (
//                   <motion.div
//                     key={cmd.command}
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: index * 0.1 }}
//                     className={`flex items-center space-x-3 p-3 rounded-lg border ${
//                       theme === 'dark'
//                         ? 'bg-white/5 border-white/10'
//                         : 'bg-gray-50 border-gray-200'
//                     }`}
//                   >
//                     <div className={`p-2 rounded-lg flex-shrink-0 ${
//                       theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-500/15'
//                     }`}>
//                       <cmd.icon className={`w-4 h-4 ${
//                         theme === 'dark' ? 'text-purple-400' : 'text-purple-500'
//                       }`} />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className={`font-medium text-sm truncate ${
//                         theme === 'dark' ? 'text-white' : 'text-gray-900'
//                       }`}>
//                         "{cmd.command}"
//                       </p>
//                       <p className={`text-xs ${
//                         theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//                       }`}>
//                         {cmd.description}
//                       </p>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>

//             {/* Manual Command Fallback */}
//             <div className={`mt-6 p-4 rounded-lg border ${
//               theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
//             }`}>
//               <h4 className={`text-sm font-semibold mb-2 ${
//                 theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
//               }`}>
//                 <Keyboard className="w-4 h-4 inline mr-2" />
//                 Manual Command Input
//               </h4>
//               <div className="space-y-2">
//                 <input
//                   type="text"
//                   value={manualCommand}
//                   onChange={(e) => setManualCommand(e.target.value)}
//                   placeholder="Type 'upload my files' to select files"
//                   className={`w-full p-2 rounded text-sm border ${
//                     theme === 'dark' 
//                       ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
//                       : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                   }`}
//                   onKeyPress={(e) => e.key === 'Enter' && handleManualCommand()}
//                 />
//                 <button
//                   onClick={handleManualCommand}
//                   disabled={isProcessing}
//                   className={`w-full py-2 rounded text-sm font-medium ${
//                     isProcessing
//                       ? 'bg-gray-400 cursor-not-allowed'
//                       : theme === 'dark'
//                       ? 'bg-green-600 hover:bg-green-700 text-white'
//                       : 'bg-green-500 hover:bg-green-600 text-white'
//                   }`}
//                 >
//                   {isProcessing ? 'Processing...' : 'Execute Command'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer - Fixed */}
//         <div className={`p-4 border-t flex-shrink-0 ${
//           theme === 'dark' ? 'border-white/10' : 'border-gray-200'
//         }`}>
//           <p className={`text-xs text-center ${
//             theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
//           }`}>
//             {isListening ? '🎤 Continuous listening active - Speak commands naturally' : 'Click microphone and speak commands'}
//           </p>
//         </div>
//       </motion.div>
//     </div>
//   );
// }