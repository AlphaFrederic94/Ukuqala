# SMS Integration for CareAI

This document explains how the SMS integration works in the CareAI application, particularly for appointment reminders and notifications.

## Overview

The SMS integration in CareAI allows the application to send SMS notifications for:

1. Appointment confirmations
2. Appointment reminders (24 hours before and 1 hour before)
3. Appointment cancellations
4. Appointment reschedules

## Implementation

The SMS integration is implemented using the following components:

### 1. Frontend Components

- **BookingForm.tsx**: Collects the user's phone number and country code during appointment booking
- **Appointments.tsx**: Handles appointment booking, cancellation, and rescheduling, and triggers SMS notifications

### 2. Services

- **smsService.ts**: Provides methods for sending different types of SMS messages
- **appointmentReminderService.ts**: Checks for upcoming appointments and sends reminders

### 3. Backend (Firebase Cloud Functions)

- **sendSMS.js**: Cloud Function that handles the actual sending of SMS messages
- **sendAppointmentReminders**: Scheduled Cloud Function that runs every hour to check for appointments and send reminders

## SMS Provider Integration

The implementation uses Africa's Talking as the SMS provider, which offers excellent coverage across Africa. The integration is configured with the following details:

- **Provider**: Africa's Talking
- **API Key**: Configured in the Firebase Cloud Function
- **Username**: 'careai' (default)
- **Sender ID**: 'CareAI' (default)

### How the Africa's Talking Integration Works

1. The frontend calls a Firebase Cloud Function named `sendSMS`
2. The Cloud Function uses the Africa's Talking Node.js SDK to send the SMS
3. The result is stored in Firestore for tracking and debugging

### Alternative Providers

If you need to switch to a different SMS provider, the Cloud Function can be modified to use:

1. **Twilio**: Global SMS provider with good coverage
2. **Vonage (formerly Nexmo)**: Another global SMS provider

Code examples for these providers are available in the Cloud Function source code.

## Database Schema

SMS messages are stored in the `sms_messages` collection in Firestore with the following fields:

- `to`: The recipient's phone number with country code
- `body`: The message content
- `from`: The sender ID (default: "CareAI")
- `status`: The message status (pending, sent, sent_simulated, failed)
- `createdAt`: Timestamp when the message was created
- `appointmentId`: (Optional) Reference to the related appointment
- `providerResponse`: (Optional) Response from the SMS provider
- `error`: (Optional) Error message if the sending failed

## Appointment Database Updates

The `appointments` table in Supabase has been updated to include:

- `phone_number`: The user's phone number
- `country_code`: The user's country code

## Deployment

The SMS integration requires two components to be deployed:

1. **Firebase Cloud Functions**: These handle the actual sending of SMS messages
2. **Database Migration**: This adds the necessary columns to the appointments table

### Deploying with the Script

We've provided a deployment script that handles both components:

```bash
./scripts/deploy_sms_integration.sh
```

This script will:
1. Deploy the Firebase Cloud Functions
2. Run the SQL migration (if possible)

### Manual Deployment

If you prefer to deploy manually:

#### Firebase Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

#### Database Migration

Run the SQL migration in the Supabase SQL Editor:
1. Go to the Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrations/add_phone_to_appointments.sql`
4. Paste it into the SQL Editor and run it

## Testing

To test the SMS integration:

1. Book a new appointment and provide a phone number
2. Check the Firestore `sms_messages` collection to see the confirmation message
3. Check the Africa's Talking dashboard to verify that the SMS was sent
4. Cancel or reschedule the appointment to see additional messages

### Troubleshooting

If SMS messages are not being sent:

1. Check the Firebase Functions logs in the Firebase Console
2. Verify that the Africa's Talking API key is correct
3. Make sure the phone number is in the correct format (with country code)
4. Check the Firestore `sms_messages` collection for error messages

## Future Improvements

1. **Delivery Status Updates**: Implement webhook endpoints to receive delivery status updates from the SMS provider
2. **SMS Templates**: Create configurable templates for different types of messages
3. **Opt-out Management**: Allow users to opt out of SMS notifications
4. **Localization**: Support SMS messages in multiple languages
5. **Fallback Mechanisms**: Implement additional fallback mechanisms if the primary SMS provider fails

## Troubleshooting

If SMS messages are not being sent:

1. Check the browser console for errors
2. Verify that the phone number and country code are being saved correctly
3. Check the Firebase Cloud Functions logs for errors
4. Verify that the SMS provider credentials are correct (in production)
