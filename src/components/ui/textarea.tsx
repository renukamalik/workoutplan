import * as React from 'react';
import { cn } from '@/lib/utils';
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea data-slot="textarea" className={cn('border-input bg-card min-h-20 w-full rounded-[10px] border px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', className)} {...props} />;
}
export { Textarea };
