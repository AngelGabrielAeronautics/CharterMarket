declare module '@mui/material/Grid' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface GridBaseProps {
    /**
     * If `true`, the component will have the flex *item* behavior (legacy prop).
     */
    item?: boolean;
    /** Legacy breakpoint size props retained for backwards-compatibility */
    xs?: boolean | number | 'auto';
    sm?: boolean | number | 'auto';
    md?: boolean | number | 'auto';
    lg?: boolean | number | 'auto';
    xl?: boolean | number | 'auto';
  }
}
