# Shared Developer Guide

Technical documentation for developers and AI agents working with shared types, constants, and utilities.

## Architecture Overview

The shared directory provides a common foundation for both frontend and backend development:

```
shared/
├── types/           # TypeScript/Python type definitions
├── constants/       # Application-wide constants
├── utils/           # Utility functions
├── schemas/         # Data validation schemas
└── README.md        # Usage documentation
```

## Type System Design

### Type Hierarchy

#### Base Types
```typescript
// Core application types
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at?: string;
}

export interface User extends BaseEntity {
  username: string;
  email: string;
  access_level: string;
  height?: number;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}
```

#### Authentication Types
```typescript
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  height?: number;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
}
```

#### OpenAI Integration Types
```typescript
export interface OpenAIPrompt {
  prompt: string;
}

export interface OpenAIResponse {
  response: string;
  tokens_used: number;
  cost: number;
  response_time: number;
}

export interface UsageStats {
  total_tokens: number;
  total_cost: number;
  total_requests: number;
  successful_requests: number;
  success_rate: number;
}
```

### Type Safety Patterns

#### Generic Response Types
```typescript
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  next?: string;
  previous?: string;
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
}
```

#### Union Types for State Management
```typescript
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type AuthState = {
  user: User | null;
  tokens: AuthTokens | null;
  loading: LoadingState;
  error: string | null;
};
```

## Constants Architecture

### API Endpoint Management
```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login/',
    REGISTER: '/api/auth/register/',
    LOGOUT: '/api/auth/logout/',
    PROFILE: '/api/auth/profile/',
    UPDATE_PROFILE: '/api/auth/profile/update/',
    CHANGE_PASSWORD: '/api/auth/change-password/',
    REFRESH_TOKEN: '/api/auth/token/refresh/',
  },
  OPENAI: {
    PROMPT: '/api/openai/prompt/',
    USAGE: '/api/openai/usage/',
  },
  USERS: {
    LIST: '/api/users/',
    DETAIL: (id: number) => `/api/users/${id}/`,
  },
  FOODS: {
    LIST: '/api/foods/',
    DETAIL: (id: number) => `/api/foods/${id}/`,
    SEARCH: '/api/foods/search/',
  },
} as const;
```

### Application Configuration
```typescript
export const APP_CONFIG = {
  TOKEN_STORAGE_KEY: 'access_token',
  REFRESH_TOKEN_STORAGE_KEY: 'refresh_token',
  MAX_PROMPT_LENGTH: 2000,
  DEFAULT_PAGE_SIZE: 20,
  API_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;
```

### Error Handling Constants
```typescript
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [ERROR_CODES.AUTHENTICATION_ERROR]: 'Authentication failed. Please login again.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later.',
  [ERROR_CODES.RATE_LIMIT_ERROR]: 'Rate limit exceeded. Please try again later.',
} as const;
```

## Utility Functions

### Validation Utilities
```typescript
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
  
  username: (username: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (username.length > 50) {
      errors.push('Username must be less than 50 characters');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
```

### Formatting Utilities
```typescript
export const formatters = {
  date: (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    return new Date(date).toLocaleDateString('en-US', {
      ...defaultOptions,
      ...options,
    });
  },
  
  currency: (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },
  
  number: (num: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat('en-US', options).format(num);
  },
  
  percentage: (value: number, decimals = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },
};
```

### Storage Utilities
```typescript
export const storage = {
  get: <T = string>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as T;
      }
    } catch {
      return null;
    }
  },
  
  set: <T = string>(key: string, value: T): boolean => {
    try {
      const serialized = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
  
  // Token-specific utilities
  tokens: {
    getAccess: (): string | null => storage.get(APP_CONFIG.TOKEN_STORAGE_KEY),
    getRefresh: (): string | null => storage.get(APP_CONFIG.REFRESH_TOKEN_STORAGE_KEY),
    setAccess: (token: string): boolean => storage.set(APP_CONFIG.TOKEN_STORAGE_KEY, token),
    setRefresh: (token: string): boolean => storage.set(APP_CONFIG.REFRESH_TOKEN_STORAGE_KEY, token),
    clear: (): boolean => {
      const accessRemoved = storage.remove(APP_CONFIG.TOKEN_STORAGE_KEY);
      const refreshRemoved = storage.remove(APP_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
      return accessRemoved && refreshRemoved;
    },
  },
};
```

## Schema Validation

### Frontend Validation Schemas
```typescript
export const schemas = {
  login: {
    username: { 
      required: true, 
      minLength: 3,
      maxLength: 50,
    },
    password: { 
      required: true, 
      minLength: 8,
    },
  },
  
  register: {
    username: { 
      required: true, 
      minLength: 3, 
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_]+$/,
    },
    email: { 
      required: true, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { 
      required: true, 
      minLength: 8,
    },
    password_confirm: { 
      required: true, 
      match: 'password',
    },
  },
  
  openaiPrompt: {
    prompt: { 
      required: true, 
      maxLength: 2000,
      minLength: 1,
    },
  },
  
  profile: {
    username: { 
      required: true, 
      minLength: 3, 
      maxLength: 50,
    },
    email: { 
      required: true, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    height: { 
      required: false, 
      min: 50, 
      max: 300,
    },
  },
};
```

### Backend Validation Schemas (Python)
```python
from dataclasses import dataclass
from typing import Optional, Dict, Any
import re

@dataclass
class ValidationRule:
    required: bool = False
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    pattern: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None

class ValidationSchemas:
    LOGIN = {
        'username': ValidationRule(required=True, min_length=3, max_length=50),
        'password': ValidationRule(required=True, min_length=8),
    }
    
    REGISTER = {
        'username': ValidationRule(
            required=True, 
            min_length=3, 
            max_length=50,
            pattern=r'^[a-zA-Z0-9_]+$'
        ),
        'email': ValidationRule(
            required=True,
            pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        ),
        'password': ValidationRule(required=True, min_length=8),
        'password_confirm': ValidationRule(required=True),
    }
    
    OPENAI_PROMPT = {
        'prompt': ValidationRule(required=True, max_length=2000, min_length=1),
    }

def validate_field(value: Any, rule: ValidationRule) -> Dict[str, Any]:
    errors = []
    
    if rule.required and (value is None or value == ''):
        errors.append('This field is required')
    
    if value is not None and value != '':
        if rule.min_length and len(str(value)) < rule.min_length:
            errors.append(f'Minimum length is {rule.min_length}')
        
        if rule.max_length and len(str(value)) > rule.max_length:
            errors.append(f'Maximum length is {rule.max_length}')
        
        if rule.pattern and not re.match(rule.pattern, str(value)):
            errors.append('Invalid format')
        
        if rule.min_value is not None and float(value) < rule.min_value:
            errors.append(f'Minimum value is {rule.min_value}')
        
        if rule.max_value is not None and float(value) > rule.max_value:
            errors.append(f'Maximum value is {rule.max_value}')
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }
```

## Cross-Platform Compatibility

### TypeScript to Python Mapping
```typescript
// TypeScript interfaces
export interface User {
  id: number;
  username: string;
  email: string;
  access_level: string;
}
```

```python
# Python equivalent
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: int
    username: str
    email: str
    access_level: str
    height: Optional[float] = None
    birthday: Optional[str] = None
    gender: Optional[str] = None
```

### Constant Mapping
```typescript
// TypeScript constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login/',
    REGISTER: '/api/auth/register/',
  },
} as const;
```

```python
# Python equivalent
from typing import Dict, Any

API_ENDPOINTS: Dict[str, Any] = {
    'AUTH': {
        'LOGIN': '/api/auth/login/',
        'REGISTER': '/api/auth/register/',
    },
}
```

## Best Practices

### Type Design
- Use interfaces for object shapes
- Use union types for state variations
- Use generic types for reusable patterns
- Keep types focused and specific

### Constant Management
- Use `as const` for immutable constants
- Group related constants together
- Use descriptive names
- Avoid magic numbers and strings

### Utility Functions
- Keep functions pure and side-effect free
- Use proper error handling
- Provide fallback values
- Document function behavior

### Schema Validation
- Define schemas close to their usage
- Use consistent validation rules
- Provide clear error messages
- Support both client and server validation

## Integration Patterns

### Frontend Integration
```typescript
import { User, ApiResponse, API_ENDPOINTS } from '../shared/types';
import { validators, formatters, storage } from '../shared/utils';

// Use types for API calls
const fetchUser = async (id: number): Promise<ApiResponse<User>> => {
  const response = await fetch(`${API_ENDPOINTS.USERS.DETAIL(id)}`);
  return response.json();
};

// Use validators for form validation
const validateForm = (data: any) => {
  const usernameValidation = validators.username(data.username);
  const emailValidation = validators.email(data.email);
  
  return {
    valid: usernameValidation.valid && emailValidation.valid,
    errors: [...usernameValidation.errors, ...emailValidation.errors],
  };
};

// Use formatters for display
const displayUser = (user: User) => {
  return {
    name: user.username,
    email: user.email,
    joined: formatters.date(user.created_at),
  };
};
```

### Backend Integration
```python
from shared.types import User, ApiResponse
from shared.constants import API_ENDPOINTS
from shared.utils import validate_field, ValidationSchemas

# Use types for serialization
def serialize_user(user) -> dict:
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'access_level': user.access_level.role_name,
        'created_at': user.created_at.isoformat(),
    }

# Use validation schemas
def validate_registration_data(data: dict) -> dict:
    errors = {}
    
    for field, rule in ValidationSchemas.REGISTER.items():
        validation_result = validate_field(data.get(field), rule)
        if not validation_result['valid']:
            errors[field] = validation_result['errors']
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
    }
```

## Maintenance Guidelines

### Adding New Types
1. Define the interface in `types/`
2. Add corresponding Python class if needed
3. Update validation schemas
4. Add utility functions if needed
5. Update documentation

### Adding New Constants
1. Add to appropriate constant object
2. Use TypeScript `as const` assertion
3. Add Python equivalent if needed
4. Update API endpoint references
5. Test constant usage

### Adding New Utilities
1. Keep functions pure and focused
2. Add proper TypeScript types
3. Include error handling
4. Add unit tests
5. Document usage examples
