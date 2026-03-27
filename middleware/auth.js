const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ msg: "No token" });
        }

        const token = authHeader.split(" ")[1];
console.log("HEADER:", req.headers.authorization);
console.log("JWT_SECRET (verify):", process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded.id;

        next();

    } catch (err) {
        console.log("AUTH ERROR:", err.message);
        return res.status(401).json({ msg: "Invalid token" });
    }
};