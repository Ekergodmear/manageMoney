import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

import { Input } from '@/components/ui/input';
import { semanticText } from '@/design/tokens/colors';
import { cn } from '@/lib/utils';

export interface SearchFieldProps {
  readonly value: string;
  readonly placeholder?: string;
  readonly onChange: (value: string) => void;
}

export function SearchField({ value, placeholder, onChange }: SearchFieldProps): ReactNode {
  return (
    <div className="relative">
      <Search
        className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', semanticText.muted)}
      />
      <Input
        placeholder={placeholder}
        className="pl-9"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
