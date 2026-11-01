import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap', {
  variants: { variant: { default: 'bg-primary text-primary-foreground', ok: 'bg-[var(--ok-bg)] text-[var(--ok)]', warn: 'bg-[var(--warn-bg)] text-[var(--warn)]', alert: 'bg-[var(--alert-bg)] text-[var(--alert)]', muted: 'bg-[#ECE3E7] text-[#4F3B47]' } },
  defaultVariants: { variant: 'default' },
});
function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge };
