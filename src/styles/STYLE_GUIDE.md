# Charter Aviation Platform - Styling Guide

## Core Principles

1. **Material-UI First**: Material-UI is the primary styling system for all components.
2. **Theme-Driven**: All styling should be derived from the theme.
3. **Consistency**: Use consistent patterns and approaches for similar UI elements.
4. **Responsive**: All components should be responsive by default.
5. **Accessibility**: Follow accessibility best practices.

## Theme Structure

The theme is defined in `src/theme/theme.ts` and provides:

- **Light and Dark Themes**: Both themes are defined and can be toggled.
- **Color Palette**: A consistent set of colors with proper contrasts.
- **Typography**: Font families, sizes, and weights.
- **Spacing**: Consistent spacing units based on 8px.
- **Component Overrides**: Default styling for all Material-UI components.

### Using the Theme

```tsx
// Accessing theme in a component
import { useTheme } from '@mui/material/styles';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(2),
      color: theme.palette.text.primary
    }}>
      Content
    </Box>
  );
};
```

## Styling Approaches

### 1. Material-UI's `sx` Prop (Preferred)

Use the `sx` prop for component-specific styling:

```tsx
<Box 
  sx={{ 
    p: 2, 
    m: 1, 
    bgcolor: 'background.paper',
    borderRadius: 2
  }}
>
  Content
</Box>
```

Guidelines for `sx` props:
- Keep props alphabetized for consistency.
- Use theme-based values (like `p: 2` instead of `padding: '16px'`).
- Follow consistent property ordering:
  1. Layout properties (display, position, etc.)
  2. Box model (margin, padding, width, height)
  3. Visual properties (background, color, etc.)
  4. Typography (font, text, etc.)
  5. Misc (cursor, transition, etc.)

### 2. Styled Components (for reusable components)

For reusable styled components:

```tsx
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

// Usage
<StyledCard>Content</StyledCard>
```

### Border Radius Standard
All corners should use a consistent radius of `theme.shape.borderRadius` (8px). In `sx` props, use `borderRadius: 1`; in styled components or theme overrides, use `borderRadius: theme.shape.borderRadius`.

### 3. MUI System Props (for one-off adjustments)

```tsx
<Box mt={2} p={3} bgcolor="background.paper">
  Content
</Box>
```

## Component Guidelines

### Buttons

Always use Material-UI `Button` component with the appropriate variant:

```tsx
<Button variant="contained">Primary Action</Button>
<Button variant="outlined">Secondary Action</Button>
<Button variant="text">Tertiary Action</Button>
```

Button sizes:
- Use `size="small"` for compact interfaces
- Use default size for most cases
- Use `size="large"` for prominent actions

### Typography

Use Material-UI's `Typography` component for all text:

```tsx
<Typography variant="h1">Main Page Title</Typography>
<Typography variant="body1">Standard paragraph text</Typography>
<Typography variant="caption" color="text.secondary">Helper text</Typography>
```

### Form Components

All form elements should use Material-UI components:

```tsx
<TextField 
  label="Name" 
  variant="outlined" 
  fullWidth 
  required
  error={!!errors.name}
  helperText={errors.name?.message}
/>

<FormControl fullWidth>
  <InputLabel>Role</InputLabel>
  <Select value={role} onChange={handleChange}>
    <MenuItem value="passenger">Passenger</MenuItem>
    <MenuItem value="operator">Operator</MenuItem>
  </Select>
</FormControl>
```

Password Fields:
```tsx
const [showPassword, setShowPassword] = useState(false);

<TextField
  label="Password"
  type={showPassword ? 'text' : 'password'}
  fullWidth
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          aria-label={showPassword ? "hide password" : "show password"}
          onClick={() => setShowPassword(!showPassword)}
          onMouseDown={(e) => e.preventDefault()}
          edge="end"
        >
          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      </InputAdornment>
    )
  }}
/>
```

### Cards
Use the `Card` component (or the custom wrapper at `src/components/ui/Card.tsx`) with the standard 8px corners. In `sx` props, use `borderRadius: 1`; in styled components or theme overrides, use `theme.shape.borderRadius`.

```tsx
import { Card } from '@/components/ui/Card';
import { Typography, Divider } from '@mui/material';

<Card sx={{ p: 2, mb: 2 }}>
  <Typography variant="subtitle1">Card Title</Typography>
  <Divider sx={{ my: 1 }} />
  <Typography variant="body2">Card content goes here.</Typography>
</Card>
```

### Layout Components

Use Material-UI layout components for consistent spacing and alignment:

```tsx
<Container maxWidth="lg">
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <Paper elevation={1} sx={{ p: 3 }}>
        Content
      </Paper>
    </Grid>
    <Grid item xs={12} md={6}>
      <Paper elevation={1} sx={{ p: 3 }}>
        Content
      </Paper>
    </Grid>
  </Grid>
</Container>
```

### Responsive Design

Use Material-UI's responsive props:

```tsx
<Grid item xs={12} sm={6} md={4} lg={3}>
  Responsive content
</Grid>

<Box sx={{ 
  display: { xs: 'block', md: 'flex' },
  p: { xs: 1, sm: 2, md: 3 }
}}>
  Responsive content
</Box>
```

## Theme Colors

Always use themed colors from the palette:

```tsx
// DO
<Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
  Properly themed content
</Box>

// DON'T
<Box sx={{ bgcolor: '#0b3746', color: 'white' }}>
  Hardcoded colors
</Box>
```

Available palette colors:
- `primary`: Main brand color
- `secondary`: Secondary brand color
- `error`: Error states
- `warning`: Warning states
- `info`: Informational states
- `success`: Success states
- `grey`: Neutral colors
- `common.white` and `common.black`: Pure white and black
- `text.primary`, `text.secondary`, `text.disabled`: Text colors
- `background.default`, `background.paper`: Background colors

### Design Token Colors

The following CSS variables are generated from our design tokens and can be used throughout the site:
```css
:root {
  --color-background: #f9efe4;
  --color-background-light: #fdfaf6;
  --color-foreground: #0b3746;
  --color-card: #fdfaf6;
  --color-card-foreground: #0b3746;
  --color-primary: #0b3746;
  --color-primary-light: #0f4657;
  --color-primary-dark: #072530;
  --color-primary-foreground: #f9efe4;
  --color-secondary: #0f4657;
  --color-secondary-foreground: #f9efe4;
  --color-border: #e6d2b4;
}
```

## Dark Mode Support

All components should support dark mode automatically through the theme. Dark mode is toggled using the ThemeContext:

```tsx
import { useTheme } from '@/contexts/ThemeContext';

const Component = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <Button onClick={toggleTheme}>
      Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
    </Button>
  );
};
```

## Spacing

Use the theme's spacing function for consistent spacing:

```tsx
// In sx props
<Box sx={{ p: 2, m: 3, gap: 1 }}>
  Consistent spacing
</Box>

// In styled components
const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(3),
  gap: theme.spacing(1),
}));
```

## Shadows & Elevation

Use consistent box-shadow styles across components. Here are some named examples to choose from:

### Soft Shadow
```css
box-shadow: 0px 1px 3px rgba(0,0,0,0.12),
            0px 1px 2px rgba(0,0,0,0.24);
```

### Regular Shadow
```css
box-shadow: 0px 2px 4px rgba(0,0,0,0.14),
            0px 1px 3px rgba(0,0,0,0.20),
            0px 1px 1px rgba(0,0,0,0.12);
```

### Medium Shadow
```css
box-shadow: 0px 4px 8px rgba(0,0,0,0.15),
            0px 2px 4px rgba(0,0,0,0.12);
```

### Heavy Shadow
```css
box-shadow: 0px 8px 16px rgba(0,0,0,0.20),
            0px 4px 8px rgba(0,0,0,0.14),
            0px 2px 4px rgba(0,0,0,0.12);
```

## Icons

Use Material-UI icons:

```tsx
import AddIcon from '@mui/icons-material/Add';

<IconButton aria-label="add">
  <AddIcon />
</IconButton>
```

## Form Validation

Use Material-UI's error states for form validation:

```tsx
<TextField
  error={!!errors.email}
  helperText={errors.email?.message || 'We will never share your email.'}
  label="Email"
  required
/>
```

## Migration Guidelines

When migrating from Tailwind CSS to Material-UI:

1. Replace Tailwind utility classes with `sx` props.
2. Use Material-UI components instead of custom components.
3. Use theme values instead of hardcoded values.
4. Remove `className` props where possible and use `sx` props instead.
5. Leverage Material-UI's responsive API instead of Tailwind's responsive classes.

Example migration:

```tsx
// Before (Tailwind)
<div className="p-4 m-2 bg-white rounded-lg shadow-md text-gray-800 hover:bg-gray-50">
  <h2 className="text-xl font-semibold mb-2">Title</h2>
  <p className="text-sm">Content</p>
</div>

// After (Material-UI)
<Box 
  sx={{ 
    p: 2, 
    m: 1, 
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 1,
    color: 'text.primary',
    '&:hover': { bgcolor: 'action.hover' }
  }}
>
  <Typography variant="h6" sx={{ mb: 1 }}>Title</Typography>
  <Typography variant="body2">Content</Typography>
</Box>
```

## Layout Alignment Standard

All main dashboard pages (including the profile page) should use a **left-aligned layout**. Content should fill the available width, with a reasonable `maxWidth` (e.g., 1200px) and horizontal padding for readability. Do **not** center content using `<Container maxWidth="md">` or similar unless there is a specific design reason. This ensures a consistent, professional look across the dashboard.

Example:
```tsx
<Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 4 }, py: 4 }}>
  ...dashboard content...
</Box>
``` 