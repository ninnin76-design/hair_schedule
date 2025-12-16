import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 flex items-center justify-center shadow-md";
  
  const variants = {
    // Brighter blue for visibility on dark bg
    primary: "bg-blue-600 text-white hover:bg-blue-500 border border-transparent",
    // Dark grey for secondary
    secondary: "bg-slate-700 text-slate-200 border border-slate-600 hover:bg-slate-600 hover:text-white",
    // Muted red
    danger: "bg-red-900/50 text-red-200 border border-red-900 hover:bg-red-900/70",
    ghost: "text-slate-400 hover:text-slate-200 hover:bg-slate-800 shadow-none",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};