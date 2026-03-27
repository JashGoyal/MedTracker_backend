const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
    addMedicine,
    getMedicines,
    deleteMedicine,
    updateQuantity,
    sendExpiryMail,
} = require("../controllers/medicineController");

router.use(auth);

router.post("/", addMedicine);
router.get("/", getMedicines);
router.delete("/:id", deleteMedicine);
router.patch("/:id", updateQuantity);
router.get("/send-mail", sendExpiryMail);

module.exports = router;
