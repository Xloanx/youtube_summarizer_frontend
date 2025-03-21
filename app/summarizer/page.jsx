"use client";



import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader, Mic, PlayCircle, Clipboard, Home, ChevronDown, Share, Download, LogOut, Volume2 } from "lucide-react";
import jsPDF from "jspdf";
import { BiSolidDownArrow, BiSolidUpArrow } from "react-icons/bi";
import { SignOutButton, useAuth } from "@clerk/nextjs";

export default function SummarizationUI() {
  const { userId } = useAuth();

  const [videoTitle, setVideoTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState(null);
  const [previousSummaries, setPreviousSummaries] = useState([]);
  const [showAccordion, setShowAccordion] = useState(false);
  const [showAdditionalContent, setShowAdditionalContent] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSynth(window.speechSynthesis);
    }
  }, []);
  
  useEffect(() => {
    const loadVoices = () => setSynth(window.speechSynthesis);
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  
  useEffect(() => {
    const storedSummaries = JSON.parse(localStorage.getItem("summaries") || "[]");
    setPreviousSummaries(storedSummaries);
  }, []);


  const toggleAdditionalContent = (index) => {  // EDITED LINE
    setExpandedIndex(expandedIndex === index ? null : index); // EDITED LINE
  };


  const handleTextToSpeech = (text) => {
    if (!synth || !text) {
      alert("No text to read");
      return;
    }
  
    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }
  
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
  
    // Get the list of available voices
    const voices = speechSynthesis.getVoices();
  
    // Try to select a high-quality female voice
    const preferredVoices = voices.filter(voice => 
      voice.name.includes("Female") || voice.name.includes("Google UK English Female")
    );
  
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0]; // Set preferred voice
    }
  
    utterance.pitch = 1.2;  // Slightly higher pitch for a pleasant tone
    utterance.rate = 0.95;   // Slightly slower for better clarity
    utterance.volume = 1.0;  // Full volume
  
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    
    synth.speak(utterance);
  };
  



  const handleSummarize = async () => {
    if (!videoTitle) return;
    setLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 200);

    try {
        const response = await fetch("https://gamma-youtube-summarizer-734911192367.us-west1.run.app/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: videoTitle,
            tts: false
           }),
        });
    
        if (!response.ok) throw new Error("Failed to fetch summary");
        
        const data = await response.json(); 
        console.log(data)
        const newSummary = {
          title: videoTitle,
          text: data.summary || "No summary available",
          sentiment: data.sentiment || "Neutral",
          keyMentions: data.key_mentions && Array.isArray(data.key_mentions)
          ? data.key_mentions
          : (data.title.includes(" - ") ? data.title.split(" - ")[1].split(", ") : []),
          link: data.video_link || "#",
        };
        
    
        setSummary(newSummary);
    
        // Store in local storage
        const updatedSummaries = [newSummary, ...previousSummaries];
        setPreviousSummaries(updatedSummaries);
        localStorage.setItem("summaries", JSON.stringify(updatedSummaries));
    
        setProgress(100);
        setTimeout(() => setProgress(0), 500);
      } catch (error) {
        console.error("Error summarizing:", error);
        alert("Failed to summarize the video.");
      } finally {
        clearInterval(interval);
        setLoading(false);
      }

  };

  const handleSpeechToText = () => {
    setIsListening(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
  
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  
    recognition.start();
  
    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setVideoTitle(spokenText);  // Auto-fill the input with recognized speech
      setIsListening(false);
    };
  
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      alert("Error recognizing speech. Please try again.");
      setIsListening(false);
    };
    
    recognition.onend = () => {
        setIsListening(false);      
      }
  };
  
  const copyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary.text);
      alert("Summary copied to clipboard!");
    }
  };

  const downloadPDF = () => {
    if (summary) {
      const doc = new jsPDF();
      doc.text(`Video Title: ${summary.title}`, 10, 10);
      doc.text(`Summary: ${summary.text}`, 10, 20);
      doc.text(`Sentiment: ${summary.sentiment}`, 10, 30);
      doc.text(`Key Mentions: ${summary.keyMentions.join(", ")}`, 10, 40);
      doc.save(`${summary.title}.pdf`);
    }
  };

  const handleShare = async () => {
    if (!summary) {
      alert("No summary to share.");
      return;
    }
  
    const shareData = {
      title: summary.title,
      text: summary.text,
      url: summary.link !== "#" ? summary.link : window.location.href,
    };
  
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        alert("Summary shared successfully!");
      } catch (error) {
        console.error("Error sharing:", error);
        alert("Failed to share summary.");
      }
    } else {
      navigator.clipboard.writeText(`${summary.title}\n\n${summary.text}\n\n${summary.link}`);
      alert("Summary copied to clipboard (sharing not supported).");
    }
  };
  

  if (!userId) {
    return <p>Unauthorized</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center py-20 px-5">
      {/* Back to Home Button */}
      <div className="w-full max-w-2xl mb-4">
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          <Home className="mr-2" /> 
        </Button>


        <SignOutButton>
          <Button variant="outline" 
                  // onClick={() => (window.location.href = "/")}
                  >
              <LogOut className="mr-2" /> 
            </Button>
        </SignOutButton>
      </div>


      {/* Input Section */}
      <motion.div
        className="w-full max-w-2xl text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-4">Summarize a YouTube Video</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Enter a YouTube video title to get an AI-generated summary.
        </p>
        <div className="flex items-center gap-3 mb-4">
          <Input
            className="w-full p-3 rounded-lg shadow-md"
            placeholder="Enter video title or free-text query..."
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSummarize()}
          />
          <Button onClick={handleSummarize} disabled={!videoTitle || loading}>
            {loading ? <Loader className="animate-spin" /> : "Summarize"}
          </Button>
        </div>
        <Button variant="outline" onClick={handleSpeechToText} disabled={isListening}>
            <Mic className="mr-2" /> {isListening ? "Listening..." : "Speak Instead"}
        </Button>

      </motion.div>

      {/* Progress Bar */}
      {loading && (
        <div className="w-full max-w-2xl mt-4 bg-gray-200 dark:bg-gray-800 rounded-full h-4">
          <motion.div
            className="bg-blue-500 h-4 rounded-full"
            style={{ width: `${progress}%` }}
          ></motion.div>
        </div>
      )}

      {/* Output Section */}
      {summary && (
        <motion.div
          className="mt-10 p-6 bg-white dark:bg-gray-700 rounded-lg shadow-lg max-w-2xl text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-semibold mb-3">{summary.title}</h2>
          <Button className="mt-4" variant="outline" onClick={() => handleTextToSpeech(summary.text)}>
            <Volume2 className="mr-2" /> {isPlaying ? 'Stop' : 'Listen to Summary'}
            </Button>

          <p className="text-gray-600 dark:text-gray-300">{summary.text}</p>
          <p className="mt-2 text-green-500 font-semibold">
            Sentiment: {summary.sentiment}
          </p>
          <p className="mt-2 text-purple-500">
          Key Mentions: {summary.keyMentions.length > 0 ? summary.keyMentions.join(", ") : "None"}
          </p>
          <a
            href={summary.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-blue-500 hover:underline"
          >
            Watch on YouTube
          </a>
          <div className="flex justify-center gap-4 mt-4">
            <Button variant="outline" onClick={copyToClipboard}>
              <Clipboard className="mr-2" /> Copy Summary
            </Button>
            <Button variant="outline" onClick={downloadPDF}>
              <Download className="mr-2" /> Download PDF
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share className="mr-2" /> Share
            </Button>
          </div>
        </motion.div>
      )}

      {/* Accordion for Previously Summarized Videos */}
      {previousSummaries.length > 0 && (
        <motion.div
          className="mt-10 w-full max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            className="w-full flex justify-between items-center bg-gray-200 dark:bg-gray-800 p-4 rounded-lg"
            onClick={() => setShowAccordion(!showAccordion)}
          >
            <span className="text-lg font-semibold">Previously Summarized Videos</span>
            <ChevronDown className={`transform transition-transform ${showAccordion ? "rotate-180" : ""}`} />
          </button>
          {showAccordion && (
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mt-2 shadow">
              {previousSummaries.map((item, index) => (
  <div key={index} className="border-b py-2">
    <button
      className="w-full flex justify-between items-center p-2"
      onClick={() => toggleAdditionalContent(index)}  
    >
      <span>{item.title}</span>
      {expandedIndex === index ? (  
        <BiSolidUpArrow className="text-gray-500" />
      ) : (
        <BiSolidDownArrow className="text-gray-500" />
      )}
    </button>

    {expandedIndex === index && (  
      <div className="p-2 text-gray-600 dark:text-gray-300">
            <Button className="mt-4" 
                variant="outline" 
                onClick={() => handleTextToSpeech(item.text)}
                  >
          <Volume2 className="mr-2" /> {isPlaying ? 'Stop' : 'Listen to Summary'}
        </Button>
        <p>{item.text}</p>

        <p className="text-green-500 font-semibold">Sentiment: {item.sentiment}</p>
        <p className="text-purple-500">
          Key Mentions: {item.keyMentions.length > 0 ? item.keyMentions.join(", ") : "None"}
        </p>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Watch on YouTube
        </a>
      </div>
    )}
  </div>
))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
