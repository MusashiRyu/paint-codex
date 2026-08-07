import type { ListIcon } from '../../app/providers/store';

interface ListIconSvgProps {
  icon: ListIcon;
  size?: number;
}

export function ListIconSvg({ icon, size = 16 }: ListIconSvgProps) {
  const props = {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
  };

  switch (icon) {
    case 'skull':
      return (
        <svg {...props}>
          <circle cx="12" cy="10" r="6.5" />
          <line x1="8.5" y1="14.5" x2="8.5" y2="17.5" />
          <line x1="15.5" y1="14.5" x2="15.5" y2="17.5" />
          <circle cx="9.3" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="14.7" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
          <path d="M10.3 12.6 L12 14.1 L13.7 12.6" />
        </svg>
      );
    case 'star':
      return (
        <svg {...props} strokeLinejoin="round">
          <path d="M12 3 L14.2 9.2 L21 9.6 L15.6 13.8 L17.4 20.4 L12 16.5 L6.6 20.4 L8.4 13.8 L3 9.6 L9.8 9.2 Z" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...props} strokeLinejoin="round">
          <path d="M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z" />
        </svg>
      );
    case 'wing':
      return (
        <svg {...props} strokeLinecap="round">
          <path d="M3 16 C7 16 9.5 12.5 10.5 8 C12 12.5 10 16.5 5 18.5" />
          <path d="M10.5 8 C13.5 12.5 16 15.5 21 14.5 C17 17 12.5 18 9.5 15.5" />
        </svg>
      );
    case 'crown':
      return (
        <svg {...props} strokeLinejoin="round">
          <path d="M4 18 H20 M4 18 L3 9 L8 12.5 L12 6 L16 12.5 L21 9 L20 18" />
        </svg>
      );
    case 'flame':
      return (
        <svg {...props} strokeLinejoin="round">
          <path d="M12 3 C8 8 6 10.5 6 14 C6 18 8.7 21 12 21 C15.3 21 18 18 18 14 C18 11.3 16.6 9.7 15.6 8.7 C15.8 11 14.2 12 13.2 11 C13.8 9 13 6 12 3 Z" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...props}>
          <path d="M17 4 A9 9 0 1 0 17 20 A7 7 0 0 1 17 4 Z" />
        </svg>
      );
    case 'drop':
      return (
        <svg {...props} strokeLinejoin="round">
          <path d="M12 3 C16 9 18 12.5 18 15.5 C18 19 15.3 21 12 21 C8.7 21 6 19 6 15.5 C6 12.5 8 9 12 3 Z" />
        </svg>
      );
    default:
      return null;
  }
}
