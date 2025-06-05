import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Or your SMTP provider (e.g., mailgun, sendgrid)
    port: 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_NODEMAILER_USER,
        pass: process.env.SMTP_NODEMAILER_PASS, // Use app password for Gmail
    }
});

export const sendEmail = async ({ to, subject, first_name, verify_link }) => {
    try {
        const templatePath = path.resolve('src/templates/verifyEmailTemplate.html');
        let html = fs.readFileSync(templatePath, 'utf-8');

        html = html
            .replace('{{first_name}}', first_name)
            .replace('{{verify_link}}', verify_link);

        const mailOptions = {
            from: `Future It Solution <${process.env.SMTP_NODEMAILER_USER}>`,
            to: to,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return info;

    } catch (error) {
        console.error('Failed to send email:', error.message);
        throw error;
    }
};
