const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Menu category management
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Retrieve a list of all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Successfully retrieved list of categories
 */
router.get("/", categoryController.getAllCategories);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Main Courses"
 *               description:
 *                 type: string
 *                 example: "Delicious main dishes"
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post("/", verifyToken, authorizeRoles("admin"), categoryController.createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update an existing category
 *     tags: [Categories]
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put("/:id", verifyToken, authorizeRoles("admin"), categoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 */
router.delete("/:id", verifyToken, authorizeRoles("admin"), categoryController.deleteCategory);

module.exports = router;