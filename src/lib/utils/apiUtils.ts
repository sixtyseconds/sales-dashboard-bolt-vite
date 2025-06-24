import { toast } from 'sonner';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoff?: boolean;
  showToast?: boolean;
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  backoff: true,
  showToast: true
};

/**
 * Enhanced fetch with automatic retry logic for connection resilience
 */
export async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const config = { ...defaultOptions, ...retryOptions };
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries!; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If successful, return the response
      if (response.ok) {
        // If we had previous failures, show success message
        if (attempt > 0 && config.showToast) {
          toast.success('Connection restored!');
        }
        return response;
      }
      
      // If it's a 4xx error, don't retry (client error)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }
      
      // For 5xx errors, treat as retry-able
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
      
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error
      const isConnectionError = 
        error.name === 'TypeError' ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NETWORK');
      
      // If it's the last attempt, don't retry
      if (attempt === config.maxRetries) {
        if (config.showToast) {
          if (isConnectionError) {
            toast.error('🔌 Connection lost. Please check if the API server is running.');
          } else {
            toast.error(`API Error: ${error.message}`);
          }
        }
        throw error;
      }
      
      // Show retry message on first failure
      if (attempt === 0 && config.showToast && isConnectionError) {
        toast.warning('🔄 Connection issue detected. Retrying...');
      }
      
      // Calculate delay with optional exponential backoff
      const delay = config.backoff 
        ? config.retryDelay! * Math.pow(2, attempt)
        : config.retryDelay!;
      
      console.warn(`API request failed (attempt ${attempt + 1}/${config.maxRetries! + 1}), retrying in ${delay}ms:`, error.message);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Enhanced API call wrapper with JSON handling and error management
 */
export async function apiCall<T>(
  url: string, 
  options: RequestInit = {}, 
  retryOptions: RetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }, retryOptions);
  
  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  return result.data || result;
}

/**
 * Check API health and connection status
 */
export async function checkApiHealth(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetchWithRetry(`${baseUrl}/health`, {}, { 
      maxRetries: 1, 
      showToast: false 
    });
    
    if (response.ok) {
      const health = await response.json();
      return health.status === 'healthy';
    }
    
    return false;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
}

/**
 * Monitor API connection and show status updates
 */
export function createApiMonitor(baseUrl: string, intervalMs: number = 30000) {
  let isHealthy = true;
  let checkInterval: NodeJS.Timeout;
  
  const checkHealth = async () => {
    const currentHealth = await checkApiHealth(baseUrl);
    
    if (currentHealth !== isHealthy) {
      isHealthy = currentHealth;
      
      if (currentHealth) {
        toast.success('🟢 API connection restored');
      } else {
        toast.error('🔴 API connection lost - Please restart the server');
      }
    }
  };
  
  // Start monitoring
  const start = () => {
    checkInterval = setInterval(checkHealth, intervalMs);
    checkHealth(); // Initial check
  };
  
  // Stop monitoring
  const stop = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
  };
  
  return { start, stop, checkHealth };
} 