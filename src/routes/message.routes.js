const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Messages
 *     description: Chat between users and admin
 */

/**
 * @swagger
 * /messages/history/{partnerId}:
 *   get:
 *     summary: Get chat history with a specific user (Admin/User)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the chat partner
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.get("/history/:partnerId", verifyToken, messageController.getChatHistory);

/**
 * @swagger
 * /messages/conversations:
 *   get:
 *     summary: Admin get list of all conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get("/conversations", verifyToken, authorizeRoles("admin"), messageController.getConversations);

module.exports = router;