import React from "react";
import { Link } from "wouter";
import { ArrowRight, Clock, Shield, Award, Users } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero.jpg" 
            alt="MedRise Medical Centre" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-primary/70 mix-blend-multiply"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl text-white">
            <span className="inline-block py-1 px-3 rounded-full bg-secondary text-white text-sm font-semibold mb-4">
              Wakiso District, Uganda
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Compassionate Care.<br />
              <span className="text-secondary">Better Health.</span><br />
              Brighter Lives.
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Your trusted partner in healthcare. We provide professional, accessible, and affordable medical services with a focus on patient well-being.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/appointment">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white rounded-full px-8 h-12 text-base">
                  Book an Appointment
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-full px-8 h-12 text-base">
                  Our Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">24/7 Service</h3>
                <p className="text-sm text-gray-500">Always here for you</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Modern Equipment</h3>
                <p className="text-sm text-gray-500">Accurate diagnostics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Experienced Doctors</h3>
                <p className="text-sm text-gray-500">Expert medical care</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Affordable Care</h3>
                <p className="text-sm text-gray-500">Quality within reach</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Medical Services</h2>
            <p className="text-gray-600">
              We offer a comprehensive range of medical services to meet the healthcare needs of you and your family.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.slice(0, 8).map((service) => (
              <Card key={service.id} className="border-0 shadow-md hover-elevate transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/services">
              <Button className="rounded-full" variant="outline">
                View All Services <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
