# Shared Types and Constants

This directory contains shared types, constants, and utilities used across the frontend and backend.

## Structure

```
shared/
├── types/           # TypeScript type definitions
├── constants/       # Application constants
├── utils/           # Utility functions
└── schemas/         # Data validation schemas
```

## Types

### User Types
```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  access_level: string;
  height?: number;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  created_at: string;
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

### API Types
```typescript
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
```

### OpenAI Types
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

## Constants

### API Endpoints
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
} as const;
```

### Application Constants
```typescript
export const APP_CONSTANTS = {
  TOKEN_STORAGE_KEY: 'access_token',
  REFRESH_TOKEN_STORAGE_KEY: 'refresh_token',
  MAX_PROMPT_LENGTH: 2000,
  DEFAULT_PAGE_SIZE: 20,
} as const;
```

### Error Messages
```typescript
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const;
```

## Utilities

### Validation Utilities
```typescript
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const validateUsername = (username: string): boolean => {
  return username.length >= 3 && username.length <= 50;
};
```

### Formatting Utilities
```typescript
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};
```

### Storage Utilities
```typescript
export const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Handle storage error
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Handle storage error
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch {
      // Handle storage error
    }
  },
};
```

## Schemas

### Validation Schemas
```typescript
export const validationSchemas = {
  login: {
    username: { required: true, minLength: 3 },
    password: { required: true, minLength: 8 },
  },
  register: {
    username: { required: true, minLength: 3, maxLength: 50 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, minLength: 8 },
    password_confirm: { required: true, match: 'password' },
  },
  openaiPrompt: {
    prompt: { required: true, maxLength: 2000 },
  },
};
```

## Usage

### In Frontend
```typescript
import { User, ApiResponse, API_ENDPOINTS } from '../shared/types';
import { validateEmail, formatDate } from '../shared/utils';

// Use types for type safety
const user: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  access_level: 'user',
  created_at: '2024-01-01T00:00:00Z',
};

// Use constants for API calls
const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
  method: 'POST',
  body: JSON.stringify(credentials),
});

// Use utilities for validation and formatting
if (validateEmail(user.email)) {
  console.log('Valid email');
}

const formattedDate = formatDate(user.created_at);
```

### In Backend
```python
# Python equivalent types and constants
from typing import Dict, Optional, Union
from dataclasses import dataclass

@dataclass
class User:
    id: int
    username: str
    email: str
    access_level: str
    height: Optional[float] = None
    birthday: Optional[str] = None
    gender: Optional[str] = None
    created_at: str = ""

API_ENDPOINTS = {
    'AUTH': {
        'LOGIN': '/api/auth/login/',
        'REGISTER': '/api/auth/register/',
        'LOGOUT': '/api/auth/logout/',
        'PROFILE': '/api/auth/profile/',
    },
    'OPENAI': {
        'PROMPT': '/api/openai/prompt/',
        'USAGE': '/api/openai/usage/',
    },
}

def validate_email(email: str) -> bool:
    import re
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None
```

## Benefits

### Type Safety
- Consistent data structures across frontend and backend
- Compile-time error checking
- Better IDE support and autocomplete

### Code Reuse
- Shared validation logic
- Common utility functions
- Consistent API endpoint definitions

### Maintainability
- Single source of truth for types and constants
- Easier refactoring and updates
- Reduced code duplication

### Documentation
- Self-documenting code through types
- Clear interface definitions
- Better understanding of data flow
