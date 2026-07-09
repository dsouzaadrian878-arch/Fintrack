import React from 'react';
import * as Icons from 'lucide-react';

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number | string;
}

export default function LucideIcon({ name, ...props }: LucideIconProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    // Fallback icon if the specified icon does not exist
    return <Icons.HelpCircle {...props} />;
  }

  return <IconComponent {...props} />;
}
