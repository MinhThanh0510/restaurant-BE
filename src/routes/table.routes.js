const express = require("express");
const router = express.Router();
const tableController = require("../controllers/table.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Tables
 *     description: Table management and availability
 */

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Get all tables
 *     tags: [Tables]
 *     responses:
 *       200:
 *         description: List of all tables
 */
router.get("/", tableController.getAllTables);

/**
 * @swagger
 * /tables/available:
 *   get:
 *     summary: Get available tables
 *     tags: [Tables]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: The date to check (YYYY-MM-DD)
 *         example: "2026-04-01"
 *       - in: query
 *         name: time
 *         required: true
 *         schema:
 *           type: string
 *         description: The time to check (HH:mm)
 *         example: "18:30"
 *     responses:
 *       200:
 *         description: List of available tables
 *       400:
 *         description: Missing date or time
 */
router.get("/available", tableController.getAvailableTables);

/**
 * @swagger
 * /tables/availability:
 *   get:
 *     summary: Check tables availability
 *     tags: [Tables]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: The date to check (YYYY-MM-DD)
 *         example: "2026-04-01"
 *       - in: query
 *         name: time
 *         required: true
 *         schema:
 *           type: string
 *         description: The time to check (HH:mm)
 *         example: "18:30"
 *     responses:
 *       200:
 *         description: Tables availability information
 */
router.get("/availability", tableController.getTablesAvailability);

/**
 * @swagger
 * /tables:
 *   post:
 *     summary: Create table (Admin)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableNumber
 *               - capacity
 *             properties:
 *               tableNumber:
 *                 type: string
 *                 example: "T01"
 *               capacity:
 *                 type: number
 *                 example: 4
 *               location:
 *                 type: string
 *                 example: "Indoor"
 *               price:
 *                 type: number
 *                 example: 10.0
 *     responses:
 *       201:
 *         description: Table created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/", verifyToken, authorizeRoles("admin"), tableController.createTable);

/**
 * @swagger
 * /tables/{id}:
 *   put:
 *     summary: Update table (Admin)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tableNumber:
 *                 type: string
 *                 example: "T01"
 *               capacity:
 *                 type: number
 *                 example: 6
 *               location:
 *                 type: string
 *                 example: "Outdoor"
 *               price:
 *                 type: number
 *                 example: 15.0
 *     responses:
 *       200:
 *         description: Table updated successfully
 *       404:
 *         description: Table not found
 */
router.put("/:id", verifyToken, authorizeRoles("admin"), tableController.updateTable);

/**
 * @swagger
 * /tables/{id}:
 *   delete:
 *     summary: Delete table (Admin)
 *     tags: [Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Table deleted successfully
 *       404:
 *         description: Table not found
 */
router.delete("/:id", verifyToken, authorizeRoles("admin"), tableController.deleteTable);

module.exports = router;