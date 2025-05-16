'use client';

import DarkModeToggle from "@/components/DarkModeToggle";
import { Box, Paper, Typography, Stack, Grid, useTheme } from '@mui/material';
import tokens from '@/styles/tokens';

interface ColorBlockProps {
  colorClass: string;
  label: string;
  hexCode: string;
  darkMode?: boolean;
}

function ColorBlock({ colorClass, label, hexCode, darkMode }: ColorBlockProps) {
  return (
    <Stack spacing={1} alignItems="flex-start">
      <Box sx={{ height: 96, width: '100%', borderRadius: 2, boxShadow: 2, bgcolor: hexCode }} />
      <Typography variant="body2" fontWeight={500}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">{hexCode}</Typography>
    </Stack>
  );
}

interface ColorSetProps {
  title: string;
  colors: { class: string; label: string; hex: string; darkMode?: boolean; }[];
}

function ColorSet({ title, colors }: ColorSetProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={600}>{title}</Typography>
      <Grid container spacing={3}>
        {colors.map((color) => (
          <Grid item xs={6} md={3} key={color.class}>
          <ColorBlock
            colorClass={color.class}
            label={color.label}
            hexCode={color.hex}
            darkMode={color.darkMode}
          />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export default function ColorsPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, sm: 4 } }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={6}>
          <Typography variant="h4" fontWeight="bold">Color System</Typography>
          <DarkModeToggle />
        </Stack>

        {/* Design Token Colors */}
        <Box mb={8}>
          <Typography variant="h5" fontWeight={600} mb={4}>Design Token Colors</Typography>
          <Grid container spacing={6}>
            {Object.entries(tokens.color).map(([name, token]) => (
              <Grid item xs={6} md={3} key={name}>
                <Stack spacing={1} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      boxShadow: 2,
                      bgcolor: token.value
                    }}
                  />
                  <Typography variant="body2" fontWeight={500}>{name}</Typography>
                  <Typography variant="caption" color="text.secondary">{token.value}</Typography>
                      </Stack>
                    </Grid>
                  ))}
          </Grid>
        </Box>

        {/* Add more color sets or palettes as needed */}
      </Box>
    </Box>
  );
}