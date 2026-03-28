const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Menus
 *     description: Restaurant menu management
 */

/**
 * @swagger
 * /menus/admin:
 *   get:
 *     summary: Admin get all menus
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all menus
 */
router.get("/admin", verifyToken, authorizeRoles("admin"), menuController.getAllAdminMenus);

/**
 * @swagger
 * /menus:
 *   post:
 *     summary: Create menu
 *     tags: [Menus]
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
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Beef Steak"
 *               price:
 *                 type: number
 *                 example: 25.5
 *               categoryId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Menu created successfully
 */
router.post("/", verifyToken, authorizeRoles("admin"), menuController.createMenu);

/**
 * @swagger
 * /menus/{id}:
 *   put:
 *     summary: Update menu
 *     tags: [Menus]
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
 *               name:
 *                 type: string
 *                 example: "Premium Beef Steak"
 *               price:
 *                 type: number
 *                 example: 30.0
 *     responses:
 *       200:
 *         description: Menu updated successfully
 */
router.put("/:id", verifyToken, authorizeRoles("admin"), menuController.updateMenu);

/**
 * @swagger
 * /menus/{id}:
 *   delete:
 *     summary: Delete menu
 *     tags: [Menus]
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
 *         description: Menu deleted successfully
 */
router.delete("/:id", verifyToken, authorizeRoles("admin"), menuController.deleteMenu);

/**
 * @swagger
 * /menus:
 *   get:
 *     summary: Get all menus
 *     tags: [Menus]
 *     responses:
 *       200:
 *         description: List of all menus
 */
router.get("/", menuController.getAllMenus);

/**
 * @swagger
 * /menus/category/{categoryId}:
 *   get:
 *     summary: Get menu by category
 *     tags: [Menus]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of menus in the specified category
 */
router.get("/category/:categoryId", menuController.getMenuByCategory);

/**
 * @swagger
 * /menus/{id}:
 *   get:
 *     summary: Get menu detail
 *     tags: [Menus]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu detail
 */
router.get("/:id", menuController.getMenuDetail);

module.exports = router;