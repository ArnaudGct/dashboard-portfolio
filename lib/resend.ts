import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY); // Initialize Resend with the API key from environment variables
