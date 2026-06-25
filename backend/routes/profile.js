import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({ success: true, profile });
  } catch (error) {
    console.error('❌ Failed to fetch profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile information
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, theme_preference, notifications_enabled } = req.body;

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (theme_preference !== undefined) updates.theme_preference = theme_preference;
    if (notifications_enabled !== undefined) updates.notifications_enabled = notifications_enabled;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) throw error;

    res.json({ success: true, profile: data[0] });
  } catch (error) {
    console.error('❌ Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile picture
router.post('/:userId/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    console.log('📤 Uploading profile picture for user:', userId, 'File size:', file.size);

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    console.log('📁 File path:', filePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    console.log('✅ Profile picture uploaded, URL:', publicUrl);

    // Update profile with new picture URL
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({ profile_picture_url: publicUrl })
      .eq('id', userId)
      .select();

    if (profileError) throw profileError;

    res.json({ 
      success: true, 
      profile: profileData[0],
      avatarUrl: publicUrl 
    });

  } catch (error) {
    console.error('❌ Failed to upload profile picture:', error);
    res.status(500).json({ error: 'Failed to upload profile picture: ' + error.message });
  }
});

// Delete profile picture
router.delete('/:userId/avatar', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get current profile to find image path
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    if (profile.profile_picture_url) {
      // Extract file path from URL
      const urlParts = profile.profile_picture_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove([fileName]);

      if (deleteError) {
        console.warn('⚠️ Could not delete file from storage:', deleteError);
      }
    }

    // Remove profile picture URL from database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ profile_picture_url: null })
      .eq('id', userId)
      .select();

    if (updateError) throw updateError;

    res.json({ success: true, profile: updatedProfile[0] });

  } catch (error) {
    console.error('❌ Failed to delete profile picture:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});

export default router;