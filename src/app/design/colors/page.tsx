'use client';

import DarkModeToggle from "@/components/DarkModeToggle";

interface ColorBlockProps {
  colorClass: string;
  label: string;
  hexCode: string;
  darkMode?: boolean;
}

function ColorBlock({ colorClass, label, hexCode, darkMode }: ColorBlockProps) {
  return (
    <div className="flex flex-col">
      <div className={`h-24 w-full rounded-lg ${colorClass} shadow-lg`} />
      <p className="mt-2 text-sm font-medium text-text-light-primary dark:text-[#F9EFE4]">{label}</p>
      <p className="text-xs text-text-light-muted dark:text-[#F9EFE4]/70">{hexCode}</p>
    </div>
  );
}

interface ColorSetProps {
  title: string;
  colors: { class: string; label: string; hex: string; darkMode?: boolean; }[];
}

function ColorSet({ title, colors }: ColorSetProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-text-light-primary dark:text-[#F9EFE4]">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {colors.map((color) => (
          <ColorBlock
            key={color.class}
            colorClass={color.class}
            label={color.label}
            hexCode={color.hex}
            darkMode={color.darkMode}
          />
        ))}
      </div>
    </div>
  );
}

export default function ColorsPage() {
  const brandColors = {
    navy: {
      50: '#F0F7F9',
      100: '#E1EEF3',
      200: '#C3DDE7',
      300: '#A5CCDB',
      400: '#87BBCF',
      500: '#69AAC3',
      600: '#4B99B7',
      700: '#2D88AB',
      800: '#0F779F',
      900: '#0B3746',
      950: '#061E26',
    },
    gold: {
      50: '#FDF8F3',
      100: '#FBF1E7',
      200: '#F7E3CF',
      300: '#F3D5B7',
      400: '#EFC79F',
      500: '#EBB987',
      600: '#E7AB6F',
      700: '#E39D57',
      800: '#DF8F3F',
      900: '#DB8127',
    }
  };

  return (
    <div className="min-h-screen bg-background-light-primary dark:bg-background-dark-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-playfair text-text-light-primary dark:text-[#F9EFE4]">Color System</h1>
          <DarkModeToggle />
        </div>

        {/* Brand Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-playfair text-text-light-primary dark:text-[#F9EFE4] mb-6">Brand Colors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Charter Navy */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-text-light-primary dark:text-text-dark-primary mb-4">Charter Navy</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#F0F7F9]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">50</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-50<br/>#F0F7F9
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#E1EEF3]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">100</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-100<br/>#E1EEF3
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#C3DDE7]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">200</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-200<br/>#C3DDE7
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#A5CCDB]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">300</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-300<br/>#A5CCDB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#87BBCF]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">400</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-400<br/>#87BBCF
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#69AAC3]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">500</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-500<br/>#69AAC3
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#4B99B7]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">600</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-600<br/>#4B99B7
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#2D88AB]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">700</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-700<br/>#2D88AB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#0F779F]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">800</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-800<br/>#0F779F
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#0B3746]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">900</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-900<br/>#0B3746
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#061E26]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">950</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-navy-950<br/>#061E26
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charter Gold */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-text-light-primary dark:text-text-dark-primary mb-4">Charter Gold</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#FDF8F3]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">50</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-gold-50<br/>#FDF8F3
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#FBF1E7]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">100</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-gold-100<br/>#FBF1E7
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#F7E3CF]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">200</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-gold-200<br/>#F7E3CF
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#F3D5B7]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">300</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-gold-300<br/>#F3D5B7
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#EFC79F]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">400</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-gold-400<br/>#EFC79F
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#EBB987]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">500</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-gold-500<br/>#EBB987
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#E7AB6F]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">600</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-gold-600<br/>#E7AB6F
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#E39D57]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">700</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-gold-700<br/>#E39D57
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#DF8F3F]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">800</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-gold-800<br/>#DF8F3F
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 rounded-lg bg-[#DB8127]" />
                  <div>
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">900</p>
                    <p className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      charter-gold-900<br/>#DB8127
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Text Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-6">Text Colors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Light Mode Text */}
            <div className="p-6 bg-white rounded-lg">
              <h3 className="text-xl font-playfair mb-4 text-[#0B3746]">Light Mode</h3>
              <div className="space-y-4">
                <div>
                  <div style={{ color: '#0B3746' }} className="text-lg font-semibold">Primary Text</div>
                  <div className="text-sm text-[#69AAC3]">text-text-light-primary</div>
                  <div className="text-sm text-[#69AAC3]">#0B3746</div>
                </div>
                <div>
                  <div style={{ color: '#2D88AB' }} className="text-lg font-semibold">Secondary Text</div>
                  <div className="text-sm text-[#69AAC3]">text-text-light-secondary</div>
                  <div className="text-sm text-[#69AAC3]">#2D88AB</div>
                </div>
                <div>
                  <div style={{ color: '#69AAC3' }} className="text-lg font-semibold">Muted Text</div>
                  <div className="text-sm text-[#69AAC3]">text-text-light-muted</div>
                  <div className="text-sm text-[#69AAC3]">#69AAC3</div>
                </div>
                <div>
                  <div style={{ color: '#DB8127' }} className="text-lg font-semibold">Accent Text</div>
                  <div className="text-sm text-[#69AAC3]">text-text-light-accent</div>
                  <div className="text-sm text-[#69AAC3]">#DB8127</div>
                </div>
                <div>
                  <div style={{ color: '#0F779F', textDecoration: 'underline' }} className="text-lg font-semibold">Link Text</div>
                  <div className="text-sm text-[#69AAC3]">text-text-light-link</div>
                  <div className="text-sm text-[#69AAC3]">#0F779F</div>
                </div>
              </div>
            </div>

            {/* Dark Mode Text */}
            <div className="p-6 bg-[#061E26] rounded-lg">
              <h3 className="text-xl font-playfair mb-4 text-[#F9EFE4]">Dark Mode</h3>
              <div className="space-y-4">
                <div>
                  <div style={{ color: '#F9EFE4' }} className="text-lg font-semibold">Primary Text</div>
                  <div className="text-sm text-[#F3D5B7]">text-text-dark-primary</div>
                  <div className="text-sm text-[#F3D5B7]">#F9EFE4</div>
                </div>
                <div>
                  <div style={{ color: '#EFC79F' }} className="text-lg font-semibold">Secondary Text</div>
                  <div className="text-sm text-[#F3D5B7]">text-text-dark-secondary</div>
                  <div className="text-sm text-[#F3D5B7]">#EFC79F</div>
                </div>
                <div>
                  <div style={{ color: '#F3D5B7' }} className="text-lg font-semibold">Muted Text</div>
                  <div className="text-sm text-[#F3D5B7]">text-text-dark-muted</div>
                  <div className="text-sm text-[#F3D5B7]">#F3D5B7</div>
                </div>
                <div>
                  <div style={{ color: '#EBB987' }} className="text-lg font-semibold">Accent Text</div>
                  <div className="text-sm text-[#F3D5B7]">text-text-dark-accent</div>
                  <div className="text-sm text-[#F3D5B7]">#EBB987</div>
                </div>
                <div>
                  <div style={{ color: '#F7E3CF', textDecoration: 'underline' }} className="text-lg font-semibold">Link Text</div>
                  <div className="text-sm text-[#F3D5B7]">text-text-dark-link</div>
                  <div className="text-sm text-[#F3D5B7]">#F7E3CF</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Background Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-6">Background Colors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Light Mode Backgrounds */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-4">Light Mode</h3>
              <div className="space-y-4">
                <div className="p-6 bg-[#FFFFFF] rounded-lg border border-[#E1EEF3]">
                  <p className="font-medium text-[#0B3746]">#FFFFFF</p>
                  <p className="text-sm text-[#69AAC3]">bg-background-light-primary</p>
                </div>
                <div className="p-6 bg-[#F8F9FA] rounded-lg border border-[#E1EEF3]">
                  <p className="font-medium text-[#0B3746]">#F8F9FA</p>
                  <p className="text-sm text-[#69AAC3]">bg-background-light-secondary</p>
                </div>
                <div className="p-6 bg-[#F1F3F5] rounded-lg border border-[#E1EEF3]">
                  <p className="font-medium text-[#0B3746]">#F1F3F5</p>
                  <p className="text-sm text-[#69AAC3]">bg-background-light-tertiary</p>
                </div>
              </div>
            </div>

            {/* Dark Mode Backgrounds */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-4">Dark Mode</h3>
              <div className="space-y-4">
                <div className="p-6 bg-[#0B3746] rounded-lg border border-[#4B99B7]">
                  <p className="font-medium text-[#F9EFE4]">#0B3746</p>
                  <p className="text-sm text-[#F3D5B7]">bg-background-dark-primary</p>
                </div>
                <div className="p-6 bg-[#0F779F] rounded-lg border border-[#4B99B7]">
                  <p className="font-medium text-[#F9EFE4]">#0F779F</p>
                  <p className="text-sm text-[#F3D5B7]">bg-background-dark-secondary</p>
                </div>
                <div className="p-6 bg-[#2D88AB] rounded-lg border border-[#4B99B7]">
                  <p className="font-medium text-[#F9EFE4]">#2D88AB</p>
                  <p className="text-sm text-[#F3D5B7]">bg-background-dark-tertiary</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-6">Interactive Elements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Light Mode Interactive */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-[#0B3746] mb-4">Light Mode</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#0B3746]">Colors:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-4 bg-[#0B3746] rounded-lg text-white">
                      <p>Primary</p>
                      <p className="text-xs opacity-80">interactive-light-primary</p>
                      <p className="text-xs opacity-80">#0B3746</p>
                    </div>
                    <div className="p-4 bg-[#0F779F] rounded-lg text-white">
                      <p>Secondary</p>
                      <p className="text-xs opacity-80">interactive-light-secondary</p>
                      <p className="text-xs opacity-80">#0F779F</p>
                    </div>
                    <div className="p-4 bg-[#2D88AB] rounded-lg text-white">
                      <p>Muted</p>
                      <p className="text-xs opacity-80">interactive-light-muted</p>
                      <p className="text-xs opacity-80">#2D88AB</p>
                    </div>
                    <div className="p-4 bg-[#DB8127] rounded-lg text-white">
                      <p>Accent</p>
                      <p className="text-xs opacity-80">interactive-light-accent</p>
                      <p className="text-xs opacity-80">#DB8127</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#0B3746]">Example Button:</p>
                  <button className="w-full p-4 bg-interactive-light-primary hover:bg-interactive-light-secondary active:bg-interactive-light-muted disabled:bg-interactive-light-accent rounded-lg text-white">
                    INTERACTIVE BUTTON
                  </button>
                </div>
              </div>
            </div>

            {/* Dark Mode Interactive */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-4">Dark Mode</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#F9EFE4]">Colors:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-4 bg-[#FFFFFF] rounded-lg text-[#0B3746]">
                      <p>Primary</p>
                      <p className="text-xs opacity-80">interactive-dark-primary</p>
                      <p className="text-xs opacity-80">#FFFFFF</p>
                    </div>
                    <div className="p-4 bg-[#F9FAFB] rounded-lg text-[#0B3746]">
                      <p>Secondary</p>
                      <p className="text-xs opacity-80">interactive-dark-secondary</p>
                      <p className="text-xs opacity-80">#F9FAFB</p>
                    </div>
                    <div className="p-4 bg-[#F3F4F6] rounded-lg text-[#0B3746]">
                      <p>Muted</p>
                      <p className="text-xs opacity-80">interactive-dark-muted</p>
                      <p className="text-xs opacity-80">#F3F4F6</p>
                    </div>
                    <div className="p-4 bg-[#FEF3C7] rounded-lg text-[#0B3746]">
                      <p>Accent</p>
                      <p className="text-xs opacity-80">interactive-dark-accent</p>
                      <p className="text-xs opacity-80">#FEF3C7</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#F9EFE4]">Example Button:</p>
                  <button className="w-full p-4 bg-interactive-dark-primary hover:bg-interactive-dark-secondary active:bg-interactive-dark-muted disabled:bg-interactive-dark-accent rounded-lg text-[#0B3746]">
                    INTERACTIVE BUTTON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-6">Feedback Colors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Light Mode Feedback */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-[#0B3746] mb-4">Light Mode</h3>
              <div className="space-y-2">
                <div className="p-4 rounded-lg border border-[#2E7D32] bg-[#2E7D32]/10">
                  <p className="font-medium text-[#2E7D32]">Success Message</p>
                  <p className="text-sm text-[#2E7D32]/80">text-feedback-light-success<br/>#2E7D32</p>
                </div>
                <div className="p-4 rounded-lg border border-[#D32F2F] bg-[#D32F2F]/10">
                  <p className="font-medium text-[#D32F2F]">Error Message</p>
                  <p className="text-sm text-[#D32F2F]/80">text-feedback-light-error<br/>#D32F2F</p>
                </div>
                <div className="p-4 rounded-lg border border-[#ED6C02] bg-[#ED6C02]/10">
                  <p className="font-medium text-[#ED6C02]">Warning Message</p>
                  <p className="text-sm text-[#ED6C02]/80">text-feedback-light-warning<br/>#ED6C02</p>
                </div>
                <div className="p-4 rounded-lg border border-[#0288D1] bg-[#0288D1]/10">
                  <p className="font-medium text-[#0288D1]">Info Message</p>
                  <p className="text-sm text-[#0288D1]/80">text-feedback-light-info<br/>#0288D1</p>
                </div>
              </div>
            </div>

            {/* Dark Mode Feedback */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-4">Dark Mode</h3>
              <div className="space-y-2">
                <div className="p-4 rounded-lg border border-[#66BB6A] bg-[#66BB6A]/10">
                  <p className="font-medium text-[#66BB6A]">Success Message</p>
                  <p className="text-sm text-[#66BB6A]/80">text-feedback-dark-success<br/>#66BB6A</p>
                </div>
                <div className="p-4 rounded-lg border border-[#F44336] bg-[#F44336]/10">
                  <p className="font-medium text-[#F44336]">Error Message</p>
                  <p className="text-sm text-[#F44336]/80">text-feedback-dark-error<br/>#F44336</p>
                </div>
                <div className="p-4 rounded-lg border border-[#FFA726] bg-[#FFA726]/10">
                  <p className="font-medium text-[#FFA726]">Warning Message</p>
                  <p className="text-sm text-[#FFA726]/80">text-feedback-dark-warning<br/>#FFA726</p>
                </div>
                <div className="p-4 rounded-lg border border-[#29B6F6] bg-[#29B6F6]/10">
                  <p className="font-medium text-[#29B6F6]">Info Message</p>
                  <p className="text-sm text-[#29B6F6]/80">text-feedback-dark-info<br/>#29B6F6</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Toast Notifications */}
        <section className="mb-12">
          <h2 className="text-2xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-6">Toast Notifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Light Mode Toast */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-[#0B3746] mb-4">Light Mode</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-feedback-success-light border border-feedback-success-dark">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-feedback-success-dark" />
                    <p className="font-medium text-feedback-success-dark">Success Toast</p>
                  </div>
                  <p className="text-sm text-feedback-success-dark/80 mt-1">feedback-success-light / feedback-success-dark<br/>#BBF7D0 / #22C55E</p>
                </div>

                <div className="p-4 rounded-lg bg-feedback-warning-light border border-feedback-warning-dark">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-feedback-warning-dark" />
                    <p className="font-medium text-feedback-warning-dark">Warning Toast</p>
                  </div>
                  <p className="text-sm text-feedback-warning-dark/80 mt-1">feedback-warning-light / feedback-warning-dark<br/>#FEF08A / #EAB308</p>
                </div>

                <div className="p-4 rounded-lg bg-feedback-error-light border border-feedback-error-dark">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-feedback-error-dark" />
                    <p className="font-medium text-feedback-error-dark">Error Toast</p>
                  </div>
                  <p className="text-sm text-feedback-error-dark/80 mt-1">feedback-error-light / feedback-error-dark<br/>#FECACA / #EF4444</p>
                </div>

                <div className="p-4 rounded-lg bg-feedback-info-light border border-feedback-info-dark">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-feedback-info-dark" />
                    <p className="font-medium text-feedback-info-dark">Info Toast</p>
                  </div>
                  <p className="text-sm text-feedback-info-dark/80 mt-1">feedback-info-light / feedback-info-dark<br/>#BFDBFE / #3B82F6</p>
                </div>
              </div>
            </div>

            {/* Dark Mode Toast */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-4">Dark Mode</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-feedback-success-dark/10 border border-feedback-success-dark">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-feedback-success-dark" />
                    <p className="font-medium text-feedback-success-dark">Success Toast</p>
                  </div>
                  <p className="text-sm text-feedback-success-dark/80 mt-1">Example dark mode success toast</p>
                </div>

                <div className="p-4 rounded-lg bg-feedback-warning-dark/10 border border-feedback-warning-dark">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-feedback-warning-dark" />
                    <p className="font-medium text-feedback-warning-dark">Warning Toast</p>
                  </div>
                  <p className="text-sm text-feedback-warning-dark/80 mt-1">Example dark mode warning toast</p>
                </div>

                <div className="p-4 rounded-lg bg-feedback-error-dark/10 border border-feedback-error-dark">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-feedback-error-dark" />
                    <p className="font-medium text-feedback-error-dark">Error Toast</p>
                  </div>
                  <p className="text-sm text-feedback-error-dark/80 mt-1">Example dark mode error toast</p>
                </div>

                <div className="p-4 rounded-lg bg-feedback-info-dark/10 border border-feedback-info-dark">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-feedback-info-dark" />
                    <p className="font-medium text-feedback-info-dark">Info Toast</p>
                  </div>
                  <p className="text-sm text-feedback-info-dark/80 mt-1">Example dark mode info toast</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-lg border border-border-light dark:border-border-dark">
            <h3 className="text-xl font-playfair text-text-light-primary dark:text-text-dark-primary mb-4">Usage Guidelines</h3>
            <div className="space-y-2 text-text-light-primary dark:text-text-dark-primary">
              <p className="text-sm">• Position: Top-right corner</p>
              <p className="text-sm">• Auto-dismiss: After 5 seconds</p>
              <p className="text-sm">• Maximum visible: 3 toasts</p>
              <p className="text-sm">• Stacking: Vertical with 8px spacing</p>
              <p className="text-sm">• Animation: Slide in from right, fade out</p>
            </div>
          </div>
        </section>

        {/* Border Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-6">Border Colors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Light Mode Borders */}
            <div>
              <h3 className="text-xl font-playfair text-[#0B3746] mb-4">Light Mode</h3>
              <div className="space-y-4">
                <div className="p-6 bg-white rounded-lg border-2 border-[#E1EEF3]">
                  <p className="text-[#0B3746] font-medium">#E1EEF3</p>
                  <p className="text-sm text-[#69AAC3]">border-border-light</p>
                </div>
                <div className="p-6 bg-white rounded-lg border-2 border-[#C3DDE7]">
                  <p className="text-[#0B3746] font-medium">#C3DDE7</p>
                  <p className="text-sm text-[#69AAC3]">border-border-light-hover</p>
                </div>
              </div>
            </div>

            {/* Dark Mode Borders */}
            <div>
              <h3 className="text-xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-4">Dark Mode</h3>
              <div className="space-y-4">
                <div className="p-6 bg-[#061E26] rounded-lg border-2 border-[#4B99B7]">
                  <p className="text-[#F9EFE4] font-medium">#4B99B7</p>
                  <p className="text-sm text-[#F3D5B7]">border-border-dark</p>
                </div>
                <div className="p-6 bg-[#061E26] rounded-lg border-2 border-[#69AAC3]">
                  <p className="text-[#F9EFE4] font-medium">#69AAC3</p>
                  <p className="text-sm text-[#F3D5B7]">border-border-dark-hover</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Border & Focus Colors */}
        <section>
          <h2 className="text-2xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-6">Border & Focus Colors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Borders */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-4">Borders</h3>
              <div className="space-y-4">
                <div className="p-6 rounded-lg border-2 border-[#E1EEF3] dark:border-[#4B99B7]">
                  <p className="font-medium text-[#0B3746] dark:text-[#F9EFE4]">Default Border</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-[#69AAC3]">Light: border-[#E1EEF3]</p>
                    <div className="h-8 w-full bg-white border-2 border-[#E1EEF3] rounded"></div>
                    <p className="text-sm text-[#F3D5B7]">Dark: border-[#4B99B7]</p>
                    <div className="h-8 w-full bg-[#061E26] border-2 border-[#4B99B7] rounded"></div>
                  </div>
                </div>
                <div className="p-6 rounded-lg border-2 border-[#C3DDE7] dark:border-[#69AAC3]">
                  <p className="font-medium text-[#0B3746] dark:text-[#F9EFE4]">Hover Border</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-[#69AAC3]">Light: border-[#C3DDE7]</p>
                    <div className="h-8 w-full bg-white border-2 border-[#C3DDE7] rounded"></div>
                    <p className="text-sm text-[#F3D5B7]">Dark: border-[#69AAC3]</p>
                    <div className="h-8 w-full bg-[#061E26] border-2 border-[#69AAC3] rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Focus Rings */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair text-[#0B3746] dark:text-[#F9EFE4] mb-4">Focus Rings</h3>
              <div className="space-y-4">
                <div className="p-6 rounded-lg border border-[#E1EEF3] dark:border-[#4B99B7]">
                  <p className="font-medium text-[#0B3746] dark:text-[#F9EFE4] mb-4">Focus Ring Examples</p>
                  <input 
                    type="text" 
                    placeholder="Focus me (Light Mode)"
                    className="w-full p-4 mb-4 rounded-lg border border-[#E1EEF3] focus:ring-2 focus:ring-[#EBB987] focus:border-transparent"
                  />
                  <p className="text-sm text-[#69AAC3] mb-2">Light: ring-[#EBB987]</p>
                  <input 
                    type="text" 
                    placeholder="Focus me (Dark Mode)"
                    className="w-full p-4 rounded-lg border border-[#4B99B7] bg-[#061E26] text-[#F9EFE4] focus:ring-2 focus:ring-[#E7AB6F] focus:border-transparent"
                  />
                  <p className="text-sm text-[#F3D5B7] mt-2">Dark: ring-[#E7AB6F]</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}