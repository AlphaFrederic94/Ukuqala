import { supabase } from '../lib/supabaseClient';
import { StudentVerification } from './studentVerificationService';
import axios from 'axios';

// Email domain verification
const TRUSTED_MEDICAL_SCHOOL_DOMAINS = [
  'harvard.edu', 'stanford.edu', 'yale.edu', 'hopkins.edu', 'ucsf.edu',
  'med.cornell.edu', 'columbia.edu', 'med.upenn.edu', 'duke.edu', 'med.umich.edu',
  'med.nyu.edu', 'uclahealth.org', 'uchicago.edu', 'wustl.edu', 'northwestern.edu',
  'vanderbilt.edu', 'utsouthwestern.edu', 'bwh.harvard.edu', 'mgh.harvard.edu',
  'mayo.edu', 'jhmi.edu', 'med.unc.edu', 'med.usc.edu', 'med.washington.edu',
  'med.pitt.edu', 'med.emory.edu', 'med.wisc.edu', 'med.umn.edu', 'med.ufl.edu',
  'med.osu.edu', 'med.utah.edu', 'med.virginia.edu', 'med.uiowa.edu', 'med.uc.edu',
  'med.uab.edu', 'med.ucdavis.edu', 'med.brown.edu', 'med.dartmouth.edu', 'med.tufts.edu',
  'med.bu.edu', 'med.rochester.edu', 'med.miami.edu', 'med.arizona.edu', 'med.uci.edu',
  'med.ucsd.edu', 'med.temple.edu', 'med.drexel.edu', 'med.jefferson.edu', 'med.georgetown.edu',
  'med.gwu.edu', 'med.rush.edu', 'med.tulane.edu', 'med.lsuhsc.edu', 'med.musc.edu',
  'med.iu.edu', 'med.wayne.edu', 'med.msu.edu', 'med.uky.edu', 'med.missouri.edu',
  'med.creighton.edu', 'med.unmc.edu', 'med.stonybrook.edu', 'med.buffalo.edu', 'med.rutgers.edu',
  'med.njms.rutgers.edu', 'med.umdnj.edu', 'med.vcu.edu', 'med.mcw.edu', 'med.bcm.edu',
  'med.utmb.edu', 'med.uth.tmc.edu', 'med.tamhsc.edu', 'med.ttuhsc.edu', 'med.unthsc.edu',
  'med.lsuhsc-s.edu', 'med.uams.edu', 'med.kumc.edu', 'med.okstate.edu', 'med.ouhsc.edu',
  'med.unm.edu', 'med.arizona.edu', 'med.utah.edu', 'med.hsc.utah.edu', 'med.colorado.edu',
  'med.cuanschutz.edu', 'med.oregonstate.edu', 'med.ohsu.edu', 'med.wsu.edu', 'med.uw.edu',
  'student.', 'students.', 'edu.', 'ac.uk', 'ac.in', 'ac.jp', 'edu.au', 'edu.sg', 'edu.my',
  'edu.cn', 'edu.hk', 'edu.tw', 'edu.ph', 'edu.vn', 'edu.th', 'edu.sa', 'edu.qa', 'edu.ae',
  'edu.eg', 'edu.za', 'edu.ng', 'edu.gh', 'edu.ke', 'edu.et', 'edu.tz', 'edu.ug', 'edu.zm',
  'edu.zw', 'edu.mx', 'edu.br', 'edu.ar', 'edu.cl', 'edu.co', 'edu.pe', 'edu.ec', 'edu.ve',
  'edu.do', 'edu.pr', 'edu.jm', 'edu.tt', 'edu.bs', 'edu.bb', 'edu.ca'
];

// Keywords that indicate a medical school website
const MEDICAL_SCHOOL_KEYWORDS = [
  'medical', 'medicine', 'health', 'healthcare', 'doctor', 'physician',
  'nursing', 'nurse', 'dental', 'dentistry', 'pharmacy', 'pharmaceutical',
  'clinical', 'hospital', 'patient', 'surgery', 'surgical', 'anatomy',
  'physiology', 'biochemistry', 'pathology', 'microbiology', 'immunology',
  'neurology', 'cardiology', 'oncology', 'pediatrics', 'psychiatry',
  'radiology', 'anesthesiology', 'orthopedics', 'dermatology', 'ophthalmology',
  'otolaryngology', 'urology', 'gynecology', 'obstetrics', 'endocrinology',
  'gastroenterology', 'hematology', 'nephrology', 'pulmonology', 'rheumatology',
  'med school', 'medical school', 'school of medicine', 'faculty of medicine',
  'college of medicine', 'department of medicine', 'division of medicine',
  'institute of medicine', 'center for medicine', 'centre for medicine',
  'medical center', 'medical centre', 'health sciences', 'life sciences',
  'biomedical', 'biomedicine', 'medical education', 'medical research',
  'medical training', 'medical degree', 'md program', 'mbbs program',
  'medical program', 'medical curriculum', 'medical student', 'medical students'
];

// Function to check if email domain is from a trusted medical school
const isTrustedMedicalSchoolEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // Check if the domain is in our trusted list
  return TRUSTED_MEDICAL_SCHOOL_DOMAINS.some(trustedDomain =>
    domain === trustedDomain || domain.endsWith('.' + trustedDomain)
  );
};

// Function to check if a website is likely a medical school website
const isMedicalSchoolWebsite = async (url: string): Promise<boolean> => {
  try {
    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Fetch website content
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const content = response.data.toLowerCase();

    // Check if content contains medical school keywords
    return MEDICAL_SCHOOL_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()));
  } catch (error) {
    console.error('Error checking website:', error);
    // If we can't check the website, we'll be conservative and return false
    return false;
  }
};

// Function to verify a student automatically
export const autoVerifyStudent = async (verification: StudentVerification): Promise<{
  verified: boolean;
  reason: string;
}> => {
  try {
    // Check if email domain is from a trusted medical school
    const emailTrusted = isTrustedMedicalSchoolEmail(verification.school_email);

    // If email is trusted, we can verify immediately
    if (emailTrusted) {
      return {
        verified: true,
        reason: 'Verified based on trusted medical school email domain'
      };
    }

    // Check if website is a medical school website
    const websiteMedical = await isMedicalSchoolWebsite(verification.school_website);

    // If website is medical and they've uploaded documents, we can verify
    if (websiteMedical && verification.document_urls.length > 0) {
      return {
        verified: true,
        reason: 'Verified based on medical school website and uploaded documents'
      };
    }

    // If we can't verify automatically, return false
    return {
      verified: false,
      reason: 'Could not verify automatically. Manual verification required.'
    };
  } catch (error) {
    console.error('Error in auto verification:', error);
    return {
      verified: false,
      reason: 'Error during verification process'
    };
  }
};

// Function to process verification with timeout
export const processVerificationWithTimeout = async (
  verification: StudentVerification,
  timeoutMs: number = 120000 // 2 minutes by default (reduced from 5 minutes)
): Promise<{
  verified: boolean;
  reason: string;
  timeElapsed: number;
}> => {
  const startTime = Date.now();

  // Try auto verification first
  const autoResult = await autoVerifyStudent(verification);

  if (autoResult.verified) {
    const timeElapsed = Date.now() - startTime;
    return {
      ...autoResult,
      timeElapsed
    };
  }

  // If auto verification fails, set a timeout for manual verification
  return new Promise((resolve) => {
    // Set a timeout to auto-verify after the specified time (2 minutes)
    const timeoutId = setTimeout(() => {
      const timeElapsed = Date.now() - startTime;
      resolve({
        verified: true,
        reason: 'Auto-verified after 2 minutes to ensure quick access',
        timeElapsed
      });
    }, timeoutMs);

    // Check more frequently - every 15 seconds instead of 30
    const checkInterval = setInterval(async () => {
      try {
        // Use a retry mechanism for the status check
        let retryCount = 0;
        let success = false;
        let data: any = null;

        while (retryCount < 3 && !success) {
          try {
            const result = await supabase
              .from('student_verifications')
              .select('verification_status, verification_notes')
              .eq('id', verification.id)
              .single();

            if (result.error) {
              throw result.error;
            }

            data = result.data;
            success = true;
          } catch (err) {
            retryCount++;
            if (retryCount < 3) {
              // Wait a bit before retrying
              await new Promise(r => setTimeout(r, 1000));
            } else {
              console.error('Error checking verification status after retries:', err);
              return; // Skip this check interval
            }
          }
        }

        if (!success || !data) return;

        if (data.verification_status === 'verified') {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);

          const timeElapsed = Date.now() - startTime;
          resolve({
            verified: true,
            reason: data.verification_notes || 'Manually verified by admin',
            timeElapsed
          });
        } else if (data.verification_status === 'rejected') {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);

          const timeElapsed = Date.now() - startTime;
          resolve({
            verified: false,
            reason: data.verification_notes || 'Rejected by admin',
            timeElapsed
          });
        }
      } catch (error) {
        console.error('Error in verification check interval:', error);
      }
    }, 15000); // Check every 15 seconds (more frequent)
  });
};
