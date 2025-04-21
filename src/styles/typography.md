# Typography Guide

## Font Family
The primary font for Charter is **Sen**. It should be used across the entire application for its excellent readability and modern aesthetic.

### Usage
```tsx
// The font is automatically applied to all text via the root layout
// but can be explicitly used with:
className="font-sen"
```

## Type Scale

### Display Text
Used for headlines, hero sections, and major features:
- `text-5xl`: (3rem, 48px) - Main landing headlines
  - `leading-tight tracking-tight`
- `text-4xl`: (2.25rem, 36px) - Section headlines
  - `leading-tight tracking-tight`
- `text-3xl`: (1.875rem, 30px) - Feature headlines
  - `leading-snug tracking-tight`
- `text-2xl`: (1.5rem, 24px) - Card headlines
  - `leading-snug tracking-tight`

### Body Text
Used for general content:
- `text-lg`: (1.125rem, 18px) - Large body text
  - `leading-relaxed`
- `text-base`: (1rem, 16px) - Default body text
  - `leading-relaxed`
- `text-sm`: (0.875rem, 14px) - Secondary text
  - `leading-relaxed`
- `text-xs`: (0.75rem, 12px) - Caption text
  - `leading-normal`

## Font Weights
- `font-normal`: Default body text
- `font-medium`: Emphasized text, buttons, links
- `font-semibold`: Subheadings (h2, h3)
- `font-bold`: Main headings (h1)

## Usage Guidelines

### Headers
```tsx
<h1 className="text-5xl leading-tight tracking-tight font-bold">Main Headline</h1>
<h2 className="text-4xl leading-tight tracking-tight font-semibold">Section Headline</h2>
<h3 className="text-3xl leading-snug tracking-tight font-semibold">Subsection Headline</h3>
<h4 className="text-2xl leading-snug tracking-tight font-medium">Minor Headline</h4>
```

### Body Text
```tsx
<p className="text-base leading-relaxed">Default paragraph text</p>
<p className="text-lg leading-relaxed">Larger paragraph text</p>
<p className="text-sm leading-relaxed">Smaller text for notes or secondary content</p>
```

### Interactive Elements
```tsx
<button className="text-base leading-relaxed font-medium">Button Text</button>
<a className="text-base leading-relaxed font-medium">Link Text</a>
```

### Forms
```tsx
<label className="text-sm leading-relaxed font-medium">Form Label</label>
<input className="text-base leading-relaxed" />
<span className="text-xs leading-normal">Helper text</span>
```

### Utility Classes
```tsx
// For small, muted text
<span className="text-caption">Caption text</span>

// For large display text
<div className="text-display">Display text</div>

// For secondary headlines
<div className="text-subtitle">Subtitle text</div>
```

## Best Practices
1. Use appropriate text sizes for hierarchy
2. Maintain consistent line heights:
   - `leading-tight` for large headlines
   - `leading-snug` for smaller headlines
   - `leading-relaxed` for body text
   - `leading-normal` for small text
3. Use proper font weights for emphasis
4. Apply tracking (letter-spacing) appropriately:
   - `tracking-tight` for headlines
   - Default tracking for body text
5. Ensure sufficient contrast for readability
6. Follow responsive design principles
7. Use utility classes for consistent styling 