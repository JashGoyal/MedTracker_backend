const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
    name: String,
    batchNumber: String,
    quantity: Number,
    expiryDate: Date,
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

module.exports = mongoose.model("Medicine", medicineSchema);