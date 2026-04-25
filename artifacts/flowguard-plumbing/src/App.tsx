import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Menu, X, Phone, CheckCircle2, Clock, Wrench, ShieldCheck, MapPin, Droplet, Hammer, Bath, Shield, FileText, ArrowRight, Loader2 } from "lucide-react";
import plumbersImg from "@/assets/plumbers.png";
import heroImg from "@/assets/hero.png";
import secondImg from "@/assets/second.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const queryClient = new QueryClient();

// --- CONFIG BLOCK ---
// Future editors: update phone, email, business name here.
const PHONE_DISPLAY = "431-997-3415";
const PHONE_TEL = "4319973415";
const EMAIL = "priypatel008@gmail.com";
const BUSINESS_NAME = "FlowGuard Winnipeg Plumbing";
const SERVICE_AREA = "Winnipeg, Manitoba";
// --------------------

const formSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  service: z.string().min(1, "Please select a service"),
  description: z.string().optional(),
  dateNeeded: z.string().optional(),
  urgency: z.string().min(1, "Please select an urgency level"),
});

type FormValues = z.infer<typeof formSchema>;

function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSubmit, setDidSubmit] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      service: "",
      description: "",
      dateNeeded: "",
      urgency: "",
    },
  });

  // ---------------------------------------------------------------------------
  // Lead submission
  //
  // Posts to the shared API server at POST /api/contact, which:
  //   1. Saves the submission to PostgreSQL (so leads are never lost).
  //   2. Sends a notification email to LEAD_TO_EMAIL via Gmail SMTP using
  //      Nodemailer.
  //
  // The email route lives at:        artifacts/api-server/src/routes/leads.ts
  // The email transport lives at:    artifacts/api-server/src/lib/email.ts
  //
  // To change the receiving email:   update LEAD_TO_EMAIL in Replit Secrets.
  // To change the Gmail SMTP account: update SMTP_USER and SMTP_PASS in
  //                                   Replit Secrets (use a Gmail App Password).
  // SMTP credentials must stay in Replit Secrets / environment variables —
  // never hardcode them in frontend or backend source files.
  // ---------------------------------------------------------------------------
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const resp = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          source:
            typeof window !== "undefined"
              ? `Website request form (${window.location.pathname})`
              : "Website request form",
        }),
      });
      const json = (await resp.json().catch(() => ({}))) as {
        ok?: boolean;
        emailSent?: boolean;
      };
      if (!resp.ok || !json.ok) {
        throw new Error("Request failed");
      }
      setDidSubmit(true);
      toast.success(
        "Thanks — your request has been received. For urgent issues, please call 431-997-3415.",
      );
      form.reset();
    } catch (err) {
      toast.error("Something went wrong. Please call 431-997-3415.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Droplets className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg hidden sm:inline-block tracking-tight">{BUSINESS_NAME}</span>
            <span className="font-bold text-lg sm:hidden tracking-tight">FlowGuard</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollTo('services')} className="hover:text-primary transition-colors">Services</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-primary transition-colors">How It Works</button>
            <button onClick={() => scrollTo('request-service')} className="hover:text-primary transition-colors">Request Service</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-primary transition-colors">Contact</button>
          </nav>

          <div className="flex items-center gap-4">
            <Button asChild variant="default" className="hidden sm:flex shadow-md">
              <a href={`tel:${PHONE_TEL}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call Now
              </a>
            </Button>
            
            {/* Mobile tap-to-call icon button */}
            <Button asChild variant="default" size="icon" className="sm:hidden h-9 w-9">
              <a href={`tel:${PHONE_TEL}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>

            <button 
              className="md:hidden p-2 -mr-2 text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 flex flex-col gap-4 shadow-lg absolute w-full">
            <button onClick={() => scrollTo('services')} className="text-left font-medium py-2">Services</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-left font-medium py-2">How It Works</button>
            <button onClick={() => scrollTo('request-service')} className="text-left font-medium py-2">Request Service</button>
            <button onClick={() => scrollTo('contact')} className="text-left font-medium py-2">Contact</button>
            <Button asChild className="w-full mt-2">
              <a href={`tel:${PHONE_TEL}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call {PHONE_DISPLAY}
              </a>
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-50 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="absolute inset-0 z-0">
            <img
              src={heroImg}
              alt="Plumbing professionals working under a Winnipeg kitchen sink"
              className="w-full h-full object-cover opacity-60"
            />
            {/* Lighter wash so the photo reads through more clearly while the
                headline on the left stays comfortably readable. */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background/60 md:hidden" />
          </div>
          
          <div className="container relative z-10 mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <Badge variant="outline" className="mb-4 bg-background/50 backdrop-blur-sm border-primary/20 text-primary px-3 py-1 text-sm">
                Winnipeg's Trusted Local Plumber
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
                Need a Plumber in Winnipeg?
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Fast residential plumbing help for repairs, replacements, installs, leaks, water heaters, sump pumps, and urgent issues.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button asChild size="lg" className="text-base h-14 shadow-lg shadow-primary/20">
                  <a href={`tel:${PHONE_TEL}`}>
                    <Phone className="mr-2 h-5 w-5" />
                    Call Now
                  </a>
                </Button>
                <Button onClick={() => scrollTo('request-service')} size="lg" variant="outline" className="text-base h-14 bg-background/80 backdrop-blur-sm">
                  Request Service
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-y-2 gap-x-6 text-sm font-medium text-slate-600">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  Winnipeg residential plumbing
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  Same-day availability when possible
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  Quote before work starts
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Urgent Call Banner */}
        <section className="bg-primary text-primary-foreground py-4 shadow-inner relative z-20">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center text-center sm:text-left">
              <Clock className="h-5 w-5 mr-3 hidden sm:block opacity-80" />
              <p className="font-medium text-lg">Urgent plumbing issue? Call now for faster help.</p>
            </div>
            <Button asChild variant="secondary" className="w-full sm:w-auto font-bold text-primary whitespace-nowrap bg-white hover:bg-slate-100">
              <a href={`tel:${PHONE_TEL}`}>
                Call {PHONE_DISPLAY}
              </a>
            </Button>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 lg:py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Residential Plumbing Services in Winnipeg</h2>
              <p className="text-lg text-muted-foreground">Professional help for everything from a dripping faucet to a full basement bathroom installation.</p>
            </div>

            {/*
              Compact services layout — converted from large vertical cards to a
              denser 2-column (mobile) / 3-column (desktop) horizontal list.
              Same icons, same titles, same descriptions — just less padding,
              icon-on-the-left so each card takes far less vertical space, and
              the "Need Something Else?" CTA collapses into a full-width strip
              under the grid.
            */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-6xl mx-auto">
              {[
                { icon: Droplet, title: "Water Heater Services", desc: "Repair, replacement, and installation of traditional and tankless water heaters." },
                { icon: Shield, title: "Sump Pump & Basement Protection", desc: "Sump pump installs, battery backups, and preventative solutions for basement flooding." },
                { icon: Droplets, title: "Water Softener & Filtration", desc: "Whole-home water softeners and filtration systems to improve your water quality." },
                { icon: Bath, title: "Bathroom Plumbing", desc: "Toilet repairs, shower valves, tub installations, and sink fixture upgrades." },
                { icon: Wrench, title: "Kitchen Plumbing", desc: "Kitchen sink installs, garburators, dishwasher lines, and ice maker connections." },
                { icon: Droplet, title: "Leak Detection & Pipe Repairs", desc: "Locating and fixing hidden leaks, frozen pipes, and replacing old plumbing lines." },
                { icon: Hammer, title: "Basement Bathroom Plumbing", desc: "Rough-ins and complete plumbing setups for new basement bathrooms." },
                { icon: Wrench, title: "Fixture Installation & Replacement", desc: "Professional installation of owner-supplied or contractor-supplied plumbing fixtures." },
                { icon: Wrench, title: "Residential Plumbing Repairs", desc: "General troubleshooting and repair for any household plumbing problems." },
              ].map(({ icon: Icon, title, desc }) => (
                <Card
                  key={title}
                  className="shadow-sm border-slate-200 hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <CardContent className="p-4 md:p-5 flex gap-3 md:gap-4 items-start">
                    <div className="h-10 w-10 md:h-11 md:w-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base md:text-[17px] font-semibold leading-snug mb-1">{title}</h3>
                      <p className="text-sm text-muted-foreground leading-snug">{desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Full-width "Need something else?" CTA strip under the grid. */}
            <div className="mt-6 md:mt-8 max-w-6xl mx-auto">
              <Card className="border-primary bg-primary/5">
                <CardContent className="p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div>
                    <h3 className="text-base md:text-lg font-bold">Need Something Else? Give Us a Call</h3>
                    <p className="text-sm text-muted-foreground">If your plumbing issue isn't listed here, we can likely still help.</p>
                  </div>
                  <Button asChild className="flex-shrink-0">
                    <a href={`tel:${PHONE_TEL}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call {PHONE_DISPLAY}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
          </div>
        </section>

        {/* Featured Service Photo — sits between Services and How It Works.
            On mobile the photo sits on top with the headline / CTAs on a solid
            dark panel below it (more readable than overlay text on a small
            image). On desktop the photo and the text-panel sit side-by-side. */}
        <section className="bg-slate-900">
          <div className="container mx-auto px-4 py-10 md:py-16">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-800 max-w-6xl mx-auto bg-slate-900 grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-3 relative">
                <img
                  src={secondImg}
                  alt="FlowGuard plumber servicing a residential water heater in Winnipeg"
                  className="w-full h-[260px] sm:h-[340px] md:h-full md:min-h-[420px] object-cover block"
                  loading="lazy"
                />
                {/* Soft right-edge fade so the photo blends into the dark text panel on desktop. */}
                <div className="hidden md:block absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-slate-900" />
              </div>
              <div className="md:col-span-2 p-6 sm:p-8 md:p-10 text-white flex flex-col justify-center">
                <Badge className="mb-4 bg-primary/90 hover:bg-primary border-0 w-fit">
                  Water Heaters · Repairs · Installs
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
                  Done right the first time, by people who care.
                </h3>
                <p className="text-sm md:text-base text-slate-300 mb-6 leading-relaxed">
                  Whether it's a worn-out water heater or a stubborn leak under the sink, we walk you through the fix and quote it before any work begins.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="h-11 md:h-12">
                    <a href={`tel:${PHONE_TEL}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call {PHONE_DISPLAY}
                    </a>
                  </Button>
                  <Button onClick={() => scrollTo('request-service')} size="lg" variant="secondary" className="h-11 md:h-12">
                    Request Service
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24 lg:py-28 bg-slate-50 border-y border-slate-200">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
              <p className="text-base md:text-lg text-muted-foreground">Our simple, stress-free process for Winnipeg homeowners.</p>
            </div>

            {/* Mobile: horizontal row layout (number | icon | text) for compact, scannable list.
                Desktop: 4-column grid. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto">
              {[
                { n: 1, icon: Phone, text: "Tell us what plumbing issue you're dealing with" },
                { n: 2, icon: FileText, text: "We review your request and confirm availability" },
                { n: 3, icon: ShieldCheck, text: "A plumbing professional provides a quote before starting" },
                { n: 4, icon: CheckCircle2, text: "The job gets completed professionally" },
              ].map(({ n, icon: Icon, text }) => (
                <div
                  key={n}
                  className="flex md:flex-col items-center md:items-center gap-4 md:gap-0 md:text-center bg-white md:bg-transparent rounded-xl md:rounded-none border md:border-0 border-slate-200 p-4 md:p-0 shadow-sm md:shadow-none"
                >
                  {/* Number + icon row — kept side-by-side on mobile.
                      On desktop, the number sits on top and icon below for vertical step layout. */}
                  <div className="flex items-center gap-3 md:flex-col md:gap-3 flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg md:text-xl font-bold shadow-md flex-shrink-0">
                      {n}
                    </div>
                    <div className="bg-primary/10 p-2.5 md:p-3 rounded-full flex-shrink-0">
                      <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                  </div>
                  <p className="font-medium text-base md:text-lg leading-snug text-left md:text-center md:mt-4">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Local Pros Section — uses the supplied photo of plumbing professionals.
            Tightened vertical spacing so the Quote First badge below the photo
            sits closer to the next section. */}
        <section className="py-10 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className="relative order-2 lg:order-1"
              >
                <div className="rounded-2xl overflow-hidden shadow-xl shadow-slate-300/40 border border-slate-200">
                  <img
                    src={plumbersImg}
                    alt="Plumbing professionals reviewing a service quote in a Winnipeg home"
                    className="w-full h-auto block"
                    loading="lazy"
                  />
                </div>
                {/* Floating badge — visible on every breakpoint, but slightly
                    smaller and inset on mobile so it doesn't run off the screen. */}
                <div className="absolute -bottom-3 -right-2 sm:-bottom-5 sm:-right-5 bg-primary text-primary-foreground rounded-xl px-3 py-2 sm:px-5 sm:py-3 shadow-lg shadow-primary/20 flex items-center gap-2 sm:gap-3 max-w-[80%]">
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-wide opacity-80 leading-tight">Quote First</div>
                    <div className="font-bold text-xs sm:text-sm leading-tight">Before any work begins</div>
                  </div>
                </div>
              </motion.div>

              <div className="order-1 lg:order-2">
                <Badge variant="outline" className="w-fit mb-4 text-primary border-primary/20 bg-primary/5">
                  Real Plumbing Pros
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5 leading-tight">
                  Friendly help from people who do this for a living.
                </h2>
                <p className="text-base md:text-lg text-slate-600 mb-6 leading-relaxed">
                  We connect Winnipeg homeowners with qualified plumbing professionals who walk you through the issue, explain the fix in plain language, and give you a clear quote before any work starts. No pressure, no surprises — just real help.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Clear explanations, no jargon</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Quote and scope confirmed before tools come out</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Tidy work — your home is left how we found it</span>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="h-12">
                    <a href={`tel:${PHONE_TEL}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call {PHONE_DISPLAY}
                    </a>
                  </Button>
                  <Button onClick={() => scrollTo('request-service')} size="lg" variant="outline" className="h-12">
                    Request Service
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us & Form Section side-by-side on desktop */}
        <section id="request-service" className="py-20 lg:py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
              
              {/* Why Choose Us */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                <Badge variant="outline" className="w-fit mb-4 text-primary border-primary/20 bg-primary/5">Dependable Service</Badge>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Why Winnipeg Homeowners Call Us</h2>
                <p className="text-lg text-muted-foreground mb-8">We focus on solving your residential plumbing problems quickly, cleanly, and correctly the first time.</p>
                
                <ul className="space-y-6">
                  <li className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-medium">Local Winnipeg residential plumbing help</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-medium">Fast response for urgent issues</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-medium">Clear quotes before work begins</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <Wrench className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-medium">Help with repairs, replacements, installs, and upgrades</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-medium">Simple booking by phone or online form</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Lead Form */}
              <div className="lg:col-span-7">
                <Card className="border-slate-200 shadow-lg shadow-slate-200/50">
                  <CardContent className="p-6 md:p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold mb-2">Request Plumbing Service</h3>
                      <p className="text-slate-500">Fill out the form below and we'll get back to you to confirm details and availability.</p>
                    </div>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
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
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl>
                                  <Input type="tel" placeholder="431-123-4567" {...field} />
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
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="john@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="urgency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Urgency *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select urgency level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Urgent / Same Day">Urgent / Same Day</SelectItem>
                                    <SelectItem value="Within 1–2 Days">Within 1–2 Days</SelectItem>
                                    <SelectItem value="This Week">This Week</SelectItem>
                                    <SelectItem value="Flexible">Flexible</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="service"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Needed *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a service" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Water Heater Services">Water Heater Services</SelectItem>
                                  <SelectItem value="Sump Pump & Basement Protection">Sump Pump & Basement Protection</SelectItem>
                                  <SelectItem value="Water Softener & Filtration">Water Softener & Filtration</SelectItem>
                                  <SelectItem value="Bathroom Plumbing">Bathroom Plumbing</SelectItem>
                                  <SelectItem value="Kitchen Plumbing">Kitchen Plumbing</SelectItem>
                                  <SelectItem value="Leak Detection & Pipe Repairs">Leak Detection & Pipe Repairs</SelectItem>
                                  <SelectItem value="Basement Bathroom Plumbing">Basement Bathroom Plumbing</SelectItem>
                                  <SelectItem value="Fixture Installation & Replacement">Fixture Installation & Replacement</SelectItem>
                                  <SelectItem value="Residential Plumbing Repairs">Residential Plumbing Repairs</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description / Requirements (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Please provide any details about the plumbing issue or project..." 
                                  className="min-h-[100px] resize-y"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dateNeeded"
                          render={({ field }) => (
                            <FormItem className="sm:w-1/2">
                              <FormLabel>Date Needed By (Optional)</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full text-base h-12 mt-4">
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : didSubmit ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Send Another Request
                            </>
                          ) : (
                            <>
                              Request Service <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                        {/*
                          Submit handler: see onSubmit() above.
                          Posts to POST /api/contact (artifacts/api-server/src/routes/leads.ts).
                          Email transport (Nodemailer + Gmail SMTP) lives in
                          artifacts/api-server/src/lib/email.ts. SMTP_USER, SMTP_PASS, and
                          LEAD_TO_EMAIL are read from Replit Secrets — never hardcoded here.
                        */}
                        <p className="text-xs text-center text-slate-500 mt-4">
                          For immediate urgent assistance, please skip this form and <a href={`tel:${PHONE_TEL}`} className="text-primary font-medium hover:underline">call {PHONE_DISPLAY}</a> directly.
                        </p>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </section>

        {/* Service Area & Map Section */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Serving All of Winnipeg</h2>
                <p className="text-lg text-slate-600 mb-6">
                  We provide residential plumbing help to homeowners across every neighbourhood in {SERVICE_AREA} — from the core to the suburbs.
                </p>
                <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-full px-5 py-3 shadow-sm">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-semibold text-slate-800">All Winnipeg neighbourhoods welcome</span>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden shadow-md h-[400px] border border-slate-200">
                <iframe 
                  src="https://www.google.com/maps?q=Winnipeg,+Manitoba,+Canada&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map of Winnipeg, Manitoba"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 lg:py-28 bg-slate-900 text-slate-50">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-full mb-6">
              <Droplets className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">Contact {BUSINESS_NAME}</h2>
            
            <div className="flex flex-col md:flex-row justify-center gap-8 mb-12">
              <a href={`tel:${PHONE_TEL}`} className="flex flex-col items-center group">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <Phone className="h-6 w-6" />
                </div>
                <span className="text-sm text-slate-400 mb-1">Call Us</span>
                <span className="text-xl font-bold text-white group-hover:text-primary-foreground transition-colors">{PHONE_DISPLAY}</span>
              </a>
              
              <a href={`mailto:${EMAIL}`} className="flex flex-col items-center group">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="text-sm text-slate-400 mb-1">Email Us</span>
                <span className="text-lg font-medium text-white group-hover:text-primary-foreground transition-colors">{EMAIL}</span>
              </a>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <span className="text-sm text-slate-400 mb-1">Service Area</span>
                <span className="text-lg font-medium text-white">{SERVICE_AREA}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8">
                <a href={`tel:${PHONE_TEL}`}>Call Now</a>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-slate-900 bg-white hover:bg-slate-100" onClick={() => scrollTo('request-service')}>
                Request Service
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 text-white opacity-90">
            <Droplets className="h-5 w-5" />
            <span className="font-bold text-xl">{BUSINESS_NAME}</span>
          </div>
          <p className="mb-8">Residential plumbing service in {SERVICE_AREA}</p>
          
          <div className="max-w-4xl mx-auto mb-8 p-4 border border-slate-800 rounded-lg bg-slate-900/50 text-xs text-slate-500 text-left">
            <p>Disclaimer: Plumbing work is completed by qualified plumbing professionals. Quotes, permits, licensing requirements, and workmanship are handled by the assigned plumbing contractor.</p>
          </div>
          
          <p className="text-sm">
            &copy; {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Floating Mobile FAB */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <Button asChild size="icon" className="h-14 w-14 rounded-full shadow-xl shadow-primary/30">
          <a href={`tel:${PHONE_TEL}`}>
            <Phone className="h-6 w-6" />
            <span className="sr-only">Call {PHONE_DISPLAY}</span>
          </a>
        </Button>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
