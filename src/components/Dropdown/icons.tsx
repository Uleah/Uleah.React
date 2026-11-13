/** Internal 16px stroke icons used by the dropdown. */
export function DropdownIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  );
}

export const ICON_CHEVRON_DOWN = 'M4 6l4 4 4-4';
export const ICON_CHEVRON_LEFT = 'M10 4L6 8l4 4';
export const ICON_CHEVRON_RIGHT = 'M6 4l4 4-4 4';
export const ICON_CHECK = 'M3.5 8.5l3 3 6-7';
export const ICON_CLOSE = 'M4.5 4.5l7 7M11.5 4.5l-7 7';
