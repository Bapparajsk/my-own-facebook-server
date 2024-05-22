import { readFileSync } from 'fs';
import { createTransport } from 'nodemailer';

// Read the email template once and store it globally
const emailTemplate = readFileSync('./templates/mainTemplates.html', 'utf-8');

const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtp = async (name: string, email: string) => {
    try {
        const otp = generateOTP();
        const transporter = createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Use `true` for port 465, `false` for all other ports
            auth: {
                user: "sbapparaj38@gmail.com",
                pass: "xnal fjba pqpq pggp",
            },
        });

        // Create a local copy of the email template and replace placeholders
        let localEmailTemplate = emailTemplate
            .replace('{{name}}', name)
            .replace('{{otp}}', otp);

        console.log(`Sending OTP for ${name} to ${email}: ${otp}`);

        const mailOptions = {
            from: `"Code King" <codeking@code.com>`, // sender address
            to: email,
            subject: 'Your OTP Code',
            html: localEmailTemplate
        };

        await transporter.sendMail(mailOptions);
        return { otp, error: undefined };

    } catch (error) {
        console.error(error);
        return { otp: undefined, error: true };
    }
};

