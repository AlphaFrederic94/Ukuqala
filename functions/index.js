const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase Admin
admin.initializeApp();

// Import the SMS functions
const smsModule = require('./src/sendSMS');

// Export the functions
exports.sendSMS = smsModule.sendSMS;
exports.sendAppointmentReminders = smsModule.sendAppointmentReminders;
