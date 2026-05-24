import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Phone, Menu, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT_INFO } from "@/lib/constants";
import logoBannerPath from "@assets/1778193288147[1]_1779241918471.jpg";

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/services", label: "Services" },
    { href: "/feedback", label: "Feedback" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
      <div className="bg-primary text-white text-sm py-2 px-4 hidden md:block">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {CONTACT_INFO.phonePrimary} / {CONTACT_INFO.phoneSecondary}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Opening Hours: 24/7 Mon-Sun</span>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src={logoBannerPath} alt="MedRise Medical Centre" className="h-12 object-contain" />
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`font-medium transition-colors hover:text-secondary ${
                location === link.href ? "text-secondary font-semibold" : "text-gray-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/appointment">
            <Button className="bg-secondary hover:bg-secondary/90 text-white rounded-full px-6">
              Book Appointment
            </Button>
          </Link>
        </nav>
        
        <button 
          className="md:hidden p-2 text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b shadow-lg py-4 px-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`font-medium py-2 border-b border-gray-50 ${
                location === link.href ? "text-secondary font-semibold" : "text-gray-700"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/appointment" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full bg-secondary hover:bg-secondary/90 text-white mt-2">
              Book Appointment
            </Button>
          </Link>
          <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5 gap-2">
              <Lock className="h-4 w-4" /> Staff Login
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
