import type { SVGProps } from 'react';

export function FireplaceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12H22" />
      <path d="M5 12V6C5 5.46957 5.21071 4.96086 5.58579 4.58579C5.96086 4.21071 6.46957 4 7 4H17C17.5304 4 18.0391 4.21071 18.4142 4.58579C18.7893 4.96086 19 5.46957 19 6V12" />
      <path d="M5 20V12" />
      <path d="M19 20V12" />
      <path d="M9 16H15" />
      <path d="M9 12H15" />
      <path d="M9 8H15" />
      <path d="M5 20H19" />
      <path d="M9 20V16" />
      <path d="M15 20V16" />
      <path d="M12 12C12 11.3333 12.6667 10 14 10C15.3333 10 16 11.3333 16 12" />
      <path d="M8 12C8 11.3333 8.66667 10 10 10C11.3333 10 12 11.3333 12 12" />
    </svg>
  );
}
