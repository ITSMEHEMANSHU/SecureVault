// import React, { useRef, useEffect, useState } from 'react';
// import { useTheme } from '../../contexts/ThemeContext';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Upload, Mic, CheckCircle } from 'lucide-react';

// export default function VoiceUploadTrigger({ 
//   isVoiceTriggered, 
//   onVoiceUploadReady, 
//   onVoiceUploadComplete 
// }) {
//   const fileInputRef = useRef(null);
//   const { theme } = useTheme();
//   const [showVoiceFeedback, setShowVoiceFeedback] = useState(false);

//   useEffect(() => {
//     if (isVoiceTriggered && fileInputRef.current) {
//       console.log('🎤 Voice command detected: Opening file picker...');
//       setShowVoiceFeedback(true);
      
//       // Small delay for better UX
//       setTimeout(() => {
//         fileInputRef.current.click();
//       }, 500);

//       // Auto-hide feedback after 3 seconds
//       setTimeout(() => {
//         setShowVoiceFeedback(false);
//       }, 3000);
//     }
//   }, [isVoiceTriggered]);

//   const handleFileSelect = (event) => {
//     const files = event.target.files;
//     if (files.length > 0) {
//       console.log(`🎤 Voice-initiated upload: ${files.length} file(s) selected`);
      
//       // Show success feedback
//       setShowVoiceFeedback(true);
      
//       // Notify parent component
//       if (onVoiceUploadReady) {
//         onVoiceUploadReady(files);
//       }

//       // Auto-hide after 2 seconds
//       setTimeout(() => {
//         setShowVoiceFeedback(false);
//       }, 2000);
//     }
    
//     // Reset input to allow selecting same files again
//     event.target.value = '';
//   };

//   return (
//     <>
//       <input
//         ref={fileInputRef}
//         type="file"
//         multiple
//         onChange={handleFileSelect}
//         style={{ display: 'none' }}
//         accept="*/*"
//       />

//       {/* Voice Command Feedback Overlay */}
//       <AnimatePresence>
//         {showVoiceFeedback && (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.8 }}
//             className={`fixed top-4 right-4 z-50 p-4 rounded-xl border backdrop-blur-sm ${
//               theme === 'dark'
//                 ? 'bg-green-500/20 border-green-400/30 text-green-300'
//                 : 'bg-green-500/15 border-green-400/40 text-green-600'
//             }`}
//           >
//             <div className="flex items-center space-x-3">
//               {isVoiceTriggered && !fileInputRef.current?.files?.length ? (
//                 <>
//                   <Mic className="w-5 h-5 animate-pulse" />
//                   <div>
//                     <p className="font-semibold">Voice Command Active</p>
//                     <p className="text-sm opacity-80">Select files to upload...</p>
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle className="w-5 h-5" />
//                   <div>
//                     <p className="font-semibold">Files Selected</p>
//                     <p className="text-sm opacity-80">Ready for upload</p>
//                   </div>
//                 </>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// }