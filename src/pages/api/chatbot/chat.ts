import { NextApiRequest, NextApiResponse } from 'next';

// Mock responses for when the backend is unavailable
const mockResponses: Record<string, string> = {
  headache: 'Headaches can be caused by various factors including stress, dehydration, lack of sleep, or eye strain. For occasional headaches, rest, hydration, and over-the-counter pain relievers may help. If you experience severe, persistent, or recurring headaches, please consult with a healthcare professional.',
  cold: 'Common cold symptoms include fever, cough, sore throat, body aches, and fatigue. Rest, hydration, and over-the-counter medications can help manage symptoms. If symptoms are severe or persist for more than a week, consider consulting a healthcare provider.',
  flu: 'Flu symptoms include fever, cough, sore throat, body aches, and fatigue. Rest, hydration, and over-the-counter medications can help manage symptoms. If symptoms are severe or persist for more than a week, consider consulting a healthcare provider.',
  diet: 'A balanced diet typically includes a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. The specific dietary needs vary based on age, gender, activity level, and health conditions. Consider consulting with a registered dietitian for personalized nutrition advice.',
  nutrition: 'A balanced diet typically includes a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. The specific dietary needs vary based on age, gender, activity level, and health conditions. Consider consulting with a registered dietitian for personalized nutrition advice.',
  exercise: 'Regular physical activity is important for overall health. Adults should aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous activity per week, along with muscle-strengthening activities on 2 or more days per week. Always start gradually and consult with a healthcare provider before beginning a new exercise program.',
  workout: 'Regular physical activity is important for overall health. Adults should aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous activity per week, along with muscle-strengthening activities on 2 or more days per week. Always start gradually and consult with a healthcare provider before beginning a new exercise program.',
  sleep: 'Adults typically need 7-9 hours of quality sleep per night. Good sleep hygiene includes maintaining a consistent sleep schedule, creating a restful environment, limiting screen time before bed, and avoiding caffeine and large meals close to bedtime. If you have persistent sleep problems, consider consulting a healthcare provider.',
  diabetes: 'Diabetes is a chronic condition that affects how your body turns food into energy. The main types are Type 1, Type 2, and gestational diabetes. Symptoms may include increased thirst, frequent urination, hunger, fatigue, and blurred vision. Management typically involves monitoring blood sugar, medication, healthy eating, and regular physical activity.',
  heart: 'Heart disease refers to several conditions that affect your heart. Common types include coronary artery disease, heart failure, and arrhythmias. Risk factors include high blood pressure, high cholesterol, smoking, obesity, and family history. Prevention strategies include a healthy diet, regular exercise, not smoking, and managing stress.',
  covid: 'COVID-19 is caused by the SARS-CoV-2 virus. Symptoms may include fever, cough, shortness of breath, fatigue, body aches, headache, loss of taste or smell, sore throat, congestion, nausea, and diarrhea. If you experience symptoms, consider getting tested and follow local health guidelines for isolation and treatment.',
  vaccine: 'Vaccines work by stimulating your immune system to recognize and fight specific infectious agents. They are crucial for preventing many serious diseases. Common vaccines include those for influenza, tetanus, measles, mumps, rubella, hepatitis, and COVID-19. Consult with a healthcare provider about which vaccines are recommended for you based on your age, health status, and other factors.',
  pregnancy: 'Pregnancy typically lasts about 40 weeks, divided into three trimesters. Common symptoms include missed periods, nausea, breast tenderness, fatigue, and increased urination. Prenatal care is essential for monitoring the health of both the mother and developing baby. This includes regular check-ups, proper nutrition, appropriate exercise, and avoiding harmful substances.',
  cancer: 'Cancer is a group of diseases characterized by the uncontrolled growth and spread of abnormal cells. Risk factors vary by cancer type but may include genetic factors, lifestyle choices, and environmental exposures. Early detection through screening is important for many types of cancer. Treatment options may include surgery, radiation therapy, chemotherapy, immunotherapy, and targeted therapy.',
  mental: 'Mental health encompasses emotional, psychological, and social well-being. Common mental health conditions include depression, anxiety disorders, bipolar disorder, and schizophrenia. Treatment may involve therapy, medication, lifestyle changes, or a combination of approaches. It\'s important to seek help from a qualified mental health professional if you\'re experiencing persistent symptoms.',
  anxiety: 'Anxiety disorders are characterized by persistent, excessive worry or fear that interferes with daily activities. Symptoms may include restlessness, fatigue, difficulty concentrating, irritability, muscle tension, and sleep problems. Treatment options include therapy (particularly cognitive-behavioral therapy), medication, stress management techniques, and lifestyle changes.',
  depression: 'Depression is a mood disorder characterized by persistent feelings of sadness, loss of interest in activities, and impaired daily functioning. Other symptoms may include changes in appetite or sleep, loss of energy, feelings of worthlessness, difficulty concentrating, and thoughts of death or suicide. Treatment typically involves psychotherapy, medication, or a combination of both.',
  blood: 'Blood pressure is the force of blood pushing against the walls of your arteries. Normal blood pressure is generally considered to be below 120/80 mm Hg. High blood pressure (hypertension) is a common condition that can lead to serious health problems if left untreated. Management may include lifestyle changes, medication, or both.',
  cholesterol: 'Cholesterol is a waxy substance found in your blood. While your body needs some cholesterol, high levels can increase your risk of heart disease. There are two main types: LDL (often called "bad" cholesterol) and HDL (often called "good" cholesterol). Management strategies include a healthy diet, regular exercise, maintaining a healthy weight, not smoking, and sometimes medication.',
  allergy: 'Allergies occur when your immune system reacts to a foreign substance that doesn\'t cause a reaction in most people. Common allergens include pollen, pet dander, certain foods, and insect stings. Symptoms range from mild (sneezing, itching) to severe (anaphylaxis). Management includes avoiding triggers, over-the-counter or prescription medications, and in some cases, immunotherapy.',
  asthma: 'Asthma is a chronic condition affecting the airways in the lungs. Symptoms include wheezing, shortness of breath, chest tightness, and coughing. Triggers vary but may include allergens, exercise, cold air, and respiratory infections. Management typically involves avoiding triggers, using controller medications regularly, and having quick-relief medications available for symptom flare-ups.',
  arthritis: 'Arthritis refers to inflammation of one or more joints, causing pain and stiffness. The two most common types are osteoarthritis (wear-and-tear) and rheumatoid arthritis (autoimmune). Management strategies include physical activity, maintaining a healthy weight, medications for pain and inflammation, physical therapy, and in some cases, surgery.',
  thyroid: 'The thyroid is a gland in your neck that produces hormones regulating metabolism. Common thyroid disorders include hypothyroidism (underactive thyroid), hyperthyroidism (overactive thyroid), and thyroid nodules. Symptoms vary widely depending on the condition but may include fatigue, weight changes, temperature sensitivity, and changes in heart rate. Treatment depends on the specific condition but often involves medication.',
  migraine: 'Migraines are intense headaches often accompanied by nausea, vomiting, and sensitivity to light and sound. They may be preceded by warning signs (aura) such as visual disturbances. Triggers vary but may include stress, certain foods, hormonal changes, and environmental factors. Treatment includes pain-relieving medications, preventive medications, and lifestyle changes to avoid triggers.',
  stress: 'Stress is your body\'s response to demands or threats. While some stress is normal, chronic stress can affect your health. Symptoms may include headaches, sleep problems, digestive issues, irritability, and difficulty concentrating. Management strategies include regular exercise, relaxation techniques, adequate sleep, social support, and in some cases, professional help from a therapist or counselor.'
};

// Generate a mock response based on the user's message
function generateMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Check for specific keywords in the message
  for (const [keyword, response] of Object.entries(mockResponses)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  
  // Default response if no keywords match
  return "Thank you for your question. While I can provide general health information, I recommend consulting with a qualified healthcare professional for personalized medical advice tailored to your specific situation.";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, max_tokens } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Try to connect to the chatbot backend
    try {
      const response = await fetch('http://localhost:8003/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          max_tokens: max_tokens || 512
        }),
        // Add a timeout to prevent hanging
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (error) {
      console.error('Error connecting to chatbot backend:', error);
      // Continue to fallback
    }

    // If we can't connect to the backend, return a mock response
    return res.status(200).json({
      response: generateMockResponse(message),
      note: 'This is a mock response as the backend service is not available'
    });
  } catch (error) {
    console.error('Error processing chatbot request:', error);
    return res.status(500).json({
      error: 'Error processing request',
      response: 'I apologize, but I encountered an error processing your request. Please try again later.'
    });
  }
}
