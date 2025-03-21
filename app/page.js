'use client'

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, PlayCircle } from "lucide-react";
import Link from "next/link";
import { SignedOut, SignedIn, SignUpButton } from "@clerk/nextjs";

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-20 px-5">
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Summarize YouTube Videos in Seconds!
        </motion.h1>
        <p className="text-lg md:text-xl max-w-2xl text-gray-600 dark:text-gray-300 mb-6">
          Get concise, accurate summaries of YouTube videos without watching them. Save time and stay informed.
        </p>
        <SignedOut>
          <SignUpButton mode="modal" forceRedirectUrl="/summarizer">
            <Button className="px-6 py-3 text-lg" size="lg">
              Get Started
            </Button>
          </SignUpButton >
        </SignedOut>

        <SignedIn>
            <Button className="bg-blue-500 hover:bg-blue-700 px-6 py-3 text-lg rounded-full shadow-lg mr-4"
                onClick={() => router.push("/summarizer")}
                >
                Back To Summarizer
            </Button>
        </SignedIn>
      </section>

      {/* Features Section */}
      <section className="py-16 px-5 text-center bg-gray-100 dark:bg-gray-800">
        <h2 className="text-3xl font-bold mb-8">Why Use γTube?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Accurate Summaries", desc: "AI extracts key points and themes instantly.", icon: CheckCircle },
            { title: "Text-to-Speech", desc: "Listen to the summary instead of reading.", icon: PlayCircle },
            { title: "Fast & Reliable", desc: "Get results in seconds, anytime, anywhere.", icon: CheckCircle },
          ].map(({ title, desc, icon: Icon }, index) => (
            <motion.div
              key={index}
              className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Icon className="w-10 h-10 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-5 text-center">
        <h2 className="text-3xl font-bold mb-8">How γTube Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {["Log in","Enter Video Title or URL", "AI Analyzes & Summarizes", "Read or Listen to the Summary"].map((step, index) => (
            <motion.div
              key={index}
              className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-4xl font-bold text-blue-500">{index + 1}</span>
              <p className="text-lg mt-2">{step}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center bg-gray-200 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} γTube AI Video Summarizer. All rights reserved.</p>
      </footer>
    </div>
  );
}
