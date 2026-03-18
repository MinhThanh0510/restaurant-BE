const express = require("express");
const router = express.Router();

const tableController = require("../controllers/table.controller");
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");

// CUSTOMER
router.get("/", tableController.getAllTables);

router.get("/available", tableController.getAvailableTables);

router.get("/availability", tableController.getTablesAvailability);


// ADMIN
router.post("/", verifyToken, authorizeRoles("admin"), tableController.createTable);

router.put("/:id", verifyToken, authorizeRoles("admin"), tableController.updateTable);

router.delete("/:id", verifyToken, authorizeRoles("admin"), tableController.deleteTable);

module.exports = router;