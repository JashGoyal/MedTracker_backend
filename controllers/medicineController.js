const Medicine = require("../models/Medicine");
const sendMail = require("../utils/mailer");

exports.addMedicine = async (req, res) => {
    try {
        const { name, batchNumber, quantity, expiryDate } = req.body;

        if (!name || !quantity || !expiryDate)
            return res.status(400).json({ msg: "Name, quantity and expiry date are required" });

        const med = await Medicine.create({
            name,
            batchNumber,
            quantity: Number(quantity),
            expiryDate,
            addedBy: req.user
        });

        res.status(201).json(med);
    } catch (err) {
        console.error("Add medicine error:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
};

exports.getMedicines = async (req, res) => {
    try {
        const meds = await Medicine.find({ addedBy: req.user }).sort({ expiryDate: 1 });
        res.json(meds);
    } catch (err) {
        console.error("Get medicines error:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
};

exports.deleteMedicine = async (req, res) => {
    try {
        const med = await Medicine.findOne({ _id: req.params.id, addedBy: req.user });
        if (!med) return res.status(404).json({ msg: "Medicine not found" });

        await med.deleteOne();
        res.json({ msg: "Medicine deleted" });
    } catch (err) {
        console.error("Delete medicine error:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
};

exports.updateQuantity = async (req, res) => {
    try {
        const { amount = 1 } = req.body;
        const med = await Medicine.findOne({ _id: req.params.id, addedBy: req.user });

        if (!med) return res.status(404).json({ msg: "Medicine not found" });

        med.quantity = med.quantity - Number(amount);

        if (med.quantity <= 0) {
            await med.deleteOne();
            return res.json({ msg: "Medicine removed (quantity reached 0)" });
        }

        await med.save();
        res.json({ msg: "Quantity updated", medicine: med });
    } catch (err) {
        console.error("Update quantity error:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
};

exports.sendExpiryMail = async (req, res) => {
    try {
        const medicines = await Medicine.find({ addedBy: req.user });
        const today = new Date();

        const expiring = medicines.filter(m => {
            const diff = (new Date(m.expiryDate) - today) / (1000 * 60 * 60 * 24);
            return diff <= 7 && diff > -1;
        });

        if (expiring.length === 0)
            return res.json({ msg: "No medicines expiring within 7 days" });

        const rows = expiring.map((m, i) => {
            const diff = Math.ceil((new Date(m.expiryDate) - today) / (1000 * 60 * 60 * 24));
            const statusColor = diff <= 0 ? "#ef4444" : "#f59e0b";
            const statusText = diff <= 0 ? "EXPIRED" : `${diff}d left`;
            return `
                <tr style="border-bottom:1px solid #1e2d45;">
                    <td style="padding:12px 16px;color:#94a3b8;">${i + 1}</td>
                    <td style="padding:12px 16px;color:#f1f5f9;font-weight:600;">${m.name}</td>
                    <td style="padding:12px 16px;color:#93c5fd;font-family:monospace;">${m.batchNumber || "—"}</td>
                    <td style="padding:12px 16px;color:#f1f5f9;">${m.quantity}</td>
                    <td style="padding:12px 16px;color:#94a3b8;">${new Date(m.expiryDate).toDateString()}</td>
                    <td style="padding:12px 16px;">
                        <span style="background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;border-radius:20px;padding:3px 10px;font-size:0.75rem;font-weight:700;">
                            ${statusText}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");

        const html = `
        <div style="font-family:'Segoe UI',sans-serif;background:#080c14;padding:40px;min-height:100%;color:#f1f5f9;">
            <div style="max-width:640px;margin:0 auto;">
                <!-- Header -->
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">
                    <div style="width:42px;height:42px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                        <span style="font-size:20px;">💊</span>
                    </div>
                    <div>
                        <h1 style="margin:0;font-size:1.3rem;font-weight:800;color:#f1f5f9;">MedTracker</h1>
                        <p style="margin:0;font-size:0.75rem;color:#475569;">Pharmacy Management</p>
                    </div>
                </div>

                <!-- Alert banner -->
                <div style="background:#f59e0b18;border:1px solid #f59e0b33;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
                    <h2 style="margin:0 0 6px;color:#fbbf24;font-size:1.1rem;">⚠ Expiry Alert</h2>
                    <p style="margin:0;color:#94a3b8;font-size:0.88rem;">
                        ${expiring.length} medicine${expiring.length > 1 ? "s" : ""} require${expiring.length === 1 ? "s" : ""} your attention within the next 7 days.
                    </p>
                </div>

                <!-- Table -->
                <div style="background:#111827;border:1px solid #1e2d45;border-radius:14px;overflow:hidden;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#0d1424;">
                                <th style="padding:12px 16px;text-align:left;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">#</th>
                                <th style="padding:12px 16px;text-align:left;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Medicine</th>
                                <th style="padding:12px 16px;text-align:left;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Batch</th>
                                <th style="padding:12px 16px;text-align:left;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Qty</th>
                                <th style="padding:12px 16px;text-align:left;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Expiry</th>
                                <th style="padding:12px 16px;text-align:left;font-size:0.7rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Status</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>

                <p style="color:#475569;font-size:0.78rem;margin-top:24px;text-align:center;">
                    This alert was sent from MedTracker · Please take necessary action promptly.
                </p>
            </div>
        </div>
        `;

        await sendMail(process.env.EMAIL, "🚨 MedTracker — Medicine Expiry Alert", html);
        res.json({ msg: "Alert email sent successfully", count: expiring.length });
    } catch (err) {
        console.error("Mail error:", err.message);
        res.status(500).json({ msg: "Failed to send mail", error: err.message });
    }
};
