import {LANGUAGES} from '../constants/enums';

export const languageCode = (language: String) => {
  switch (language) {
    case LANGUAGES.ESPANOL:
      return 'es';
      break;
    case LANGUAGES.PORTUGUESE:
      return 'po';
      break;
    case LANGUAGES.ITALIAN:
      return 'it';
      break;
    case LANGUAGES.ROMANIAN:
      return 'ro';
      break;
    default:
      return 'en';
      break;
  }
};
