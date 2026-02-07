import React, { useState, useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StableDiffusionInterface = () => {
  // State management
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [settings, setSettings] = useState({
    steps: 50,
    width: 512,
    height: 512,
    cfgScale: 7.5,
    seed: -1,
    sampler: 'Euler a',
    batchSize: 1
  });
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [downloadFormat, setDownloadFormat] = useState('png');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const promptInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('sdPromptHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('sdPromptHistory', JSON.stringify(history));
  }, [history]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Generate image
  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${prompt} ${negativePrompt ? `[NEG: ${negativePrompt}]` : ''}`,
          settings
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      
      // Add to generated images
      const newImage = {
        id: Date.now(),
        prompt,
        negativePrompt,
        timestamp: new Date().toISOString(),
        imageData: data.image,
        settings: { ...settings }
      };
      
      setGeneratedImages(prev => [newImage, ...prev]);
      setSelectedImage(newImage);
      
      // Add to history if not duplicate
      if (!history.some(item => item.prompt === prompt && item.negativePrompt === negativePrompt)) {
        setHistory(prev => [{ prompt, negativePrompt }, ...prev.slice(0, 49)]);
      }
      
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download image
  const downloadImage = (format = downloadFormat) => {
    if (!selectedImage) {
      toast.error('No image selected');
      return;
    }

    const base64Data = selectedImage.imageData.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    const fileName = `sd-${selectedImage.id}`;
    
    switch (format) {
      case 'png':
        saveAs(blob, `${fileName}.png`);
        break;
      case 'jpg':
        // Convert to JPG
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const jpgImg = new Image();
        
        jpgImg.onload = () => {
          canvas.width = jpgImg.width;
          canvas.height = jpgImg.height;
          ctx.drawImage(jpgImg, 0, 0);
          
          canvas.toBlob((blob) => {
            saveAs(blob, `${fileName}.jpg`);
          }, 'image/jpeg', 0.95);
        };
        
        jpgImg.src = selectedImage.imageData;
        break;
      case 'pdf':
        const pdf = new jsPDF({
          orientation: settings.width > settings.height ? 'landscape' : 'portrait',
          unit: 'mm'
        });
        
        const pdfImg = new Image();
        pdfImg.onload = () => {
          const width = pdf.internal.pageSize.getWidth();
          const height = (pdfImg.height / pdfImg.width) * width;
          
          pdf.addImage(selectedImage.imageData, 'PNG', 0, 0, width, height);
          pdf.save(`${fileName}.pdf`);
        };
        
        pdfImg.src = selectedImage.imageData;
        break;
      default:
        saveAs(blob, `${fileName}.png`);
    }
  };

  // Load prompt from history
  const loadPrompt = (historyItem) => {
    setPrompt(historyItem.prompt);
    setNegativePrompt(historyItem.negativePrompt || '');
    promptInputRef.current.focus();
  };

  // Copy image to clipboard
  const copyToClipboard = async () => {
    if (!selectedImage) {
      toast.error('No image selected');
      return;
    }

    try {
      const response = await fetch(selectedImage.imageData);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      toast.success('Image copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy image');
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Premium Diffusion
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar - Prompt and settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Image Generation</h2>
              
              {/* Prompt input */}
              <div className="mb-4">
                <label htmlFor="prompt" className="block text-sm font-medium mb-1">
                  Prompt
                </label>
                <textarea
                  ref={promptInputRef}
                  id="prompt"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Describe what you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              
              {/* Negative prompt */}
              <div className="mb-4">
                <label htmlFor="negativePrompt" className="block text-sm font-medium mb-1">
                  Negative Prompt (optional)
                </label>
                <textarea
                  id="negativePrompt"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="What you don't want in the image..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                />
              </div>
              
              {/* Basic settings */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Settings</h3>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="steps" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Steps: {settings.steps}
                    </label>
                    <input
                      id="steps"
                      type="range"
                      min="10"
                      max="150"
                      value={settings.steps}
                      onChange={(e) => setSettings({...settings, steps: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cfgScale" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      CFG Scale: {settings.cfgScale}
                    </label>
                    <input
                      id="cfgScale"
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={settings.cfgScale}
                      onChange={(e) => setSettings({...settings, cfgScale: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Advanced settings */}
                {showAdvanced && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="width" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Width: {settings.width}
                        </label>
                        <select
                          id="width"
                          value={settings.width}
                          onChange={(e) => setSettings({...settings, width: parseInt(e.target.value)})}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="256">256</option>
                          <option value="512">512</option>
                          <option value="768">768</option>
                          <option value="1024">1024</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="height" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Height: {settings.height}
                        </label>
                        <select
                          id="height"
                          value={settings.height}
                          onChange={(e) => setSettings({...settings, height: parseInt(e.target.value)})}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="256">256</option>
                          <option value="512">512</option>
                          <option value="768">768</option>
                          <option value="1024">1024</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="sampler" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Sampler
                      </label>
                      <select
                        id="sampler"
                        value={settings.sampler}
                        onChange={(e) => setSettings({...settings, sampler: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="Euler a">Euler a</option>
                        <option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
                        <option value="DDIM">DDIM</option>
                        <option value="LMS">LMS</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="seed" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Seed: {settings.seed === -1 ? 'Random' : settings.seed}
                      </label>
                      <div className="flex space-x-2">
                        <input
                          id="seed"
                          type="number"
                          min="-1"
                          value={settings.seed}
                          onChange={(e) => setSettings({...settings, seed: parseInt(e.target.value)})}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => setSettings({...settings, seed: -1})}
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
                        >
                          Random
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Generate button */}
              <button
                onClick={generateImage}
                disabled={isGenerating}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${isGenerating ? 'bg-purple-400 dark:bg-purple-700 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'} text-white`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate Image'
                )}
              </button>
            </div>
            
            {/* Prompt history */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Prompt History</h2>
              {history.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No history yet</p>
              ) : (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((item, index) => (
                    <li key={index} className="group">
                      <button
                        onClick={() => loadPrompt(item)}
                        className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-700"
                      >
                        <p className="font-medium truncate">{item.prompt}</p>
                        {item.negativePrompt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Negative: {item.negativePrompt}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Main content - Image display */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Generated Image</h2>
                {selectedImage && (
                  <div className="flex space-x-2">
                    <select
                      value={downloadFormat}
                      onChange={(e) => setDownloadFormat(e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    >
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <button
                      onClick={() => downloadImage()}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </button>
                  </div>
                )}
              </div>
              
              {selectedImage ? (
                <div className="flex flex-col items-center">
                  <img
                    src={selectedImage.imageData}
                    alt={selectedImage.prompt}
                    className="max-w-full h-auto rounded-lg shadow-md mb-4"
                  />
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <p className="font-medium mb-1">{selectedImage.prompt}</p>
                    {selectedImage.negativePrompt && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        <span className="font-medium">Negative:</span> {selectedImage.negativePrompt}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div>Steps: {selectedImage.settings.steps}</div>
                      <div>CFG: {selectedImage.settings.cfgScale}</div>
                      <div>Size: {selectedImage.settings.width}x{selectedImage.settings.height}</div>
                      <div>Sampler: {selectedImage.settings.sampler}</div>
                      <div>Seed: {selectedImage.settings.seed === -1 ? 'Random' : selectedImage.settings.seed}</div>
                      <div>{new Date(selectedImage.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No image generated yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Enter a prompt and click "Generate Image"</p>
                </div>
              )}
            </div>
            
            {/* Image gallery */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Gallery</h2>
              {generatedImages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No images in gallery</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {generatedImages.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(image)}
                      className={`relative group rounded-lg overflow-hidden border-2 ${selectedImage?.id === image.id ? 'border-purple-500' : 'border-transparent'}`}
                    >
                      <img
                        src={image.imageData}
                        alt={image.prompt}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for JPG conversion */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default StableDiffusionInterface;