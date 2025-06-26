const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function to send SMS messages
 * This is a placeholder implementation that logs the SMS and stores it in Firestore
 * In a production environment, you would integrate with an SMS provider like Twilio, Vonage, or Africa's Talking
 */
exports.sendSMS = functions.https.onCall(async (data, context) => {
  try {
    // Check if the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Validate the request data
    if (!data.to || !data.body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function requires "to" and "body" parameters.'
      );
    }

    // Log the SMS message
    console.log(`Sending SMS to ${data.to}: ${data.body}`);

    // Store the SMS in Firestore
    const smsRef = await db.collection('sms_messages').add({
      to: data.to,
      body: data.body,
      from: data.from || 'CareAI',
      userId: context.auth.uid,
      status: 'sent',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Use Africa's Talking to send the SMS
    const AfricasTalking = require('africastalking');

    const africastalking = AfricasTalking({
      apiKey: 'atsk_bec4caf20ddfccbd1c8d387b041d0abf7c735798b935b6ca16bc21551e2013ddd5f83179',
      username: 'careai' // Using a default username, you can change this to your actual username
    });

    const sms = africastalking.SMS;

    try {
      const result = await sms.send({
        to: data.to,
        message: data.body,
        from: data.from || 'CareAI'
      });

      console.log('Africa\'s Talking SMS result:', result);

      // Update the status in Firestore
      if (result && result.SMSMessageData && result.SMSMessageData.Recipients && result.SMSMessageData.Recipients.length > 0) {
        await smsRef.update({
          providerMessageId: result.SMSMessageData.Recipients[0].messageId,
          status: result.SMSMessageData.Recipients[0].status,
          providerResponse: result
        });
      } else {
        // Handle unexpected response format
        console.warn('Unexpected response format from Africa\'s Talking:', result);
        await smsRef.update({
          status: 'sent',
          providerResponse: result
        });
      }
    } catch (smsError) {
      console.error('Error sending SMS via Africa\'s Talking:', smsError);

      // Update the status in Firestore
      await smsRef.update({
        status: 'failed',
        error: smsError.message
      });

      throw new functions.https.HttpsError(
        'internal',
        'Failed to send SMS via Africa\'s Talking',
        smsError.message
      );
    }

    return {
      success: true,
      messageId: smsRef.id,
      message: 'SMS sent successfully'
    };
  } catch (error) {
    console.error('Error sending SMS:', error);

    throw new functions.https.HttpsError(
      'internal',
      'Failed to send SMS',
      error.message
    );
  }
});

/**
 * Cloud Function to send appointment reminders
 * This function is triggered by a scheduled Cloud Function (e.g., every hour)
 */
exports.sendAppointmentReminders = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  try {
    console.log('Checking for appointment reminders...');

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get appointments in the next 24 hours
    const appointmentsSnapshot = await db.collection('appointments')
      .where('status', '==', 'confirmed')
      .where('appointment_date', '>=', now)
      .where('appointment_date', '<=', oneDayFromNow)
      .get();

    if (appointmentsSnapshot.empty) {
      console.log('No upcoming appointments found');
      return null;
    }

    console.log(`Found ${appointmentsSnapshot.size} upcoming appointments`);

    // Process each appointment
    const promises = [];

    appointmentsSnapshot.forEach(doc => {
      const appointment = doc.data();

      // Skip if no phone number
      if (!appointment.phone_number || !appointment.country_code) {
        console.log(`No phone number for appointment ${doc.id}`);
        return;
      }

      const appointmentDate = appointment.appointment_date.toDate();
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Send reminder if appointment is within 24 hours but more than 22 hours away (day before)
      // Or if it's within 2 hours but more than 1 hour away (same day)
      if ((hoursUntilAppointment <= 24 && hoursUntilAppointment > 22) ||
          (hoursUntilAppointment <= 2 && hoursUntilAppointment > 1)) {

        // Get doctor information
        promises.push(
          db.collection('doctors').doc(appointment.doctor_id).get()
            .then(async (doctorDoc) => {
              if (!doctorDoc.exists) {
                console.log(`Doctor not found for appointment ${doc.id}`);
                return null;
              }

              const doctor = doctorDoc.data();
              const phoneNumber = `${appointment.country_code}${appointment.phone_number}`;

              // Create the SMS message
              let message;
              if (hoursUntilAppointment <= 2) {
                // 1-hour reminder
                message = `CareAI Reminder: Your appointment with Dr. ${doctor.name} is in 1 hour. Appointment ID: ${doc.id.substring(0, 8)}`;
              } else {
                // Day-before reminder
                const formattedDate = appointmentDate.toLocaleDateString();
                const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                message = `CareAI Reminder: You have an appointment with Dr. ${doctor.name} tomorrow at ${formattedTime}. Appointment ID: ${doc.id.substring(0, 8)}`;
              }

              // Store the SMS in Firestore first
              const smsRef = await db.collection('sms_messages').add({
                to: phoneNumber,
                body: message,
                from: 'CareAI',
                appointmentId: doc.id,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              });

              // Send the SMS using Africa's Talking
              const AfricasTalking = require('africastalking');

              const africastalking = AfricasTalking({
                apiKey: 'atsk_bec4caf20ddfccbd1c8d387b041d0abf7c735798b935b6ca16bc21551e2013ddd5f83179',
                username: 'careai'
              });

              const sms = africastalking.SMS;

              try {
                const result = await sms.send({
                  to: phoneNumber,
                  message: message,
                  from: 'CareAI'
                });

                console.log(`Africa's Talking SMS result for appointment ${doc.id}:`, result);

                // Update the status in Firestore
                if (result && result.SMSMessageData && result.SMSMessageData.Recipients && result.SMSMessageData.Recipients.length > 0) {
                  await smsRef.update({
                    providerMessageId: result.SMSMessageData.Recipients[0].messageId,
                    status: result.SMSMessageData.Recipients[0].status,
                    providerResponse: result
                  });
                } else {
                  await smsRef.update({
                    status: 'sent',
                    providerResponse: result
                  });
                }
              } catch (smsError) {
                console.error(`Error sending SMS via Africa's Talking for appointment ${doc.id}:`, smsError);

                await smsRef.update({
                  status: 'failed',
                  error: smsError.message
                });
              }

              return smsRef;
            })
            .then(smsRef => {
              if (smsRef) {
                console.log(`Sent reminder for appointment ${doc.id}`);
              }
              return null;
            })
            .catch(error => {
              console.error(`Error sending reminder for appointment ${doc.id}:`, error);
              return null;
            })
        );
      }
    });

    await Promise.all(promises);

    console.log('Finished sending appointment reminders');
    return null;
  } catch (error) {
    console.error('Error sending appointment reminders:', error);
    return null;
  }
});
