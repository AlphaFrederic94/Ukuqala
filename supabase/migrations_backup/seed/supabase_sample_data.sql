-- Insert sample health facilities data
INSERT INTO health_facilities (name, category, address, latitude, longitude, phone, hours, wait_time, services)
VALUES
  ('City General Hospital', 'Hospital', '123 Main St, Cityville', 51.505, -0.09, '555-1234', 'Open 24/7', '30-45 min', '["Emergency Care", "Surgery", "Pediatrics", "Cardiology", "Neurology"]'),
  ('Westside Medical Clinic', 'Clinic', '456 West Ave, Cityville', 51.51, -0.1, '555-5678', 'Mon-Fri 8am-6pm', '15-20 min', '["General Medicine", "Vaccinations", "Lab Tests", "Physical Therapy"]'),
  ('Eastside Health Center', 'Clinic', '789 East Blvd, Cityville', 51.515, -0.08, '555-9012', 'Mon-Sat 9am-5pm', '10-15 min', '["Family Medicine", "Women''s Health", "Mental Health", "Nutrition Counseling"]'),
  ('Central Pharmacy', 'Pharmacy', '321 Center St, Cityville', 51.508, -0.095, '555-3456', 'Mon-Sun 8am-10pm', 'No wait', '["Prescription Filling", "Medication Counseling", "Vaccinations", "Health Screenings"]'),
  ('North Medical Laboratory', 'Laboratory', '654 North Rd, Cityville', 51.52, -0.085, '555-7890', 'Mon-Fri 7am-7pm, Sat 8am-2pm', '5-10 min', '["Blood Tests", "Urinalysis", "COVID Testing", "Genetic Testing"]'),
  ('South Community Health', 'Clinic', '987 South St, Cityville', 51.5, -0.105, '555-2345', 'Mon-Fri 8:30am-4:30pm', '20-30 min', '["Primary Care", "Pediatrics", "Geriatrics", "Chronic Disease Management"]'),
  ('Downtown Medical Center', 'Hospital', '555 Downtown Blvd, Cityville', 51.503, -0.088, '555-7777', 'Open 24/7', '20-30 min', '["Emergency Care", "Surgery", "Oncology", "Radiology", "Orthopedics"]'),
  ('Riverside Health Clinic', 'Clinic', '222 Riverside Dr, Cityville', 51.512, -0.105, '555-8888', 'Mon-Fri 9am-7pm, Sat 10am-2pm', '15-25 min', '["Family Medicine", "Pediatrics", "Geriatrics", "Preventive Care"]'),
  ('University Hospital', 'Hospital', '1000 University Ave, Cityville', 51.525, -0.095, '555-9999', 'Open 24/7', '45-60 min', '["Emergency Care", "Teaching Hospital", "Research Center", "Specialized Care"]'),
  ('Community Mental Health', 'Clinic', '333 Wellness Way, Cityville', 51.507, -0.075, '555-6666', 'Mon-Fri 8am-8pm', '30-45 min', '["Psychiatry", "Psychology", "Counseling", "Group Therapy"]'),
  ('24-Hour Pharmacy', 'Pharmacy', '444 Night St, Cityville', 51.498, -0.092, '555-5555', 'Open 24/7', 'No wait', '["Prescription Filling", "OTC Medications", "Medical Supplies", "Consultations"]'),
  ('Women''s Health Center', 'Clinic', '777 Ladies Ln, Cityville', 51.518, -0.065, '555-4444', 'Mon-Fri 9am-5pm', '20-30 min', '["OB/GYN", "Mammography", "Prenatal Care", "Women''s Health Education"]'),
  ('Children''s Hospital', 'Hospital', '888 Kids Way, Cityville', 51.53, -0.1, '555-3333', 'Open 24/7', '15-30 min', '["Pediatric Emergency", "Pediatric Surgery", "Child Psychology", "Neonatal Care"]'),
  ('Senior Care Clinic', 'Clinic', '999 Golden Years Rd, Cityville', 51.495, -0.08, '555-2222', 'Mon-Fri 8am-4pm', '10-20 min', '["Geriatric Medicine", "Memory Care", "Physical Therapy", "Home Care Services"]'),
  ('Urgent Care Center', 'Clinic', '111 Emergency Ln, Cityville', 51.51, -0.115, '555-1111', 'Daily 8am-10pm', '15-45 min', '["Urgent Care", "Minor Injuries", "X-rays", "Lab Tests"]')
ON CONFLICT DO NOTHING;

-- Insert sample disease outbreaks data
INSERT INTO disease_outbreaks (disease, severity, cases, latitude, longitude, start_date, status, description)
VALUES
  ('Influenza', 'medium', 45, 51.53, -0.12, NOW() - INTERVAL '2 weeks', 'Active', 'Seasonal flu outbreak with moderate spread in the northern part of the city.'),
  ('COVID-19', 'high', 78, 51.49, -0.11, NOW() - INTERVAL '1 month', 'Active', 'COVID-19 cluster with significant community transmission.'),
  ('Gastroenteritis', 'low', 23, 51.51, -0.07, NOW() - INTERVAL '1 week', 'Active', 'Foodborne illness outbreak linked to a local restaurant.'),
  ('Measles', 'medium', 12, 51.515, -0.11, NOW() - INTERVAL '3 weeks', 'Active', 'Measles outbreak in a local school. Vaccination campaign underway.'),
  ('Dengue Fever', 'low', 8, 51.49, -0.085, NOW() - INTERVAL '2 weeks', 'Active', 'Small cluster of dengue fever cases. Mosquito control measures implemented.')
ON CONFLICT DO NOTHING;

-- Insert sample health events data
INSERT INTO health_events (name, category, location, latitude, longitude, date, time, organizer, description)
VALUES
  ('Free Vaccination Drive', 'Vaccination', 'City Park, Cityville', 51.507, -0.11, NOW() + INTERVAL '1 week', '9:00 AM - 4:00 PM', 'City Health Department', 'Free flu and COVID-19 vaccinations for all residents.'),
  ('Blood Donation Camp', 'Blood Drive', 'Community Center, Cityville', 51.515, -0.095, NOW() + INTERVAL '2 weeks', '10:00 AM - 6:00 PM', 'Red Cross', 'Donate blood and save lives. All blood types needed.'),
  ('Diabetes Screening', 'Screening', 'Westside Medical Clinic', 51.51, -0.1, NOW() + INTERVAL '3 days', '1:00 PM - 5:00 PM', 'Diabetes Association', 'Free diabetes screening and risk assessment.'),
  ('Mental Health Awareness Workshop', 'Education', 'City Library, Cityville', 51.505, -0.085, NOW() + INTERVAL '10 days', '6:00 PM - 8:00 PM', 'Mental Health Alliance', 'Learn about mental health, stress management, and available resources.'),
  ('Cancer Awareness Walk', 'Education', 'Riverside Park, Cityville', 51.512, -0.105, NOW() + INTERVAL '3 weeks', '8:00 AM - 12:00 PM', 'Cancer Society', 'Join us for a walk to raise awareness about cancer prevention and early detection.'),
  ('Free Dental Checkup', 'Screening', 'Downtown Dental Clinic', 51.503, -0.088, NOW() + INTERVAL '5 days', '10:00 AM - 3:00 PM', 'Dental Association', 'Free dental checkups and oral hygiene education for all ages.'),
  ('Heart Health Seminar', 'Education', 'University Hospital', 51.525, -0.095, NOW() + INTERVAL '2 weeks', '2:00 PM - 4:00 PM', 'Heart Foundation', 'Learn about heart disease prevention, risk factors, and healthy lifestyle choices.'),
  ('Vision Screening', 'Screening', 'Community Center, Cityville', 51.515, -0.095, NOW() + INTERVAL '1 week', '9:00 AM - 1:00 PM', 'Vision Care Foundation', 'Free vision screening for children and adults.')
ON CONFLICT DO NOTHING;
