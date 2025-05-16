"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { Box, useTheme } from '@mui/material'

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const theme = useTheme()
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        '&[data-state=open]': {
          animation: `${theme.transitions.create('opacity')} 150ms ease-in`,
        },
        '&[data-state=closed]': {
          animation: `${theme.transitions.create('opacity')} 150ms ease-out`,
        },
        ...(className && { className })
      }}
      {...props}
    />
  )
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const theme = useTheme()
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        sx={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          zIndex: 50,
          display: 'grid',
          width: '100%',
          maxWidth: '32rem',
          transform: 'translate(-50%, -50%)',
          gap: theme.spacing(2),
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          padding: theme.spacing(3),
          boxShadow: theme.shadows[4],
          transition: theme.transitions.create(['transform', 'opacity']),
          '&[data-state=open]': {
            animation: `${theme.transitions.create(['transform', 'opacity'])} 200ms ease-in`,
          },
          '&[data-state=closed]': {
            animation: `${theme.transitions.create(['transform', 'opacity'])} 200ms ease-out`,
          },
          [theme.breakpoints.up('sm')]: {
            borderRadius: theme.shape.borderRadius,
          },
          ...(className && { className })
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          sx={{
            position: 'absolute',
            right: theme.spacing(2),
            top: theme.spacing(2),
            borderRadius: theme.shape.borderRadius,
            opacity: 0.7,
            transition: theme.transitions.create('opacity'),
            '&:hover': {
              opacity: 1,
            },
            '&:focus': {
              outline: 'none',
              boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
            },
            '&:disabled': {
              pointerEvents: 'none',
            },
            '&[data-state=open]': {
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.text.secondary,
            },
          }}
        >
          <X sx={{ width: 16, height: 16 }} />
          <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
            Close
          </span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const theme = useTheme()
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.5),
        textAlign: { xs: 'center', sm: 'left' },
        ...(className && { className })
      }}
      {...props}
    />
  )
}
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const theme = useTheme()
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        justifyContent: { sm: 'flex-end' },
        gap: theme.spacing(1),
        ...(className && { className })
      }}
      {...props}
    />
  )
}
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const theme = useTheme()
  return (
    <DialogPrimitive.Title
      ref={ref}
      sx={{
        fontSize: theme.typography.h6.fontSize,
        fontWeight: theme.typography.h6.fontWeight,
        lineHeight: theme.typography.h6.lineHeight,
        letterSpacing: theme.typography.h6.letterSpacing,
        ...(className && { className })
      }}
      {...props}
    />
  )
})
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const theme = useTheme()
  return (
    <DialogPrimitive.Description
      ref={ref}
      sx={{
        fontSize: theme.typography.body2.fontSize,
        color: theme.palette.text.secondary,
        ...(className && { className })
      }}
      {...props}
    />
  )
})
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} 