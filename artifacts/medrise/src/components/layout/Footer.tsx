import React from "react";
import { Link } from "wouter";
import { Phone, Mail, MapPin } from "lucide-react";
import { CONTACT_INFO } from "@/lib/constants";
import logoBannerPath from "@assets/1778193288147[1]_1779241918471.jpg";

export function Footer() {
  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="bg-white p-2 rounded inline-block mb-4">
              <img src={logoBannerPath} alt="MedRise Medical Centre" className="h-10 object-contain" />
            </div>
            <p className="text-primary-foreground/80 mt-4 text-sm leading-relaxed">
              Compassionate Care. Better Health. Brighter Lives. We provide top quality, affordable medical services in Wakiso District, Uganda and beyond.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-primary-foreground/20 pb-2 inline-block">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-primary-foreground/80 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="text-primary-foreground/80 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/services" className="text-primary-foreground/80 hover:text-white transition-colors">Our Services</Link></li>
              <li><Link href="/appointment" className="text-primary-foreground/80 hover:text-white transition-colors">Book Appointment</Link></li>
              <li><Link href="/contact" className="text-primary-foreground/80 hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-primary-foreground/20 pb-2 inline-block">Services</h3>
            <ul className="space-y-2">
              <li className="text-primary-foreground/80">General Consultation</li>
              <li className="text-primary-foreground/80">Emergency Care</li>
              <li className="text-primary-foreground/80">Laboratory Services</li>
              <li className="text-primary-foreground/80">Maternal & Child Health</li>
              <li className="text-primary-foreground/80">Pharmacy</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-primary-foreground/20 pb-2 inline-block">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <span className="text-primary-foreground/80 text-sm">{CONTACT_INFO.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-secondary shrink-0" />
                <span className="text-primary-foreground/80 text-sm">{CONTACT_INFO.phonePrimary}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-secondary shrink-0" />
                <span className="text-primary-foreground/80 text-sm break-all">{CONTACT_INFO.email}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} MEDRISE MEDICAL CENTRE. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex gap-4">
            <Link href="/staff/login" className="hover:text-white transition-colors">Staff Login</Link>
            <span className="text-primary-foreground/30">|</span>
            <Link href="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
