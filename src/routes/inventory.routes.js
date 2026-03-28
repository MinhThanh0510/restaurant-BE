const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Inventory
 *     description: Ingredient and stock management
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Retrieve the entire inventory list
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Successfully retrieved inventory items
 */
router.get("/", inventoryController.getAllInventory);

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Add a new ingredient
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - quantity
 *               - unit
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Fresh Beef"
 *               quantity:
 *                 type: number
 *                 example: 50
 *               unit:
 *                 type: string
 *                 example: "kg"
 *               categoryId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       201:
 *         description: Created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", verifyToken, authorizeRoles("admin"), inventoryController.createInventoryItem);

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Update inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Inventory Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Beef"
 *               quantity:
 *                 type: number
 *                 example: 60
 *               unit:
 *                 type: string
 *                 example: "kg"
 *               categoryId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Inventory item not found
 */
router.put("/:id", verifyToken, authorizeRoles("admin"), inventoryController.updateInventoryItem);

/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Inventory Item ID
 *     responses:
 *       200:
 *         description: Inventory item deleted successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Inventory item not found
 */
router.delete("/:id", verifyToken, authorizeRoles("admin"), inventoryController.deleteInventoryItem);

module.exports = router;