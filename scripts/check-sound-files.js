import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the required sound files
const requiredSoundFiles = [
  {
    name: 'message-sent.mp3',
    url: 'https://www.soundjay.com/buttons/sounds/button-3.mp3'
  },
  {
    name: 'message-typing.mp3',
    url: 'https://www.soundjay.com/buttons/sounds/button-24.mp3'
  },
  {
    name: 'notification.mp3',
    url: 'https://www.soundjay.com/buttons/sounds/button-10.mp3'
  }
];

// Create the sounds directory if it doesn't exist
const soundsDir = path.join(__dirname, 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
  console.log('Creating sounds directory...');
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Check for each sound file and download if missing
requiredSoundFiles.forEach(file => {
  const filePath = path.join(soundsDir, file.name);

  if (!fs.existsSync(filePath)) {
    console.log(`Sound file ${file.name} is missing. Downloading from ${file.url}...`);

    const fileStream = fs.createWriteStream(filePath);
    https.get(file.url, response => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded ${file.name} successfully.`);
      });
    }).on('error', err => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      console.error(`Error downloading ${file.name}:`, err.message);
    });
  } else {
    console.log(`Sound file ${file.name} exists.`);
  }
});

console.log('Sound file check complete.');
