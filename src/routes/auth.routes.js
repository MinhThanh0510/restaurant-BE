const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User authentication and password management
 */

/**
 * @swagger
 * auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: thanh0121@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               phone:
 *                 type: string
 *                 example: "0123456789"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data or email already exists
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to the system
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: thanh0121@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful, returns JWT tokens
 *       400:
 *         description: Invalid credentials
 *       403:
 *         description: Account is disabled
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *     responses:
 *       200:
 *         description: Reset email sent successfully
 *       404:
 *         description: User not found
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   put:
 *     summary: Reset password using a valid token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The password reset token received via email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: NewStrongPass123!
 *     responses:
 *       200:
 *         description: Password has been reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.put("/reset-password/:token", authController.resetPassword);

module.exports = router;