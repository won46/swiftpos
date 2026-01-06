'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';
import { LucideIcon, Search } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon: Icon, error, label, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--foreground-muted)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {/* Container Icon */}
          {Icon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--foreground-muted)]">
              <Icon size={18} />
            </div>
          )}
          
          {/* Elemen Input */}
          <input
            {...props}
            ref={ref}
            style={{
              paddingLeft: Icon ? '2.25rem' : '1rem', // 36px when icon, 16px when no icon
            }}
            className={`
              input w-full transition-all outline-none
              ${error ? 'border-[var(--danger)]' : ''}
              ${className}
            `}
          />
        </div>
        {error && (
          <span className="text-xs text-[var(--danger)]">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// SearchInput component
interface SearchInputProps extends Omit<InputProps, 'icon'> {}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (props, ref) => {
    return <Input ref={ref} icon={Search} placeholder="Cari produk..." {...props} />;
  }
);

SearchInput.displayName = 'SearchInput';
