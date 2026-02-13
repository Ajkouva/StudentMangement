/**
 * TOAST NOTIFICATION CONTEXT
 * 
 * Provides a simple notification system for user feedback.
 * Shows temporary messages (success, error, info) at bottom-right of screen.
 * 
 * WHAT ARE TOAST NOTIFICATIONS:
 * Small popup messages that appear temporarily to inform the user:
 * - "Student created successfully!" (success)
 * - "Login failed: Invalid credentials" (error)
 * - "Data saved" (info)
 * 
 * WHY USE CONTEXT FOR TOASTS:
 * Any component can show a toast without passing props around.
 * 
 * USAGE IN COMPONENTS:
 * import { useToast } from '../context/ToastContext';
 * 
 * function MyComponent() {
 *     const { addToast } = useToast();
 *     
 *     const handleSave = async () => {
 *         await api.post('/save-data');
 *         addToast('Data saved successfully!', 'success');
 *     }
 * }
 */

import { createContext, useState, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// Create toast context
const ToastContext = createContext();

/**
 * TOAST PROVIDER COMPONENT
 * 
 * Manages array of active toasts and provides addToast function.
 */
export const ToastProvider = ({ children }) => {
    // STATE: Array of currently visible toasts
    // Each toast has: { id, message, type }
    const [toasts, setToasts] = useState([]);

    /**
     * ADD TOAST FUNCTION
     * 
     * Shows a new toast notification.
     * Toast automatically disappears after 3 seconds.
     * 
     * @param {string} message - Text to display
     * @param {string} type - 'success', 'error', or 'info'
     * 
     * HOW IT WORKS:
     * 1. Create new toast with unique ID (timestamp)
     * 2. Add toast to state array (React re-renders, toast appears)
     * 3. Set timeout to remove toast after 3 seconds
     * 4. Toast animates out and is removed from array
     */
    const addToast = useCallback((message, type = 'success') => {
        // Generate unique ID using current timestamp
        const id = Date.now();

        // Add new toast to array
        // ...prev spreads existing toasts, then adds new one
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-remove toast after 3 seconds
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, []);  // useCallback memoizes function (performance optimization)

    /**
     * REMOVE TOAST FUNCTION
     * 
     * Removes a toast from the display.
     * Called either by timeout or when user clicks X button.
     * 
     * @param {number} id - Toast ID to remove
     */
    const removeToast = useCallback((id) => {
        // Filter out the toast with this ID
        // Keep all toasts except the one we're removing
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    /**
     * RENDER TOAST CONTAINER
     * 
     * Positioned at bottom-right corner (fixed position).
     * Maps over toasts array and renders each toast.
     * 
     * CONDITIONAL STYLING:
     * - Success toast: green background (bg-emerald-600)
     * - Error toast: red background (bg-red-600)
     * - Info toast: blue background (bg-blue-600)
     */
    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}

            {/* Toast Container - fixed to bottom-right */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {/* Map over toasts array and render each toast */}
                {toasts.map((toast) => (
                    <div
                        key={toast.id}  // React needs unique key for list items
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 animate-slide-in ${toast.type === 'success' ? 'bg-emerald-600' :
                                toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                            }`}
                    >
                        {/* Show appropriate icon based on toast type */}
                        {toast.type === 'success' && <CheckCircle size={18} />}
                        {toast.type === 'error' && <AlertCircle size={18} />}
                        {toast.type === 'info' && <Info size={18} />}

                        {/* Toast message */}
                        <span className="font-medium text-sm">{toast.message}</span>

                        {/* Close button (X) */}
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 hover:opacity-80"
                            aria-label="Close notification"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

/**
 * CUSTOM HOOK: useToast()
 * 
 * Easy way for components to show toast notifications.
 * 
 * USAGE:
 * const { addToast } = useToast();
 * addToast('Operation successful!', 'success');
 * addToast('Something went wrong', 'error');
 * addToast('Just so you know...', 'info');
 */
export const useToast = () => useContext(ToastContext);
