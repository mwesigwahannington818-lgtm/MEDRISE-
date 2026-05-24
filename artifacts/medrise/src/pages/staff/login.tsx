import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminLogin, useGetAdminMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
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
import { Stethoscope, Loader2, ArrowLeft } from "lucide-react";
import logoBannerPath from "@assets/1778193288147[1]_1779241918471.jpg";

const MEDICAL_ROLES = ["doctor", "nurse", "midwife", "receptionist", "staff", "owner"];

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function StaffLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useAdminLogin();

  // If already logged in as medical staff, redirect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me, isLoading: isCheckingAuth } = useGetAdminMe({ query: { retry: false } as any });

  React.useEffect(() => {
    if (me && MEDICAL_ROLES.includes((me as { role?: string }).role ?? "")) {
      setLocation("/staff/dashboard");
    }
  }, [me, setLocation]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data: { success: boolean; admin: { name: string; role?: string | null }; token?: string }) => {
        if (data.success) {
          const role = data.admin.role ?? "";
          if (role === "admin") {
            toast({
              title: "Wrong Portal",
              description: "Administrators must use the Admin Login portal.",
              variant: "destructive",
            });
            return;
          }
          if (role === "owner") {
            if (data.token) localStorage.setItem("medrise_admin_token", data.token);
            toast({ title: "Welcome, Dr. Mwesigwa", description: "Redirecting to staff portal..." });
            setLocation("/staff/dashboard");
            return;
          }
          if (data.token) {
            localStorage.setItem("medrise_admin_token", data.token);
          }
          toast({
            title: "Login Successful",
            description: `Welcome, ${data.admin.name}`,
          });
          setLocation("/staff/dashboard");
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid credentials",
            variant: "destructive",
          });
        }
      },
      onError: () => {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      },
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="absolute top-6 left-6">
        <Link href="/">
          <Button variant="ghost" className="text-gray-600 hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Website
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-teal-600 p-8 text-center text-white flex flex-col items-center">
          <div className="bg-white p-3 rounded-xl inline-block mb-4 shadow-md">
            <img src={logoBannerPath} alt="MEDRISE MEDICAL CENTRE" className="h-10 object-contain" />
          </div>
          <div className="bg-white/20 p-3 rounded-xl inline-block mb-4">
            <Stethoscope className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Medical Staff Portal</h1>
          <p className="text-white/80 text-sm">Doctors · Nurses · Midwives · Receptionists</p>
          <p className="text-white/60 text-xs mt-1">MEDRISE MEDICAL CENTRE</p>
        </div>

        <div className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base bg-teal-600 hover:bg-teal-700 text-white mt-4 rounded-xl"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authenticating...</>
                ) : (
                  "Sign In to Staff Portal"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Are you an administrator?{" "}
              <Link href="/admin/login" className="text-primary font-medium hover:underline">
                Use Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
