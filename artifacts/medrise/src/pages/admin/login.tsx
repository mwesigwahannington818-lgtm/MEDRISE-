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
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import logoBannerPath from "@assets/1778193288147[1]_1779241918471.jpg";


const ADMIN_ROLES = ["admin", "owner"];

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useAdminLogin();
  
  // If already logged in, redirect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: adminMe, isLoading: isCheckingAuth } = useGetAdminMe({ query: { retry: false } as any });

  React.useEffect(() => {
    if (adminMe) {
      setLocation("/admin/dashboard");
    }
  }, [adminMe, setLocation]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data: { success: boolean; admin: { name: string; role?: string | null }; token?: string }) => {
        if (data.success) {
          const role = data.admin.role ?? "";
          if (!ADMIN_ROLES.includes(role)) {
            toast({
              title: "Wrong Portal",
              description: "This portal is for administrators only. Please use the Staff Login.",
              variant: "destructive",
            });
            return;
          }
          if (data.token) {
            localStorage.setItem("medrise_admin_token", data.token);
          }
          toast({
            title: "Login Successful",
            description: `Welcome back, ${data.admin.name}`,
          });
          setLocation("/admin/dashboard");
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
        <div className="bg-primary p-8 text-center text-white flex flex-col items-center">
          <div className="bg-white p-3 rounded-xl inline-block mb-4 shadow-md">
            <img src={logoBannerPath} alt="MEDRISE MEDICAL CENTRE" className="h-10 object-contain" />
          </div>
          <div className="bg-white/20 p-3 rounded-xl inline-block mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Admin Portal</h1>
          <p className="text-primary-foreground/80 text-sm">Administrators Only</p>
          <p className="text-primary-foreground/60 text-xs mt-1">MEDRISE MEDICAL CENTRE</p>
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
                className="w-full h-12 text-base bg-primary hover:bg-primary/90 mt-4 rounded-xl"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authenticating...</>
                ) : (
                  "Sign In to Admin Dashboard"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Are you a doctor, nurse or other staff?{" "}
              <Link href="/staff/login" className="text-teal-600 font-medium hover:underline">
                Use Staff Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
