const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
// Important: define "all" routes BEFORE param routes so they aren't captured by :id
router.put('/all/read', markAllAsRead);
router.delete('/all', deleteAllNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
