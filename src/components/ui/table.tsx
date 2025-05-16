'use client';

import { forwardRef } from 'react';
import { Box, Table as MuiTable, TableBody as MuiTableBody, TableCell as MuiTableCell, TableContainer, TableHead as MuiTableHead, TableRow as MuiTableRow, useTheme } from '@mui/material';

const Table = forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => {
  const theme = useTheme();
  return (
    <TableContainer>
      <MuiTable
        ref={ref}
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          '& caption': {
            captionSide: 'bottom',
            fontSize: theme.typography.caption.fontSize,
          },
          ...(className && { className })
        }}
        {...props}
      />
    </TableContainer>
  );
});
Table.displayName = 'Table';

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const theme = useTheme();
  return (
    <MuiTableHead
      ref={ref}
      sx={{
        '& .MuiTableRow-root': {
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        ...(className && { className })
      }}
      {...props}
    />
  );
});
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const theme = useTheme();
  return (
    <MuiTableBody
      ref={ref}
      sx={{
        '& .MuiTableRow-root:last-child': {
          borderBottom: 'none',
        },
        ...(className && { className })
      }}
      {...props}
    />
  );
});
TableBody.displayName = 'TableBody';

const TableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => {
  const theme = useTheme();
  return (
    <MuiTableRow
      ref={ref}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(['background-color']),
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        '&[data-state="selected"]': {
          backgroundColor: theme.palette.action.selected,
        },
        ...(className && { className })
      }}
      {...props}
    />
  );
});
TableRow.displayName = 'TableRow';

const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const theme = useTheme();
  return (
    <MuiTableCell
      ref={ref}
      sx={{
        height: 48,
        px: 2,
        textAlign: 'left',
        verticalAlign: 'middle',
        fontWeight: theme.typography.fontWeightMedium,
        color: theme.palette.text.secondary,
        '&[role="checkbox"]': {
          pr: 0,
        },
        ...(className && { className })
      }}
      {...props}
    />
  );
});
TableHead.displayName = 'TableHead';

const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const theme = useTheme();
  return (
    <MuiTableCell
      ref={ref}
      sx={{
        p: 2,
        verticalAlign: 'middle',
        color: theme.palette.text.primary,
        '&[role="checkbox"]': {
          pr: 0,
        },
        ...(className && { className })
      }}
      {...props}
    />
  );
});
TableCell.displayName = 'TableCell';

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
}; 