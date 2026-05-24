import { useEffect, useState, type FormEvent } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Stethoscope, Phone, Calendar, ArrowLeft } from "lucide-react";
import logoBannerPath from "@assets/1778193288147[1]_1779241918471.jpg";

export default function PatientLogin() {
  const [, setLocation] = useLocation();
  const { patientSession, setPatientSession } = useAuth();
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (patientSession) {
      setLocation("/patient/portal");
    }
  }, [patientSession, setLocation]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!phone || !dob) {
      setError("Please enter your phone number and date of birth.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/patients?search=${encodeURIComponent(phone)}`);
      const data = await res.json();
      const match = Array.isArray(data) && data.find(
        (p: { phone: string; dateOfBirth: string | null }) =>
          p.phone.replace(/\D/g, "") === phone.replace(/\D/g, "") &&
          p.dateOfBirth === dob
      );
      if (match) {
        setPatientSession({ id: match.id, name: match.fullName, phone: match.phone });
        setLocation("/patient/portal");
      } else {
        setError("No patient record found with that phone number and date of birth. Please contact the clinic.");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <img src={logoBannerPath} alt="MedRise" className="h-8 rounded" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient Portal</h1>
            <p className="text-gray-500 text-sm">Access your health records, appointments, and more.</p>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Sign In to Your Portal</CardTitle>
              <p className="text-sm text-gray-500">Use the phone number and date of birth you registered with.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    <Phone className="inline h-3.5 w-3.5 mr-1" />Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="e.g. 0770 000000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    <Calendar className="inline h-3.5 w-3.5 mr-1" />Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Access My Records"}
                </Button>
              </form>
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Not registered? <Link href="/appointment"><span className="text-primary font-medium cursor-pointer hover:underline">Book an appointment</span></Link> or call us at{" "}
                  <a href="tel:+256770775268" className="text-primary font-medium">+256 770 775268</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
