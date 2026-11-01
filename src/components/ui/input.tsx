import * as React from 'react';
import { cn } from '@/lib/utils';
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return <input type={type} data-slot="input" className={cn('border-input bg-card h-11 w-full min-w-0 rounded-[10px] border px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', className)} {...props} />;
}
export { Input };
