const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});

const sendMail = async (to, subject, html) => {
    await transporter.sendMail({
        from: `"MedTracker Alerts" <${process.env.EMAIL}>`,
        to,
        subject,
        html,
    });
};

module.exports = sendMail;
