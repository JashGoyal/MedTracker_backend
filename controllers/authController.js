const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ msg: "All fields are required" });

        const existing = await User.findOne({ email });
        if (existing)
            return res.status(400).json({ msg: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({
            msg: "Account created successfully",
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error("Register error:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ msg: "Email and password are required" });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ msg: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ msg: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ msg: "Server error" });
    }
};
