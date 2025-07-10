# Mobile-First Utilities Guide

## Overview

The Charter Aviation platform now includes a comprehensive mobile-first responsive design system with enhanced touch targets, mobile-safe typography, and optimized interaction patterns.

## Core Principles

1. **Mobile-First Design**: All styles start with mobile and scale up
2. **Touch-Friendly**: Minimum 44px touch targets (48px recommended)
3. **iOS Safe**: 16px minimum font size to prevent zoom
4. **Performance**: Optimized animations and reduced motion support
5. **Accessibility**: Enhanced focus states and semantic markup

## Breakpoints

Material-UI compatible breakpoints:
- `xs`: 0px (mobile portrait)
- `sm`: 600px (mobile landscape / small tablet)
- `md`: 900px (tablet)
- `lg`: 1200px (desktop)
- `xl`: 1536px (large desktop)

## Typography

### Mobile-First Responsive Typography

All typography automatically scales from mobile to desktop:

```tsx
// Automatically responsive headings
<Typography variant="h1">Responsive Heading</Typography>

// Mobile-specific utility classes
<div className="mobile-heading-primary">Mobile-optimized heading</div>
<div className="mobile-body">Mobile-optimized body text</div>
<div className="mobile-caption">Mobile-optimized caption</div>
```

### Font Size Guidelines

- **Mobile body text**: 14px minimum (scales to 16px on tablet+)
- **Mobile buttons/inputs**: 16px (prevents iOS zoom)
- **Mobile headings**: Start smaller, scale up responsively

## Touch Targets

### CSS Classes

```css
.touch-target          /* 44px minimum touch target */
.touch-target-large    /* 48px recommended touch target */
.mobile-interactive    /* Enhanced touch feedback */
.touch-feedback        /* Touch animation feedback */
```

### Usage Examples

```tsx
// Enhanced button with touch target
<Button className="touch-target-large">
  Touch-Friendly Button
</Button>

// Interactive card with touch feedback
<Card className="mobile-interactive touch-feedback">
  Touchable Card
</Card>

// Icon button with proper touch target
<IconButton className="touch-target">
  <MenuIcon />
</IconButton>
```

## Mobile-Specific Utilities

### Spacing and Layout

```css
.mobile-spacing        /* Responsive horizontal padding */
.mobile-gap           /* Responsive gap spacing */
.mobile-form-group    /* Form field spacing */
.mobile-form-row      /* Responsive form layout */
```

### Grid and Flexbox

```css
.responsive-grid      /* Mobile-first grid layout */
.responsive-flex      /* Mobile-first flex layout */
```

### Examples

```tsx
// Mobile-first grid
<div className="responsive-grid">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Mobile-first flex layout
<div className="responsive-flex">
  <div>Left content</div>
  <div>Right content</div>
</div>

// Form with mobile spacing
<div className="mobile-form-group">
  <TextField label="Email" className="mobile-safe-text" />
  <TextField label="Password" className="mobile-safe-text" />
</div>
```

## Component Enhancements

### Form Inputs

All form inputs are automatically enhanced:
- 16px font size (prevents iOS zoom)
- 48px minimum height on mobile
- Enhanced touch targets
- Improved padding for mobile

```tsx
<TextField
  label="Email Address"
  fullWidth
  // Automatically includes mobile enhancements
/>

<Select
  label="Country"
  fullWidth
  // Automatically includes 48px mobile touch targets
>
  <MenuItem value="us">United States</MenuItem>
</Select>
```

### Buttons

All Material-UI buttons include mobile enhancements:
- Minimum 44px touch targets
- Enhanced mobile padding
- Touch feedback animations

```tsx
<Button 
  variant="contained" 
  className="touch-target-large"
>
  Mobile-Optimized Button
</Button>
```

### Cards and Containers

```tsx
// Mobile-optimized card
<div className="mobile-card">
  <h3 className="mobile-heading-secondary">Card Title</h3>
  <p className="mobile-body">Card content optimized for mobile</p>
</div>
```

## Material-UI Theme Integration

### Responsive Typography

The theme automatically provides responsive typography:

```tsx
<Typography variant="h1">
  {/* 28px mobile → 32px tablet → 40px desktop */}
</Typography>

<Typography variant="body1">
  {/* 14px mobile → 16px tablet+ */}
</Typography>
```

### Responsive Spacing

Use Material-UI's spacing system with mobile considerations:

```tsx
<Box sx={{ 
  p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
  mb: { xs: 2, md: 3 }        // Responsive margin
}}>
  Content with responsive spacing
</Box>
```

## Animation and Performance

### Mobile-Optimized Animations

```css
.mobile-slide-up       /* Optimized slide animation */
.mobile-fade-in        /* Optimized fade animation */
.no-tap-highlight      /* Remove tap highlight */
.mobile-scroll         /* Enhanced touch scrolling */
```

### Reduced Motion Support

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .mobile-interactive,
  .touch-feedback {
    animation: none !important;
    transition: none !important;
  }
}
```

## Mobile Navigation

### Navigation Components

```tsx
// Mobile-friendly navigation item
<div className="mobile-nav-item">
  <HomeIcon />
  <span>Home</span>
</div>
```

### Touch-Friendly Lists

```tsx
<List>
  <ListItem className="touch-target-large">
    <ListItemText primary="Touch-friendly list item" />
  </ListItem>
</List>
```

## Best Practices

### Do's

1. **Always test on real devices** - Use the responsive test page
2. **Use semantic HTML** - Proper heading hierarchy, landmarks
3. **Implement proper focus management** - Visible focus indicators
4. **Use the enhanced utilities** - Touch targets, mobile spacing
5. **Test with assistive technologies** - Screen readers, voice control

### Don'ts

1. **Don't use font sizes below 16px for inputs** - Causes iOS zoom
2. **Don't create touch targets smaller than 44px** - Accessibility violation
3. **Don't rely only on hover states** - Mobile has no hover
4. **Don't ignore landscape orientation** - Test both orientations
5. **Don't hardcode breakpoints** - Use the theme breakpoints

## Integration Examples

### Complete Mobile Form

```tsx
<Box className="mobile-spacing">
  <Typography variant="h2" className="mobile-heading-primary">
    Contact Form
  </Typography>
  
  <form className="mobile-form-group">
    <div className="mobile-form-row">
      <TextField
        label="First Name"
        className="mobile-safe-text"
        fullWidth
      />
      <TextField
        label="Last Name"
        className="mobile-safe-text"
        fullWidth
      />
    </div>
    
    <TextField
      label="Email Address"
      type="email"
      className="mobile-safe-text"
      fullWidth
    />
    
    <Button
      type="submit"
      variant="contained"
      className="touch-target-large"
      fullWidth
    >
      Submit Form
    </Button>
  </form>
</Box>
```

### Mobile-Optimized Card Grid

```tsx
<Box className="mobile-spacing">
  <div className="responsive-grid">
    {items.map((item) => (
      <Card 
        key={item.id} 
        className="mobile-card mobile-interactive"
      >
        <CardContent>
          <Typography variant="h3" className="mobile-heading-secondary">
            {item.title}
          </Typography>
          <Typography className="mobile-body">
            {item.description}
          </Typography>
        </CardContent>
        <CardActions>
          <Button 
            className="touch-target-large"
            variant="outlined"
          >
            Learn More
          </Button>
        </CardActions>
      </Card>
    ))}
  </div>
</Box>
```

## Testing

### Responsive Test Page

Use `/dashboard/responsive-test` to test components across different device sizes:

1. Select the page to test
2. Choose device category (mobile/tablet/desktop)
3. Verify touch targets and interactions
4. Test in both orientations
5. Validate form inputs don't cause zoom

### Manual Testing Checklist

- [ ] All touch targets minimum 44px
- [ ] Forms don't cause iOS zoom (16px font minimum)
- [ ] Proper focus indicators visible
- [ ] Content readable without horizontal scroll
- [ ] Interactive elements have sufficient contrast
- [ ] Animations respect reduced motion preferences

## Maintenance

### Updating Mobile Styles

1. Edit design tokens in `style-dictionary/tokens/global.json`
2. Run `npm run build:tokens` to regenerate CSS/JS
3. Update component overrides in `src/theme/theme.ts`
4. Test changes on responsive test page
5. Validate on real devices

### Performance Monitoring

Monitor Core Web Vitals for mobile performance:
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms  
- CLS (Cumulative Layout Shift) < 0.1

---

This mobile-first system ensures the Charter Aviation platform provides an excellent user experience across all devices while maintaining accessibility and performance standards. 