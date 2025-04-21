'use client';

import Image from "next/image";
import Link from "next/link";
import Input from '@/components/ui/Input';
import DateInput from '@/components/ui/DateInput';
import { useState } from "react";

const PLACEHOLDER_BASE = "https://placehold.co";
const BRAND_COLORS = {
  navy: "1A2B3C",
  gold: "C4A962",
};

const destinations = [
  { 
    name: 'Cape Town', 
    image: `${PLACEHOLDER_BASE}/800x1200/1A2B3C/FFFFFF?text=Cape+Town`,
    description: 'Experience the Mother City'
  },
  { 
    name: 'Johannesburg', 
    image: `${PLACEHOLDER_BASE}/800x1200/1A2B3C/FFFFFF?text=Johannesburg`,
    description: 'The City of Gold'
  },
  { 
    name: 'Durban', 
    image: `${PLACEHOLDER_BASE}/800x1200/1A2B3C/FFFFFF?text=Durban`,
    description: 'The Warmest Place to Be'
  }
];

const aircraft = [
  { 
    name: 'Light Jets', 
    image: `${PLACEHOLDER_BASE}/600x400/1A2B3C/FFFFFF?text=Light+Jets`,
    description: 'Perfect for short trips'
  },
  { 
    name: 'Midsize Jets', 
    image: `${PLACEHOLDER_BASE}/600x400/1A2B3C/FFFFFF?text=Midsize+Jets`,
    description: 'Ideal for regional flights'
  },
  { 
    name: 'Heavy Jets', 
    image: `${PLACEHOLDER_BASE}/600x400/1A2B3C/FFFFFF?text=Heavy+Jets`,
    description: 'Long-range luxury'
  },
  { 
    name: 'VIP Airliners', 
    image: `${PLACEHOLDER_BASE}/600x400/1A2B3C/FFFFFF?text=VIP+Airliners`,
    description: 'Ultimate luxury travel'
  }
];

export default function Home() {
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    departureDate: '',
    passengers: '1'
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <section className="relative min-h-[600px] h-screen">
        {/* Full-screen background image with overlay */}
        <div className="absolute inset-0 bg-light dark:bg-gradient-to-br dark:from-charter-navy-900 dark:via-charter-navy-950 dark:to-black">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-charter-navy-50 dark:bg-charter-navy-900 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/patterns/grid.svg')] bg-repeat"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-charter-navy-900 dark:text-[#F9EFE4] mb-4 sm:mb-6 leading-tight text-center sm:text-left">
                Experience Luxury <br className="hidden sm:block"/>
                <span className="text-charter-gold-500 dark:text-charter-gold-400">in the Skies</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-charter-navy-700 dark:text-[#F9EFE4] mb-8 sm:mb-12 font-inter text-center sm:text-left">
                Private aviation tailored to your journey
              </p>
              
              {/* Search Flight Form */}
              <div className="bg-light dark:bg-charter-navy-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <Input
                    label="From"
                    name="from"
                    value={searchForm.from}
                    onChange={handleSearchChange}
                    helperText="Departure city or airport"
                    className="w-full px-4 py-3 rounded-lg border-2 border-charter-navy-200 dark:border-charter-navy-600 bg-white dark:bg-charter-navy-700 focus:ring-2 focus:ring-charter-gold-400 focus:border-charter-gold-400 transition-all duration-200 text-charter-navy-900 dark:text-[#F9EFE4] placeholder:text-charter-navy-400 dark:placeholder:text-[#F9EFE4]/70"
                  />
                  <Input
                    label="To"
                    name="to"
                    value={searchForm.to}
                    onChange={handleSearchChange}
                    helperText="Destination city or airport"
                    className="w-full px-4 py-3 rounded-lg border-2 border-charter-navy-200 dark:border-charter-navy-600 bg-white dark:bg-charter-navy-700 focus:ring-2 focus:ring-charter-gold-400 focus:border-charter-gold-400 transition-all duration-200 text-charter-navy-900 dark:text-[#F9EFE4] placeholder:text-charter-navy-400 dark:placeholder:text-[#F9EFE4]/70"
                  />
                  <DateInput
                    label="Departure Date"
                    name="departureDate"
                    value={searchForm.departureDate}
                    onChange={handleSearchChange}
                    helperText="Select your travel date"
                    className="w-full px-4 py-3 rounded-lg border-2 border-charter-navy-200 dark:border-charter-navy-600 bg-white dark:bg-charter-navy-700 focus:ring-2 focus:ring-charter-gold-400 focus:border-charter-gold-400 transition-all duration-200 text-charter-navy-900 dark:text-[#F9EFE4]"
                  />
                  <Input
                    label="Passengers"
                    name="passengers"
                    type="number"
                    value={searchForm.passengers}
                    onChange={handleSearchChange}
                    min="1"
                    helperText="Number of passengers"
                    className="w-full px-4 py-3 rounded-lg border-2 border-charter-navy-200 dark:border-charter-navy-600 bg-white dark:bg-charter-navy-700 focus:ring-2 focus:ring-charter-gold-400 focus:border-charter-gold-400 transition-all duration-200 text-charter-navy-900 dark:text-[#F9EFE4] placeholder:text-charter-navy-400 dark:placeholder:text-[#F9EFE4]/70"
                  />
                </div>
                <div className="mt-6">
                  <button className="w-full sm:w-auto px-8 py-4 bg-charter-gold-500 hover:bg-charter-gold-600 text-white rounded-lg text-lg font-medium transition-colors duration-200">
                    Search Flights
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-12 sm:py-16 md:py-20 bg-background-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-primary text-center mb-8 sm:mb-12">Popular Destinations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {destinations.map((city) => (
              <div key={city.name} className="group relative h-64 sm:h-80 md:h-96 overflow-hidden rounded-xl">
            <Image
                  src={city.image}
                  alt={city.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charter-navy-900/90 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                  <h3 className="text-xl sm:text-2xl text-light font-playfair mb-1 sm:mb-2">{city.name}</h3>
                  <p className="text-sm sm:text-base text-light/90">{city.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aircraft Showcase */}
      <section className="py-12 sm:py-16 md:py-20 bg-background-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-primary text-center mb-8 sm:mb-12">Our Fleet</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {aircraft.map((item) => (
              <div key={item.name} className="group cursor-pointer">
                <div className="relative h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden mb-3 sm:mb-4">
          <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-playfair text-primary text-center mb-1 sm:mb-2">{item.name}</h3>
                <p className="text-secondary text-center text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Empty Legs Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-charter-navy-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="w-full md:w-1/2">
              <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-light mb-4 sm:mb-6">Empty Leg Flights</h2>
              <p className="text-lg sm:text-xl text-light/80 mb-6 sm:mb-8">
                Take advantage of exclusive deals on empty leg flights. Save up to 75% on private jet travel.
              </p>
              <Link
                href="/empty-legs"
                className="inline-block px-6 sm:px-8 py-3 bg-interactive-default hover:bg-interactive-hover active:bg-interactive-active text-light rounded-lg transition-colors font-medium text-sm sm:text-base"
              >
                View Available Flights
              </Link>
            </div>
            <div className="w-full md:w-1/2 relative h-64 sm:h-80 md:h-96">
          <Image
                src={`${PLACEHOLDER_BASE}/800x600/${BRAND_COLORS.gold}/${BRAND_COLORS.navy}?text=Empty+Leg+Flights`}
                alt="Empty leg flight promotion"
                fill
                className="object-cover rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-charter-navy-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 sm:col-span-1">
          <Image
                src={`${PLACEHOLDER_BASE}/240x80/${BRAND_COLORS.gold}/FFFFFF?text=CHARTER`}
                alt="Charter Logo" 
                width={120} 
                height={40} 
                className="mb-4 sm:mb-6" 
              />
              <p className="text-sm sm:text-base text-light/70">
                Your trusted partner in private aviation
              </p>
            </div>
            <div>
              <h4 className="font-playfair text-base sm:text-lg text-light mb-3 sm:mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm sm:text-base text-light/70 hover:text-light transition-colors">About Us</Link></li>
                <li><Link href="/fleet" className="text-sm sm:text-base text-light/70 hover:text-light transition-colors">Our Fleet</Link></li>
                <li><Link href="/contact" className="text-sm sm:text-base text-light/70 hover:text-light transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-playfair text-base sm:text-lg text-light mb-3 sm:mb-4">Services</h4>
              <ul className="space-y-2">
                <li><Link href="/charter" className="text-sm sm:text-base text-light/70 hover:text-light transition-colors">Private Charter</Link></li>
                <li><Link href="/empty-legs" className="text-sm sm:text-base text-light/70 hover:text-light transition-colors">Empty Legs</Link></li>
                <li><Link href="/membership" className="text-sm sm:text-base text-light/70 hover:text-light transition-colors">Membership</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-playfair text-base sm:text-lg text-light mb-3 sm:mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm sm:text-base text-light/70">
                <li>+27 XXX XXX XXX</li>
                <li>info@chartermarket.app</li>
                <li>Cape Town, South Africa</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-charter-navy-400/20 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-sm sm:text-base text-light/60">
            <p>© 2024 Charter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
