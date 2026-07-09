import logger from '../../utils/logger.js';

export const voiceSearchEngine = {
  async parseTranscript(transcript) {
    logger.info(`🎙️ [VOICE SPEECH DECODER] Parsing verbal transcript: "${transcript}"`);
    
    // Clean and normalize transcript command phrases
    let cleaned = transcript.toLowerCase().trim();

    // Remove common search filler phrases
    const filters = [
      'find me some',
      'find me',
      'search for',
      'i want to eat',
      'i want',
      'show me',
      'order some',
      'order',
    ];

    for (const f of filters) {
      if (cleaned.startsWith(f)) {
        cleaned = cleaned.replace(f, '').trim();
      }
    }

    return cleaned;
  },
};
