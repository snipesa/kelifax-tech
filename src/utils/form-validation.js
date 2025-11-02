// Form validation utilities for resource submission
// Handles client-side validation with specific rules for each field

import { CATEGORIES } from './config.js';

/**
 * Validate that a field does not contain pipe characters
 * Critical for backend database storage
 * @param {string} value - The value to validate
 * @param {string} fieldName - The field name for error messages
 * @returns {string|null} - Error message or null if valid
 */
export function validateNoPipeCharacter(value, fieldName) {
  if (value.includes('|')) {
    return `${fieldName} cannot contain the pipe character (|). Please use commas, dashes, or other separators instead.`;
  }
  return null;
}

/**
 * Validate clean text for better data quality
 * @param {string} value - The value to validate
 * @param {string} fieldName - The field name for error messages
 * @returns {string|null} - Error message or null if valid
 */
export function validateCleanText(value, fieldName) {
  // Check for pipe character (critical)
  if (value.includes('|')) {
    return `${fieldName} cannot contain the pipe character (|)`;
  }
  
  // Check for excessive special characters that might break formatting
  const problematicChars = /[<>{}[\]\\]/;
  if (problematicChars.test(value)) {
    return `${fieldName} contains invalid characters. Please avoid using < > { } [ ] \\`;
  }
  
  return null;
}

/**
 * Validate submitter information (Page 1)
 */
export const validateSubmitterInfo = {
  firstName: (value) => {
    if (!value || value.trim().length < 2) {
      return 'First name must be at least 2 characters long';
    }
    if (value.trim().length > 50) {
      return 'First name cannot exceed 50 characters';
    }
    if (!/^[a-zA-Z\s\-'\.]+$/.test(value.trim())) {
      return 'First name can only contain letters, spaces, hyphens, apostrophes, and periods';
    }
    return null;
  },

  lastName: (value) => {
    if (!value || value.trim().length < 2) {
      return 'Last name must be at least 2 characters long';
    }
    if (value.trim().length > 50) {
      return 'Last name cannot exceed 50 characters';
    }
    if (!/^[a-zA-Z\s\-'\.]+$/.test(value.trim())) {
      return 'Last name can only contain letters, spaces, hyphens, apostrophes, and periods';
    }
    return null;
  },

  company: (value) => {
    if (value && value.trim().length > 100) {
      return 'Company name cannot exceed 100 characters';
    }
    return null;
  },

  phoneNumber: (value) => {
    if (value && value.trim()) {
      // Basic international phone number validation
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        return 'Please enter a valid phone number';
      }
    }
    return null;
  },

  companyEmail: (value) => {
    if (!value || !value.trim()) {
      return 'Email address is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return 'Please enter a valid email address';
    }
    return null;
  }
};

/**
 * Validate resource information (Page 2)
 */
export const validateResourceInfo = {
  resourceName: (value) => {
    if (!value || value.trim().length < 3) {
      return 'Resource name must be at least 3 characters long';
    }
    if (value.trim().length > 100) {
      return 'Resource name cannot exceed 100 characters';
    }
    return null;
  },

  usagePurpose: (value) => {
    if (!value || value.trim().length < 20) {
      return 'Usage purpose must be at least 20 characters long';
    }
    if (value.trim().length > 500) {
      return 'Usage purpose cannot exceed 500 characters';
    }
    return null;
  },

  resourceUrl: (value) => {
    if (!value || !value.trim()) {
      return 'Resource URL is required';
    }
    try {
      new URL(value.trim());
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  category: (value) => {
    if (!value || !CATEGORIES.includes(value)) {
      return 'Please select a valid category';
    }
    return null;
  },

  tags: (value) => {
    if (value && value.trim()) {
      const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
      
      if (tags.length > 10) {
        return 'Maximum 10 tags allowed';
      }
      
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        if (tag.length > 30) {
          return `Tag "${tag}" exceeds 30 character limit`;
        }
        const pipeError = validateNoPipeCharacter(tag, `Tag "${tag}"`);
        if (pipeError) return pipeError;
      }
    }
    return null;
  }
};

/**
 * Validate extended details (Page 3)
 */
export const validateExtendedDetails = {
  keyFeatures: (features) => {
    if (!features || features.length < 3) {
      return 'At least 3 key features are required';
    }
    if (features.length > 10) {
      return 'Maximum 10 key features allowed';
    }
    
    for (let i = 0; i < features.length; i++) {
      const feature = features[i].trim();
      if (feature.length < 10) {
        return `Key feature ${i + 1} must be at least 10 characters long`;
      }
      if (feature.length > 200) {
        return `Key feature ${i + 1} cannot exceed 200 characters`;
      }
      const pipeError = validateNoPipeCharacter(feature, `Key Feature ${i + 1}`);
      if (pipeError) return pipeError;
    }
    return null;
  },

  useCases: (useCases) => {
    if (!useCases || useCases.length < 2) {
      return 'At least 2 use cases are required';
    }
    if (useCases.length > 8) {
      return 'Maximum 8 use cases allowed';
    }
    
    for (let i = 0; i < useCases.length; i++) {
      const useCase = useCases[i].trim();
      if (useCase.length < 15) {
        return `Use case ${i + 1} must be at least 15 characters long`;
      }
      if (useCase.length > 300) {
        return `Use case ${i + 1} cannot exceed 300 characters`;
      }
      const pipeError = validateNoPipeCharacter(useCase, `Use Case ${i + 1}`);
      if (pipeError) return pipeError;
    }
    return null;
  },

  learningResources: (resources) => {
    if (resources && resources.length > 5) {
      return 'Maximum 5 learning resources allowed';
    }
    
    if (resources) {
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        
        if (!resource.title || resource.title.trim().length === 0) {
          return `Learning resource ${i + 1} title is required`;
        }
        
        if (resource.title.trim().length > 100) {
          return `Learning resource ${i + 1} title cannot exceed 100 characters`;
        }
        
        const pipeError = validateNoPipeCharacter(resource.title, `Learning Resource ${i + 1} Title`);
        if (pipeError) return pipeError;
        
        if (!resource.url || resource.url.trim().length === 0) {
          return `Learning resource ${i + 1} URL is required`;
        }
        
        try {
          new URL(resource.url.trim());
        } catch {
          return `Learning resource ${i + 1} has an invalid URL`;
        }
        
        const validTypes = ['documentation', 'tutorial', 'video', 'course'];
        if (!resource.type || !validTypes.includes(resource.type)) {
          return `Learning resource ${i + 1} must have a valid type`;
        }
      }
    }
    return null;
  }
};

/**
 * Validate a complete form page
 * @param {number} pageNumber - The page number (1, 2, or 3)
 * @param {object} formData - The form data for the page
 * @returns {object} - Validation result with isValid and errors properties
 */
export function validateFormPage(pageNumber, formData) {
  const errors = {};
  let isValid = true;

  switch (pageNumber) {
    case 1:
      // Validate submitter information
      Object.keys(validateSubmitterInfo).forEach(field => {
        const error = validateSubmitterInfo[field](formData[field]);
        if (error) {
          errors[field] = error;
          isValid = false;
        }
      });
      break;

    case 2:
      // Validate resource information
      Object.keys(validateResourceInfo).forEach(field => {
        const error = validateResourceInfo[field](formData[field]);
        if (error) {
          errors[field] = error;
          isValid = false;
        }
      });
      break;

    case 3:
      // Validate extended details
      Object.keys(validateExtendedDetails).forEach(field => {
        const error = validateExtendedDetails[field](formData[field]);
        if (error) {
          errors[field] = error;
          isValid = false;
        }
      });
      break;

    default:
      isValid = false;
      errors.general = 'Invalid page number';
  }

  return { isValid, errors };
}
