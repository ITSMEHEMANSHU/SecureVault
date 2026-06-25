import React, { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion } from 'framer-motion';
import { Check, X, RotateCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function AvatarCropper({ image, onCancel, onSave, aspect = 1 }) {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef(null);
  const { theme } = useTheme();

  const getCroppedImg = (image, crop, rotation) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // Apply rotation
    if (rotation !== 0) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });
  };

  const handleSave = async () => {
    if (imgRef.current && completedCrop) {
      const blob = await getCroppedImg(imgRef.current, completedCrop, rotation);
      onSave(blob);
    }
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className={`fixed inset-0 backdrop-blur-lg z-50 flex items-center justify-center p-4 ${
      theme === 'dark' ? 'bg-black/50' : 'bg-white/50'
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-auto ${
          theme === 'dark' 
            ? 'bg-slate-800 border border-white/10' 
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Crop Profile Picture
          </h3>
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg ${
              theme === 'dark' 
                ? 'hover:bg-white/10 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 relative">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            circularCrop
            keepSelection
          >
            <img
              ref={imgRef}
              src={image}
              alt="Crop preview"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                maxHeight: '60vh',
                width: '100%',
                objectFit: 'contain'
              }}
              onLoad={() => {
                // Auto-set crop to center when image loads
                setCrop({
                  unit: '%',
                  width: 80,
                  height: 80,
                  x: 10,
                  y: 10
                });
              }}
            />
          </ReactCrop>
        </div>

        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={rotateImage}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
              theme === 'dark'
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/25'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>Rotate</span>
          </motion.button>

          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className={`px-4 py-2 rounded-xl ${
                theme === 'dark'
                  ? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  : 'bg-gray-500/15 text-gray-600 hover:bg-gray-500/25'
              }`}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={!completedCrop}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
                theme === 'dark'
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-green-500/15 text-green-600 hover:bg-green-500/25'
              } ${!completedCrop ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Check className="w-4 h-4" />
              <span>Save</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}