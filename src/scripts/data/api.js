import CONFIG from '../config.js';

const ENDPOINTS = {
  BASE: `${CONFIG.BASE_URL}`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
};

export default ENDPOINTS;