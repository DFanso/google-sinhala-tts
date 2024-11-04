require('dotenv').config();
const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Create a new Text-to-Speech client instance
const client = new textToSpeech.TextToSpeechClient();

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Function to convert Sinhala Unicode to phonetic transcription
function sinhalaToPhonetic(unicodeText) {
    // Comprehensive mapping for Sinhala Unicode to phonetic transcription.
    const mapping = {
        'අ': 'a', 'ආ': 'aa', 'ඇ': 'æ', 'ඈ': 'ææ', 'ඉ': 'i', 'ඊ': 'ii', 'උ': 'u', 'ඌ': 'uu',
        'එ': 'e', 'ඒ': 'ee', 'ඓ': 'ai', 'ඔ': 'o', 'ඕ': 'oo', 'ඖ': 'au',
        'ක': 'ka', 'ඛ': 'kha', 'ග': 'ga', 'ඝ': 'gha', 'ඞ': 'nga',
        'ච': 'cha', 'ඡ': 'chha', 'ජ': 'ja', 'ඣ': 'jha', 'ඤ': 'nya',
        'ට': 'ta', 'ඨ': 'tha', 'ඩ': 'da', 'ඪ': 'dha', 'ණ': 'na',
        'ත': 'tha', 'ථ': 'thha', 'ද': 'da', 'ධ': 'dha', 'න': 'na',
        'ප': 'pa', 'ඵ': 'pha', 'බ': 'ba', 'භ': 'bha', 'ම': 'ma',
        'ය': 'ya', 'ර': 'ra', 'ල': 'la', 'ව': 'wa', 'ශ': 'sha', 'ෂ': 'ssa',
        'ස': 'sa', 'හ': 'ha', 'ළ': 'la', 'ෆ': 'fa',
        'ඍ': 'ri', 'ඎ': 'rii',
        // Vowel diacritics
        'ා': 'a', 'ැ': 'æ', 'ෑ': 'ææ', 'ි': 'i', 'ී': 'ii',
        'ු': 'u', 'ූ': 'uu', 'ෘ': 'ru', 'ෲ': 'ruu',
        'ෙ': 'e', 'ේ': 'ee', 'ෛ': 'ai', 'ො': 'o', 'ෝ': 'oo', 'ෞ': 'au',
        'ං': 'n', 'ඃ': 'h',
        // Combined phonemes
        'ක්': 'k', 'ක්‍ර': 'kra', 'ත්': 't', 'ත්‍ර': 'tra', 'ඳ': 'nd',
        'ඳු': 'ndu', 'ඬ': 'nda', 'ඬු': 'ndu', 'ඹ': 'mba',
        'භ්': 'bh', 'ව්': 'v', 'ස්': 's', 'ශ්': 'sh',
        'හ්': 'h', 'ක්ෂ': 'ksha', 'ග්‍ර': 'gra',
        // Special cases and diphthongs
        'යු': 'yu', 'යූ': 'yuu', 'වේ': 'vee', 'යෝ': 'yo',
        'ද්‍ර': 'dra', 'ප්‍ර': 'pra', 'ප්': 'p', 'ශ්‍ර': 'shra'
    };

    // Convert the input text by replacing characters using the mapping
    let phoneticText = '';
    for (const char of unicodeText) {
        phoneticText += mapping[char] || char;
    }

    return phoneticText;
}

app.post('/synthesize', async (req, res) => {
    const { text } = req.body;

    // Convert the input Sinhala Unicode text to phonetic transcription
    const phoneticText = sinhalaToPhonetic(text);

    console.log(phoneticText)

    // Break the text into smaller phrases for better TTS handling
    const formattedText = phoneticText.split(/([.,!?\s])/).map(phrase => phrase.trim() ? `<prosody pitch="0.5st">${phrase}</prosody>` : phrase).join(' ');

    const request = {
        input: { ssml: `<speak>${formattedText}</speak>` },
        voice: { languageCode: 'en-US', name: 'en-IN-Wavenet-B' },
        audioConfig: {
            audioEncoding: 'MP3',
            pitch: 4.0,
            speakingRate: 0.8,
            volumeGainDb: 2.0 
        }
    };

    try {
        const [response] = await client.synthesizeSpeech(request);
        const filePath = path.join(__dirname, 'output.mp3');
        const writeFile = util.promisify(fs.writeFile);

        await writeFile(filePath, response.audioContent, 'binary');
        res.sendFile(filePath);
    } catch (err) {
        console.error('Error synthesizing speech:', err);
        res.status(500).send('Error synthesizing speech');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});