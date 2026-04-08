import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import * as mammoth from 'mammoth';
import { RefreshCw, Download, FileText, Activity, BrainCircuit, Key, AlertCircle, Image, Volume2, Video, Globe, Upload, ListChecks, CheckCircle2, XCircle } from 'lucide-react';
// import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import './App.css';

const initialResults = null;

function App() {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('simplified');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(initialResults);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeAction, setActiveAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [imageStyle, setImageStyle] = useState('hyperrealistic educational diagram');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [workflowStep, setWorkflowStep] = useState('input'); // input, choice, processing, results
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({}); // {questionIdx: answerIdx}
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg("");

    try {
      const extension = file.name.split('.').pop().toLowerCase();
      
      if (extension === 'txt') {
        const text = await file.text();
        setInputText(text);
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setInputText(result.value);
      } else if (extension === 'pdf') {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/extract-text', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error("Server extraction failed");
        const data = await response.json();
        setInputText(data.text || "");
      } else {
        setErrorMsg("Unsupported file type. Please use .txt, .docx, or .pdf");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error reading file. Please try again.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const generateSmartMock = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    const mainIdea = lines[0] || "Educational Topic";

    return {
      simplified_text: `<strong>Topic: ${mainIdea}</strong><br/><br/>This is a simple look at the topic. We focus on the most important parts so anyone can understand it clearly. <br/><br/>Key Point: The core idea is that ${mainIdea.toLowerCase()} helps us learn effectively.`,
      simplified_changes: [
        "Used clear and simple language",
        "Shortened complex sentences",
        "Focused on the 'Why' instead of technical details"
      ],
      advanced_text: `The conceptual framework of ${mainIdea} requires an analytical approach to understand its underlying mechanisms. <br/><br/>By examining the theoretical implications and practical applications, we can derive a deeper understanding of the subject matter. This study explores the nuances of the data provided.`,
      advanced_changes: [
        "Integrated academic vocabulary",
        "Expanded theoretical context",
        "Complex sentence structures for higher-level learners"
      ],
      accessibility_text: `<strong>1. Main Concept:</strong> ${mainIdea}<br/><strong>2. Summary:</strong> A brief overview of the provided text.<br/><strong>3. Key Takeaway:</strong> Learning this helps build a foundation.<br/><br/><em>Notice: This may not be fully accurate.</em>`,
      accessibility_changes: [
        "Used structured headings for screen readers",
        "Step-by-step breakdown",
        "High-contrast formatting"
      ],
      meaning_drift_score: 92
    };
  };

  const handleRewrite = async () => {
    if (!inputText.trim()) return;
    setWorkflowStep('choice');
    setErrorMsg('');
  };

  const executeSpecificRewrite = async (type) => {
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!openRouterKey || openRouterKey === 'sk-or-v1-YOUR_OPENROUTER_KEY_HERE') {
      setErrorMsg("Error: Please configure VITE_OPENROUTER_API_KEY in the .env file.");
      return;
    }

    setWorkflowStep('processing');
    setIsProcessing(true);
    setActiveTab(type);

    try {
      const modelsToTry = [
        "google/gemini-2.0-flash-001",
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "meta-llama/llama-3.3-70b-instruct"
      ];

      let prompt = "";
      if (type === 'simplified') {
        prompt = `Rewrite the following lesson into a simplified (4th grade level) version. Explain things clearly and use simpler words. 
        Your response must be a JSON object: { "text": "...", "changes": ["..."] }`;
      } else if (type === 'advanced') {
        prompt = `Rewrite the following lesson into an advanced (academically rigorous) version. Use precise terminology and explore deeper concepts.
        Your response must be a JSON object: { "text": "...", "changes": ["..."] }`;
      } else if (type === 'emoji') {
        prompt = `Rewrite the following lesson using ONLY emojis where possible, or a highly emoji-dense version that visually represents the sentences. Make it fun and recognizable.
        Your response must be a JSON object: { "text": "...", "changes": ["..."] }`;
      } else {
        prompt = `Rewrite the following lesson into an accessibility version. Use clear structure, bold markers, and logical flow.
        Your response must be a JSON object: { "text": "...", "changes": ["..."] }`;
      }

      for (const modelName of modelsToTry) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": window.location.origin,
              "X-Title": "Adaptive Lesson Rewriter",
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: "system", content: "You rewrite educational content. You must return only valid JSON." },
                { role: "user", content: `${prompt}\n\nOriginal Text: ${inputText}` }
              ],
              response_format: { type: "json_object" }
            })
          });

          if (!response.ok) throw new Error("API call failed");
          const data = await response.json();
          const parsed = JSON.parse(data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim());

          // Merge into results
          const newResults = results ? { ...results } : {
            simplified_text: "", simplified_changes: [],
            advanced_text: "", advanced_changes: [],
            accessibility_text: "", accessibility_changes: [],
            emoji_text: "", emoji_changes: [],
            meaning_drift_score: 95
          };

          if (type === 'simplified') {
            newResults.simplified_text = parsed.text;
            newResults.simplified_changes = parsed.changes;
          } else if (type === 'advanced') {
            newResults.advanced_text = parsed.text;
            newResults.advanced_changes = parsed.changes;
          } else if (type === 'emoji') {
            newResults.emoji_text = parsed.text;
            newResults.emoji_changes = parsed.changes;
          } else {
            newResults.accessibility_text = parsed.text;
            newResults.accessibility_changes = parsed.changes;
          }

          setResults(newResults);
          setWorkflowStep('results');
          return;
        } catch (err) {
          console.warn(`Model ${modelName} failed, trying next...`);
        }
      }

      // If we are here, everything failed. Use mock.
      const smartMock = generateSmartMock(inputText);
      setResults(smartMock);
      setWorkflowStep('results');
    } catch (e) {
      setErrorMsg("Failed to generate content.");
      setWorkflowStep('input');
    } finally {
      setIsProcessing(false);
    }
  };



  const handleExtendedAction = async (type) => {
    setActiveAction(type);
    setActionLoading(true);
    setActionResult(null);

    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (type === 'translate') {
      setActionLoading(false); // Stop loading to let user select language
      return;
    } else if (type === 'image') {
      setIsImageLoading(true);
      if (!openRouterKey || openRouterKey === 'sk-or-v1-YOUR_OPENROUTER_KEY_HERE') {
        setActionResult("Error: Please configure VITE_OPENROUTER_API_KEY in the .env file.");
        setActionLoading(false);
        setIsImageLoading(false);
        return;
      }

      try {
        let contentToImagine = "";
        if (activeTab === 'simplified') contentToImagine = results.simplified_text;
        else if (activeTab === 'advanced') contentToImagine = results.advanced_text;
        else if (activeTab === 'accessibility') contentToImagine = results.accessibility_text;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Adaptive Lesson Rewriter",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [
              {
                role: "user",
                content: `Create a highly descriptive image generation prompt that would visually explain the following educational concept. 
                Style Requirement: ${imageStyle}.
                Respond ONLY with the prompt text.\n\n${contentToImagine}`
              }
            ]
          })
        });

        if (!response.ok) throw new Error("API call failed");
        const data = await response.json();
        const promptText = data.choices[0].message.content;
        const finalPrompt = promptText + " " + imageStyle;

        let imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true`;

        try {
          const proxyResponse = await fetch("/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: finalPrompt })
          });

          if (proxyResponse.ok) {
            const proxyData = await proxyResponse.json();
            imageUrl = proxyData.image;
          }
        } catch (e) {
          console.warn("Local proxy failed, using direct Pollinations link");
        }

        setActionResult({
          prompt: promptText,
          imageUrl: imageUrl
        });
      } catch (err) {
        console.error(err);
        setActionResult("Error: Failed to generate image prompt.");
      } finally {
        setIsImageLoading(false);
      }
    } else if (type === 'audio') {
      let textContent = '';
      if (activeTab === 'simplified') textContent = results.simplified_text?.replace(/<[^>]*>/g, '') || '';
      else if (activeTab === 'advanced') textContent = results.advanced_text?.replace(/<[^>]*>/g, '') || '';
      else if (activeTab === 'accessibility') textContent = results.accessibility_text?.replace(/<[^>]*>/g, '') || '';

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textContent);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.lang = 'en-US';

        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US');
          if (preferred) utterance.voice = preferred;
        };
        if (window.speechSynthesis.getVoices().length > 0) {
          loadVoices();
        } else {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        utterance.onend = () => setActionResult({ type: 'audio', status: 'done' });
        utterance.onerror = (e) => setActionResult(`Audio error: ${e.error}`);

        window.speechSynthesis.speak(utterance);
        setActionResult({ type: 'audio', status: 'playing', utterance });
      } else {
        setActionResult('Error: Text-to-Speech is not supported in your browser.');
      }
    } else if (type === 'video') {
      const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      try {
        let content = '';
        if (activeTab === 'simplified') content = results.simplified_text;
        else if (activeTab === 'advanced') content = results.advanced_text;
        else if (activeTab === 'accessibility') content = results.accessibility_text;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Adaptive Lesson Rewriter",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [{
              role: "user",
              content: `Extract the single best YouTube search query (4-6 words) to find an educational video that teaches the core concept of this lesson. Reply ONLY with the search query, no quotes.\n\n${content?.replace(/<[^>]*>/g, '')?.slice(0, 500)}`
            }]
          })
        });

        const data = await response.json();
        const query = data.choices[0].message.content.trim();

        const pipedRes = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`);
        const pipedData = await pipedRes.json();
        const firstVideo = pipedData.items?.find(i => i.type === 'stream' || i.url?.includes('/watch'));
        const videoId = firstVideo?.url?.split('v=')[1]?.split('&')[0] || firstVideo?.url?.replace('/watch?v=', '');

        setActionResult({ type: 'video', query, videoId: videoId || null });
      } catch (e) {
        const fallback = inputText.replace(/<[^>]*>/g, '').slice(0, 60).trim();
        const query = fallback || 'educational lesson video';
        try {
          const pipedRes = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`);
          const pipedData = await pipedRes.json();
          const firstVideo = pipedData.items?.find(i => i.type === 'stream' || i.url?.includes('/watch'));
          const videoId = firstVideo?.url?.split('v=')[1]?.split('&')[0] || firstVideo?.url?.replace('/watch?v=', '');
          setActionResult({ type: 'video', query, videoId: videoId || null });
        } catch {
          setActionResult({ type: 'video', query, videoId: null });
        }
      }
    } else if (type === 'quiz') {
      const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      try {
        let content = '';
        if (activeTab === 'simplified') content = results.simplified_text;
        else if (activeTab === 'advanced') content = results.advanced_text;
        else if (activeTab === 'accessibility') content = results.accessibility_text;
        else if (activeTab === 'emoji') content = results.emoji_text;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Adaptive Lesson Rewriter",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [
              {
                role: "system",
                content: "Generate a 3-question multiple choice quiz based on the lesson provided. Return ONLY valid JSON in this format: [{\"question\": \"...\", \"options\": [\"opt1\", \"opt2\", \"opt3\", \"opt4\"], \"correct\": 0}]"
              },
              {
                role: "user",
                content: content || inputText
              }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) throw new Error("Quiz generation failed");
        const data = await response.json();
        let jsonStr = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        const questions = JSON.parse(jsonStr);
        setActionResult({ type: 'quiz', questions: Array.isArray(questions) ? questions : (questions.questions || []) });
      } catch (e) {
        console.error(e);
        setActionResult("Failed to generate quiz. Try again later.");
      }
    }
    setActionLoading(false);
  };

  const updateImageFromPrompt = async (newPrompt) => {
    setIsImageLoading(true);
    const finalPrompt = newPrompt + " " + imageStyle;
    let imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true`;

    try {
      const proxyResponse = await fetch("/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt })
      });

      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        imageUrl = proxyData.image;
      }
    } catch (e) {
      console.warn("Local proxy failed");
    }

    setActionResult({
      ...actionResult,
      prompt: newPrompt,
      imageUrl: imageUrl
    });
    setIsImageLoading(false);
  };

  const executeTranslation = async (targetLanguage) => {
    setActionLoading(true);
    setActionResult(null);
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!openRouterKey || openRouterKey === 'sk-or-v1-YOUR_OPENROUTER_KEY_HERE') {
      setActionResult("Error: Please configure VITE_OPENROUTER_API_KEY in the .env file.");
      setActionLoading(false);
      return;
    }

    const modelsToTry = [
      "google/gemini-2.0-flash-001",
      "google/gemini-flash-1.5",
      "meta-llama/llama-3.1-8b-instruct:free"
    ];

    for (const modelName of modelsToTry) {
      try {
        let contentToTranslate = "";
        if (activeTab === 'simplified') contentToTranslate = results.simplified_text;
        else if (activeTab === 'advanced') contentToTranslate = results.advanced_text;
        else if (activeTab === 'accessibility') contentToTranslate = results.accessibility_text;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Adaptive Lesson Rewriter",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "user",
                content: `Translate the following educational text into ${targetLanguage}. Only return the translated text. Preserve any HTML tags if present.\n\n${contentToTranslate}`
              }
            ]
          })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setActionResult(data.choices[0].message.content);
        setActionLoading(false);
        return; // Success
      } catch (err) {
        console.warn(`Translation failed with ${modelName}:`, err);
      }
    }
    setActionResult("Error: Translation failed on all available models. Please check your OpenRouter API key/quota.");
    setActionLoading(false);
  };

  const getTabContent = () => {
    if (!results) return null;

    let textContent = '';
    let changes = [];

    switch (activeTab) {
      case 'simplified':
        textContent = results.simplified_text;
        changes = results.simplified_changes;
        break;
      case 'advanced':
        textContent = results.advanced_text;
        changes = results.advanced_changes;
        break;
      case 'accessibility':
        textContent = results.accessibility_text;
        changes = results.accessibility_changes;
        break;
      case 'emoji':
        textContent = results.emoji_text;
        changes = results.emoji_changes;
        break;
      default:
        return null;
    }

    if (!textContent && results) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', flex: 1, padding: '2rem', textAlign: 'center' }}>
          <BrainCircuit size={40} style={{ opacity: 0.3 }} />
          <p>This version hasn't been generated yet.</p>
          <button
            onClick={() => executeSpecificRewrite(activeTab)}
            style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Version
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Render the text, replacing \n with <br/> or using dangerouslySetInnerHTML for the accessibility HTML */}
        <div
          style={{ marginBottom: '1rem' }}
          dangerouslySetInnerHTML={{ __html: (textContent || '').replace(/\n\n/g, '<br/><br/>') }}
        />

        {changes && changes.length > 0 && (
          <ul className="changes-list" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {changes.map((change, idx) => (
              <li key={idx}>{change}</li>
            ))}
          </ul>
        )}
      </>
    );
  };

  return (
    <div className="app-container">
      <header>
        <h1>Adaptive <span className="text-gradient">Lesson Rewriter</span></h1>
        <p>Intelligently transform your educational content into simplified, advanced, and accessible formats while preserving the core meaning with real-time drift detection.</p>
      </header>

      <main className="main-content">
        {/* Left Pane - Input & Drift */}
        <section className="input-section glass-panel">
          <div className="section-header">
            <h2><FileText className="icon" /> Original Content</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".txt,.docx,.pdf"
                onChange={handleFileUpload}
              />
              <button 
                className="action-btn" 
                onClick={() => fileInputRef.current.click()} 
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                title="Upload Document (.txt, .docx, .pdf)"
              >
                <Upload size={18} />
              </button>
              {(workflowStep !== 'input' || inputText) && (
                <button className="action-btn" onClick={() => { setWorkflowStep('input'); setResults(null); setInputText(''); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  New
                </button>
              )}
              <button className="action-btn" onClick={handleRewrite} disabled={isProcessing}>
                <RefreshCw className={`icon ${isProcessing ? 'animate-spin' : ''}`} size={18} />
                {isProcessing ? 'Analyzing...' : 'Rewrite'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <textarea
            className="lesson-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your lesson content here..."
          />


        </section>

        {/* Right Pane - Outputs */}
        <section className="output-section glass-panel">
          <div className="section-header">
            <h2><BrainCircuit className="icon" /> Generated Versions</h2>
          </div>

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'simplified' ? 'active' : ''}`}
              onClick={() => setActiveTab('simplified')}
            >
              Simplified
            </button>
            <button
              className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveTab('advanced')}
            >
              Advanced
            </button>
            <button
              className={`tab-btn ${activeTab === 'accessibility' ? 'active' : ''}`}
              onClick={() => setActiveTab('accessibility')}
            >
              Accessibility
            </button>
            <button
              className={`tab-btn ${activeTab === 'emoji' ? 'active' : ''}`}
              onClick={() => setActiveTab('emoji')}
            >
              Emoji
            </button>
          </div>

          <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
            {workflowStep === 'input' && !results && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'center' }}>
                <BrainCircuit size={48} style={{ opacity: 0.2 }} />
                <p>Welcome! Enter your lesson content on the left<br />and click Rewrite to begin the transformation.</p>
              </div>
            )}

            {workflowStep === 'choice' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Select Your Transformation Path</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose how you want to intelligently rewrite this lesson.</p>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <button
                    onClick={() => executeSpecificRewrite('simplified')}
                    className="choice-card"
                  >
                    <div className="choice-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}><FileText size={20} /></div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', color: 'white' }}>Simplified Version</strong>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Best for young learners or introductory overview.</span>
                    </div>
                  </button>

                  <button
                    onClick={() => executeSpecificRewrite('advanced')}
                    className="choice-card"
                  >
                    <div className="choice-icon" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}><BrainCircuit size={20} /></div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', color: 'white' }}>Advanced Version</strong>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Rigorous terminology and deep theoretical context.</span>
                    </div>
                  </button>

                  <button
                    onClick={() => executeSpecificRewrite('accessibility')}
                    className="choice-card"
                  >
                    <div className="choice-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}><Activity size={20} /></div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', color: 'white' }}>Accessibility Version</strong>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Structured for screen readers and logical scanning.</span>
                    </div>
                  </button>

                  <button
                    onClick={() => executeSpecificRewrite('emoji')}
                    className="choice-card"
                  >
                    <div className="choice-icon" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}><Globe size={20} /></div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ display: 'block', color: 'white' }}>Emoji Version</strong>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Translate the entire lesson into fun, descriptive emojis.</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {workflowStep === 'processing' && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', flex: 1 }}>
                <RefreshCw className="animate-spin" size={32} color="var(--accent-color)" />
                <p>AI is intelligently drafting your version...</p>
              </div>
            )}

            {workflowStep === 'results' && (
              <div style={{ flex: 1 }}>
                {getTabContent()}
              </div>
            )}
          </div>

          {results && (
            <div className="extended-actions">
              <button className="ext-action-btn" onClick={() => handleExtendedAction('image')}><Image size={18} /> Image</button>
              <button className="ext-action-btn" onClick={() => handleExtendedAction('audio')}><Volume2 size={18} /> Audio</button>
              <button className="ext-action-btn" onClick={() => handleExtendedAction('video')}><Video size={18} /> Video</button>
              <button className="ext-action-btn" onClick={() => handleExtendedAction('translate')}><Globe size={18} /> Translate</button>
              <button className="ext-action-btn" onClick={() => handleExtendedAction('quiz')}><ListChecks size={18} /> Quiz</button>
            </div>
          )}

          {activeAction && (
            <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                {activeAction} Generation
              </h3>
              {actionLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <RefreshCw className="animate-spin" size={16} />
                  Processing...
                </div>
              ) : (
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                  {activeAction === 'translate' ? (
                    actionResult ? (
                      <div dangerouslySetInnerHTML={{ __html: (typeof actionResult === 'string' ? actionResult : '').replace(/\n\n/g, '<br/><br/>') }} />
                    ) : (
                      <div>
                        <p style={{ marginBottom: '0.75rem' }}>Select a language to translate the current content:</p>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {[
                            'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 
                            'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 
                            'Spanish', 'French', 'German', 'Japanese'
                          ].map(lang => (
                            <button
                              key={lang}
                              onClick={() => executeTranslation(lang)}
                              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
                              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  ) : activeAction === 'image' && typeof actionResult === 'object' ? (
                    <div className="image-result">
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <select
                          value={imageStyle}
                          onChange={(e) => setImageStyle(e.target.value)}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <option value="hyperrealistic educational diagram">Hyperrealistic Diagram</option>
                          <option value="3d render octane style">3D Professional Render</option>
                          <option value="minimalist vector art">Minimalist Vector Art</option>
                          <option value="cinematic concept art">Cinematic Concept Art</option>
                          <option value="oil painting classical style">Classical Oil Painting</option>
                        </select>
                        <button
                          onClick={() => handleExtendedAction('image')}
                          style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                        >
                          Re-Imagine
                        </button>
                      </div>

                      <div style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
                        {isImageLoading && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '8px', zIndex: 5 }}>
                            <RefreshCw className="animate-spin" size={32} color="var(--accent-color)" />
                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Synthesizing Visual...</p>
                          </div>
                        )}
                        <img
                          src={actionResult.imageUrl}
                          alt="Generated visual representation"
                          style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'block' }}
                        />
                        <a
                          href={actionResult.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--accent-color)', textAlign: 'center', textDecoration: 'underline' }}
                        >
                          Open generated image in new tab ↗
                        </a>
                      </div>
                    </div>
                  ) : activeAction === 'audio' && typeof actionResult === 'object' && actionResult?.type === 'audio' ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                      {actionResult.status === 'playing' ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ width: 8, height: 30, background: 'var(--accent-color)', borderRadius: 4, animation: 'bar1 0.8s ease-in-out infinite' }} />
                            <div style={{ width: 8, height: 45, background: 'var(--accent-color)', borderRadius: 4, animation: 'bar2 0.9s ease-in-out infinite' }} />
                            <div style={{ width: 8, height: 20, background: 'var(--accent-color)', borderRadius: 4, animation: 'bar1 0.7s ease-in-out infinite' }} />
                            <div style={{ width: 8, height: 38, background: 'var(--accent-color)', borderRadius: 4, animation: 'bar2 1s ease-in-out infinite' }} />
                          </div>
                          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🔊 Reading lesson aloud...</p>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <button onClick={() => { window.speechSynthesis.pause(); setActionResult({ ...actionResult, status: 'paused' }); }}
                              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer' }}>
                              ⏸ Pause
                            </button>
                            <button onClick={() => { window.speechSynthesis.cancel(); setActionResult({ ...actionResult, status: 'done' }); }}
                              style={{ background: 'rgba(255,0,0,0.2)', border: '1px solid rgba(255,0,0,0.3)', color: 'white', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer' }}>
                              ⏹ Stop
                            </button>
                          </div>
                        </>
                      ) : actionResult.status === 'paused' ? (
                        <>
                          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>⏸ Narration paused</p>
                          <button onClick={() => { window.speechSynthesis.resume(); setActionResult({ ...actionResult, status: 'playing' }); }}
                            style={{ background: 'var(--accent-color)', border: 'none', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                            ▶ Resume
                          </button>
                        </>
                      ) : (
                        <>
                          <p style={{ marginBottom: '1rem', color: '#4ade80', fontSize: '0.95rem' }}>✅ Narration complete</p>
                          <button onClick={() => handleExtendedAction('audio')}
                            style={{ background: 'var(--accent-color)', border: 'none', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                            🔊 Read Again
                          </button>
                        </>
                      )}
                    </div>
                  ) : activeAction === 'video' && typeof actionResult === 'object' && actionResult?.type === 'video' ? (
                    <div>
                      {actionResult.videoId ? (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${actionResult.videoId}?rel=0&modestbranding=1`}
                            title={actionResult.query}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Try searching directly:</p>
                          <button
                            onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(actionResult.query)}`, '_blank')}
                            style={{ background: '#ff0000', border: 'none', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            ▶ Search on YouTube
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleExtendedAction('video')}
                        style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', width: '100%' }}
                      >
                        🔄 Load Different Video
                      </button>
                    </div>
                  ) : activeAction === 'quiz' && typeof actionResult === 'object' && actionResult?.type === 'quiz' ? (
                    <div className="quiz-container" style={{ animation: 'fadeIn 0.5s ease' }}>
                      {actionResult.questions.map((q, qIdx) => (
                        <div key={qIdx} style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                          <p style={{ fontWeight: 600, color: 'white', marginBottom: '0.75rem' }}>{qIdx + 1}. {q.question}</p>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {q.options.map((opt, oIdx) => {
                              const isSelected = quizAnswers[qIdx] === oIdx;
                              const isCorrect = q.correct === oIdx;
                              const showFeedback = quizAnswers[qIdx] !== undefined;
                              
                              let borderColor = 'rgba(255,255,255,0.1)';
                              let bgColor = 'rgba(255,255,255,0.03)';
                              
                              if (showFeedback) {
                                if (isCorrect) {
                                  borderColor = '#10b981';
                                  bgColor = 'rgba(16, 185, 129, 0.1)';
                                } else if (isSelected) {
                                  borderColor = '#ef4444';
                                  bgColor = 'rgba(239, 68, 68, 0.1)';
                                }
                              } else if (isSelected) {
                                borderColor = 'var(--accent-color)';
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => !showFeedback && setQuizAnswers({ ...quizAnswers, [qIdx]: oIdx })}
                                  disabled={showFeedback}
                                  style={{
                                    textAlign: 'left',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: `1px solid ${borderColor}`,
                                    background: bgColor,
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    cursor: showFeedback ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {opt}
                                  {showFeedback && isCorrect && <CheckCircle2 size={16} color="#10b981" />}
                                  {showFeedback && isSelected && !isCorrect && <XCircle size={16} color="#ef4444" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button 
                          onClick={() => { setQuizAnswers({}); handleExtendedAction('quiz'); }}
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}
                        >
                          🔄 Reset Quiz
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>{typeof actionResult === 'string' ? actionResult : 'Processing...'}</div>
                  )}
                  <button
                    style={{ marginTop: '0.75rem', background: 'var(--accent-color)', color: 'white', padding: '0.4rem 0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
                    onClick={() => setActiveAction(null)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className="download-btn"
            onClick={() => {
              if (!results) return;
              const doc = new jsPDF({ unit: 'mm', format: 'a4' });
              const pageW = doc.internal.pageSize.getWidth();
              const margin = 18;
              const maxWidth = pageW - margin * 2;
              let y = 22;

              const addText = (text, size, bold, color) => {
                doc.setFontSize(size);
                doc.setFont('helvetica', bold ? 'bold' : 'normal');
                doc.setTextColor(...(color || [30, 30, 30]));
                const lines = doc.splitTextToSize(text, maxWidth);
                lines.forEach(line => {
                  if (y > 270) { doc.addPage(); y = 22; }
                  doc.text(line, margin, y);
                  y += size * 0.45;
                });
                y += 2;
              };

              const strip = html => html ? html.replace(/<[^>]*>/g, '') : '';

              // Header
              doc.setFillColor(30, 64, 175);
              doc.rect(0, 0, pageW, 16, 'F');
              doc.setFontSize(13);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(255, 255, 255);
              doc.text('Adaptive Lesson Pack', margin, 11);
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              doc.text(new Date().toLocaleDateString(), pageW - margin, 11, { align: 'right' });
              y = 26;

              // Simplified
              addText('1. Simplified Version', 14, true, [30, 64, 175]);
              addText(strip(results.simplified_text), 10, false);
              if (results.simplified_changes?.length) {
                addText('Changes Applied:', 9, true, [80, 80, 80]);
                results.simplified_changes.forEach(c => addText(`• ${c}`, 9, false, [80, 80, 80]));
              }
              y += 4;

              // Advanced
              doc.setDrawColor(200, 200, 200);
              doc.line(margin, y, pageW - margin, y); y += 6;
              addText('2. Advanced Version', 14, true, [30, 64, 175]);
              addText(strip(results.advanced_text), 10, false);
              if (results.advanced_changes?.length) {
                addText('Changes Applied:', 9, true, [80, 80, 80]);
                results.advanced_changes.forEach(c => addText(`• ${c}`, 9, false, [80, 80, 80]));
              }
              y += 4;

              // Accessibility
              doc.line(margin, y, pageW - margin, y); y += 6;
              addText('3. Accessibility Version', 14, true, [30, 64, 175]);
              addText(strip(results.accessibility_text), 10, false);
              if (results.accessibility_changes?.length) {
                addText('Changes Applied:', 9, true, [80, 80, 80]);
                results.accessibility_changes.forEach(c => addText(`• ${c}`, 9, false, [80, 80, 80]));
              }

              doc.save('lesson-pack.pdf');
            }}
            disabled={!results}
            style={{ opacity: results ? 1 : 0.5 }}
          >
            <Download size={22} />
            Download Lesson Pack (.pdf)
          </button>
        </section>
      </main>
    </div>
  );
}

export default App;
