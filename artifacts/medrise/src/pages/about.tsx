import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Shield, Target, Heart } from "lucide-react";

export default function About() {
  return (
    <Layout>
      {/* Page Header */}
      <section className="bg-primary/5 py-16 border-b border-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">About Us</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Dedicated to providing exceptional healthcare services to our community.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="/images/about.jpg" 
                alt="Doctor talking to patient" 
                className="rounded-xl shadow-xl w-full h-[500px] object-cover"
              />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">MEDRISE MEDICAL CENTRE</h2>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Located in the heart of Wakiso District, MEDRISE MEDICAL CENTRE is a premier healthcare facility committed to delivering compassionate, high-quality, and affordable medical care to individuals and families.
              </p>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Our clinic is equipped with modern facilities and staffed by a team of experienced healthcare professionals who put your well-being first. We believe that everyone deserves access to excellent healthcare in a welcoming and clean environment.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                    <Target className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Our Mission</h3>
                    <p className="text-sm text-gray-600">To provide accessible, patient-centered healthcare services that improve the quality of life in our community.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Our Vision</h3>
                    <p className="text-sm text-gray-600">To be the most trusted and preferred healthcare provider in Wakiso District, Uganda and beyond.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Our Core Values</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Heart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Compassion</h3>
              <p className="text-gray-600">Treating every patient with empathy, kindness, and understanding.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="h-14 w-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Excellence</h3>
              <p className="text-gray-600">Commitment to the highest standards of medical care and clinical outcomes.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Integrity</h3>
              <p className="text-gray-600">Honesty, transparency, and ethical conduct in all our professional practices.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="h-14 w-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Respect</h3>
              <p className="text-gray-600">Valuing the dignity, privacy, and rights of every individual we serve.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
