import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: 'primary' | 'ghost';
  readonly block?: boolean;
  readonly children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  block = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps): React.JSX.Element => {
  const classes = ['btn', variant === 'ghost' && 'btn--ghost', block && 'btn--block', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
};
