import express from 'express';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

// Get user notifications
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('❌ Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select();

    if (error) throw error;

    res.json({ success: true, notification: data[0] });
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('❌ Failed to mark all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Create notification (for system events)
router.post('/', async (req, res) => {
  try {
    const { userId, title, message, type = 'info', actionUrl } = req.body;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type, // info, success, warning, error
        action_url: actionUrl,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    res.json({ success: true, notification: data[0] });
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

export default router;