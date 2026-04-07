import { useState } from "react";
import { Link } from "wouter";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
      } else {
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-black/40 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Message Sent!</h2>
          <p className="text-gray-300 mb-8">
            Thank you for reaching out. We've received your message and will get back to you as soon as possible.
          </p>
          <Link href="/">
            <Button className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-black/40 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Contact Us</h2>
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Name</label>
            <Input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Email</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Message</label>
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="How can we help you?"
              rows={5}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
            />
          </div>

          <Button
            type="submit"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-gray-300 h-10 px-4 py-2 w-full text-[#000000] bg-[#fafafa]"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}