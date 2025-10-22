const Joi = require('joi')

// Phone number validation for Kenya
const kenyanPhoneRegex = /^(\+254|0)[17]\d{8}$/

const authValidators = {
  
  // User registration validation
  register: Joi.object({
    phoneNumber: Joi.string()
      .pattern(kenyanPhoneRegex)
      .required()
      .messages({
        'string.pattern.base': 'Please enter a valid Kenyan phone number (e.g., +254700123456 or 0700123456)',
        'any.required': 'Phone number is required'
      }),
    
    email: Joi.string()
      .email()
      .optional()
      .allow('', null),
    
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
      }),
    
    fullName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name cannot exceed 100 characters',
        'any.required': 'Full name is required'
      }),
    
    ageGroup: Joi.string()
      .valid('18-25', '26-35', '36-45', '46-55', '56-65', '65+')
      .required()
      .messages({
        'any.only': 'Please select a valid age group',
        'any.required': 'Age group is required'
      }),
    
    gender: Joi.string()
      .valid('male', 'female', 'other', 'prefer_not_to_say')
      .required()
      .messages({
        'any.only': 'Please select a valid gender option',
        'any.required': 'Gender is required'
      }),
    
    countyName: Joi.string()
      .required()
      .messages({
        'any.required': 'County is required'
      }),
    
    constituencyName: Joi.string()
      .optional()
      .allow('', null),
    
    wardName: Joi.string()
      .optional()
      .allow('', null),
    
    educationLevel: Joi.string()
      .optional()
      .allow('', null),
    
    occupation: Joi.string()
      .optional()
      .allow('', null)
  }),

  // Login validation
  login: Joi.object({
    phoneOrEmail: Joi.string()
      .required()
      .messages({
        'any.required': 'Phone number or email is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Phone verification
  verifyPhone: Joi.object({
    phoneNumber: Joi.string()
      .pattern(kenyanPhoneRegex)
      .required(),
    
    verificationCode: Joi.string()
      .length(6)
      .pattern(/^\d+$/)
      .required()
      .messages({
        'string.length': 'Verification code must be 6 digits',
        'string.pattern.base': 'Verification code must contain only numbers'
      })
  }),

  // Password reset request
  requestPasswordReset: Joi.object({
    phoneOrEmail: Joi.string()
      .required()
      .messages({
        'any.required': 'Phone number or email is required'
      })
  }),

  // Password reset confirmation
  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'New password is required'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
      })
  })
}

module.exports = {
  authValidators,
  kenyanPhoneRegex
}