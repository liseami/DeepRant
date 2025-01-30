import toast from 'react-hot-toast';

const toastStyle = {
    style: {
        background: '#ffffff',
        color: '#18181b', // zinc-900
        padding: '16px',
        borderRadius: '16px', // rounded-2xl
        boxShadow: '0 8px 30px rgb(0,0,0,0.08)',
        fontSize: '14px',
        maxWidth: '500px',
        border: '1px solid #e4e4e7', // zinc-200
    },
    duration: 2000,
    position: 'top-right',
};

const errorToastStyle = {
    ...toastStyle,
    style: {
        ...toastStyle.style,
        color: '#ef4444', // red-500
    },
    duration: 3000,
};

export const showSuccess = (message) => {
    toast.success(message, toastStyle);
};

export const showError = (message) => {
    toast.error(message, errorToastStyle);
}; 