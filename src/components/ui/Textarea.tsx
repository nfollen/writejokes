'use client';

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCount?: boolean;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, showCount, maxChars, id, value, onChange, ...props }, ref) => {
    const [charCount, setCharCount] = useState((value as string)?.length || 0);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            value={value}
            onChange={handleChange}
            className={cn(
              'w-full px-4 py-3 rounded-lg min-h-[150px] resize-y',
              'bg-card border border-border',
              'text-foreground placeholder:text-muted',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
              'transition-all duration-200',
              'font-mono text-lg leading-relaxed',
              error && 'border-error focus:ring-error/50',
              className
            )}
            {...props}
          />
          {showCount && (
            <div className="absolute bottom-3 right-3 text-xs text-muted">
              {charCount}
              {maxChars && ` / ${maxChars}`}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
