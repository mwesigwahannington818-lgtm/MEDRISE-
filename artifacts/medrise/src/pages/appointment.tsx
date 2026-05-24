import React from "react";
import { Layout } from "@/components/layout/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateAppointment } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { SERVICES } from "@/lib/constants";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const DOCTORS = [
  "Dr. Mwesigwa Hannington",
  "Dr. Nalwoga Aisha",
  "Dr. Kizito Emmanuel",
  "Dr. Namukasa Sarah",
  "Dr. Ssebuufu Richard",
  "Dr. Nakiganda Grace",
  "Midwife Nakato Joan",
  "Nurse Ssebuliba Peter",
];

const formSchema = z.object({
  patientName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(5, "Valid phone number is required"),
  email: z.string().email("Invalid email address").or(z.literal("")),
  age: z.string().optional(),
  ageUnit: z.enum(["years", "months", "days"]).default("years"),
  sex: z.string().optional(),
  service: z.string().min(1, "Please select a service"),
  preferredDate: z.date({
    required_error: "Please select a date",
  }),
  preferredTime: z.string().min(1, "Please select a time"),
  preferredDoctor: z.string().optional(),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Appointment() {
  const { toast } = useToast();
  const createAppointment = useCreateAppointment();
  const [success, setSuccess] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      phone: "",
      email: "",
      age: "",
      ageUnit: "years" as const,
      sex: "",
      service: "",
      preferredTime: "",
      preferredDoctor: "",
      message: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    createAppointment.mutate({
      data: {
        patientName: values.patientName,
        phone: values.phone,
        email: values.email,
        age: values.age ? parseInt(values.age) : undefined,
        sex: values.sex || undefined,
        service: values.service,
        preferredDate: format(values.preferredDate, "yyyy-MM-dd"),
        preferredTime: values.preferredTime,
        preferredDoctor: values.preferredDoctor || undefined,
        message: [
          values.age ? `Age: ${values.age} ${values.ageUnit}` : "",
          values.message,
        ].filter(Boolean).join(" | ") || undefined,
      }
    }, {
      onSuccess: () => {
        setSuccess(true);
        form.reset();
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      onError: (err) => {
        toast({
          title: "Booking Failed",
          description: "There was an error booking your appointment. Please try again or call us.",
          variant: "destructive",
        });
        console.error("Booking error:", err);
      }
    });
  };

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", 
    "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", 
    "04:00 PM", "05:00 PM", "06:00 PM"
  ];

  return (
    <Layout>
      <section className="bg-primary/5 py-16 border-b border-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Book an Appointment</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Schedule your visit online. Fill out the form below and we will confirm your appointment shortly.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-12 rounded-xl text-center shadow-sm">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4">Appointment Request Sent!</h2>
                <p className="text-lg mb-8">
                  Thank you for booking with MEDRISE MEDICAL CENTRE. We have received your request and will contact you shortly to confirm your appointment.
                </p>
                <Button 
                  onClick={() => setSuccess(false)}
                  className="bg-secondary hover:bg-secondary/90 text-white rounded-full px-8"
                >
                  Book Another Appointment
                </Button>
              </div>
            ) : (
              <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-gray-100">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="patientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Mwesigwa Hannington" className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="+256751527730" className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Email Address (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="medrisemedicalcentre@gmail.com" type="email" className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="service"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Select Service *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Choose a service" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SERVICES.map(s => (
                                  <SelectItem key={s.title} value={s.title}>{s.title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Age</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="e.g. 3" type="number" min={0} max={999} className="h-12 flex-1" {...field} />
                              </FormControl>
                              <FormField
                                control={form.control}
                                name="ageUnit"
                                render={({ field: unitField }) => (
                                  <Select onValueChange={unitField.onChange} value={unitField.value}>
                                    <SelectTrigger className="h-12 w-28">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="years">Years</SelectItem>
                                      <SelectItem value="months">Months</SelectItem>
                                      <SelectItem value="days">Days</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sex"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Sex</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select sex" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="preferredDoctor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Preferred Doctor / Midwife / Nurse (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="No preference — any available clinician" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="no-preference">No preference</SelectItem>
                              {DOCTORS.map(doc => (
                                <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="preferredDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col pt-2">
                            <FormLabel className="text-gray-700">Preferred Date *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "h-12 pl-3 text-left font-normal border-input",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferredTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Preferred Time *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Choose time slot" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map(time => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Additional Message / Symptoms (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Briefly describe your symptoms or reason for visit..." 
                              className="min-h-[120px] resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4 border-t border-gray-100">
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-white rounded-xl"
                        disabled={createAppointment.isPending}
                      >
                        {createAppointment.isPending ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Request...</>
                        ) : (
                          "Confirm Appointment Request"
                        )}
                      </Button>
                      <p className="text-center text-sm text-gray-500 mt-4">
                        By submitting this form, you agree to our privacy policy.
                      </p>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
