import React from "react";
import { Layout } from "@/components/layout/Layout";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { CONTACT_INFO } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

export default function Contact() {
  return (
    <Layout>
      <section className="bg-primary/5 py-16 border-b border-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Contact Us</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            We're here to help. Reach out to us for inquiries, feedback, or emergencies.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-gray-600 mb-8">
                Whether you have a question about our services, need to schedule an appointment, or require emergency assistance, our team is ready to assist you.
              </p>
              
              <div className="space-y-6">
                <Card className="border-gray-100 shadow-sm">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Our Location</h3>
                      <p className="text-gray-600">{CONTACT_INFO.address}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-100 shadow-sm">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Phone Numbers</h3>
                      <p className="text-gray-600">{CONTACT_INFO.phonePrimary}</p>
                      <p className="text-gray-600">{CONTACT_INFO.phoneSecondary}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-100 shadow-sm">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Email Address</h3>
                      <p className="text-gray-600 break-all">{CONTACT_INFO.email}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-gray-100 shadow-sm">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Opening Hours</h3>
                      <p className="text-gray-600">Open 24/7, Monday to Sunday</p>
                      <p className="text-sm text-gray-500 mt-1">Emergency services available round the clock</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="h-[600px] bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200">
              {/* Map Placeholder */}
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50 relative">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                <MapPin className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">Location Map</h3>
                <p className="text-gray-500 max-w-sm">
                  Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda
                </p>
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(CONTACT_INFO.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 px-6 py-2 bg-white border border-gray-200 shadow-sm rounded-full text-primary hover:bg-gray-50 transition-colors font-medium text-sm z-10"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
