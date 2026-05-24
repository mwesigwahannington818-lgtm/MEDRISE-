import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useSubmitFeedback } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICES } from "@/lib/constants";
import { Star, CheckCircle2, MessageSquareHeart } from "lucide-react";

const RECOMMEND_OPTIONS = [
  { value: "yes", label: "Yes, definitely" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

export default function FeedbackPage() {
  const { toast } = useToast();
  const submitFeedback = useSubmitFeedback();
  const [success, setSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [form, setForm] = useState({
    patientName: "",
    phone: "",
    service: "",
    comment: "",
    wouldRecommend: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" }); return;
    }
    if (rating === 0) {
      toast({ title: "Please select a star rating", variant: "destructive" }); return;
    }
    submitFeedback.mutate({
      data: {
        patientName: form.patientName,
        phone: form.phone || undefined,
        service: form.service || undefined,
        rating,
        comment: form.comment || undefined,
        wouldRecommend: (form.wouldRecommend as "yes" | "no" | "maybe") || undefined,
      },
    }, {
      onSuccess: () => {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      onError: () => toast({ title: "Failed to submit feedback. Please try again.", variant: "destructive" }),
    });
  };

  const starLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <Layout>
      <section className="bg-primary/5 py-16 border-b border-primary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <MessageSquareHeart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-4">Share Your Experience</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Your feedback helps us improve our services. We value every opinion — thank you for taking a moment to share yours.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-12 rounded-xl text-center shadow-sm">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-3">Thank You!</h2>
                <p className="text-lg mb-8">
                  Your feedback has been received. We appreciate you taking the time to share your experience at MEDRISE MEDICAL CENTRE.
                </p>
                <Button
                  onClick={() => { setSuccess(false); setRating(0); setForm({ patientName: "", phone: "", service: "", comment: "", wouldRecommend: "" }); }}
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-8"
                >
                  Submit Another Response
                </Button>
              </div>
            ) : (
              <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Star rating */}
                  <div className="text-center py-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">How would you rate your overall experience? *</p>
                    <div className="flex justify-center gap-2" onMouseLeave={() => setHovered(0)}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHovered(star)}
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star
                            className={`h-10 w-10 transition-colors ${
                              star <= (hovered || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {(hovered || rating) > 0 && (
                      <p className="text-sm font-medium text-yellow-600 mt-2">{starLabels[hovered || rating]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name *</label>
                      <Input
                        placeholder="Full name"
                        value={form.patientName}
                        onChange={e => handleChange("patientName", e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (Optional)</label>
                      <Input
                        placeholder="+256 700 000000"
                        value={form.phone}
                        onChange={e => handleChange("phone", e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Received</label>
                      <Select value={form.service} onValueChange={v => handleChange("service", v)}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Select service (optional)" /></SelectTrigger>
                        <SelectContent>
                          {SERVICES.map(s => <SelectItem key={s.title} value={s.title}>{s.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Would you recommend us?</label>
                      <Select value={form.wouldRecommend} onValueChange={v => handleChange("wouldRecommend", v)}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Select an option" /></SelectTrigger>
                        <SelectContent>
                          {RECOMMEND_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Comments</label>
                    <Textarea
                      placeholder="Tell us what you liked, what we could improve, or anything else you'd like to share…"
                      value={form.comment}
                      onChange={e => handleChange("comment", e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-white rounded-xl"
                      disabled={submitFeedback.isPending}
                    >
                      {submitFeedback.isPending ? "Submitting…" : "Submit Feedback"}
                    </Button>
                    <p className="text-center text-sm text-gray-500 mt-4">Your feedback is anonymous and will be used to improve our services.</p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
