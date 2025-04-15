import React, { useState, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  AlertTriangle, 
  Send, 
  X, 
  Mic, 
  Clipboard, 
  Image as ImageIcon,
  ChevronDown,
  CheckCircle,
  Info
} from 'lucide-react';

const ReportingPortal = () => {
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioNotes, setAudioNotes] = useState(null);
  const [detectedCattle, setDetectedCattle] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // Simulated AI detection and analysis
  const processImage = (file) => {
    // In a real app, this would send the image to your AI service
    setTimeout(() => {
      setDetectedCattle({
        detected: true,
        count: 1,
        confidence: 98.7,
        breed: "Holstein-Friesian",
        condition: "Appears healthy",
        trafficRisk: "High"
      });
      
      setAiAnalysis({
        urgency: "High",
        risk: 8.7,
        recommendation: "Immediate response required",
        nearbyReports: 2,
        estimatedResponseTime: "15-20 minutes"
      });
    }, 1500);
  };
  
  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      // Create URLs for preview
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      
      setImages([...images, ...newImages]);
      
      // Process the first image with AI
      if (images.length === 0) {
        processImage(files[0]);
      }
    }
  };
  
  // Handle image removal
  const removeImage = (index) => {
    const newImages = [...images];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newImages[index].preview);
    
    newImages.splice(index, 1);
    setImages(newImages);
    
    if (newImages.length === 0) {
      setDetectedCattle(null);
      setAiAnalysis(null);
    }
  };
  
  // Detect current location
  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            address: "AI Identifying Location...",
          });
          
          // Simulate reverse geocoding
          setTimeout(() => {
            setLocation(prev => ({
              ...prev,
              address: "NH-8 Highway, Near Manesar, Gurugram",
              nearbyLandmarks: ["HSIIDC Industrial Area", "Bamdoli Village"],
              district: "Gurugram",
              state: "Haryana"
            }));
          }, 1000);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enter it manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };
  
  // Toggle voice recording
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      
      // Simulate recorded audio
      setTimeout(() => {
        setAudioNotes("Recorded voice note (00:42)");
      }, 500);
    } else {
      // Start recording
      setIsRecording(true);
    }
  };
  
  // Submit the report
  const submitReport = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setReportSubmitted(true);
    }, 2000);
  };
  
  // Create a new report
  const createNewReport = () => {
    setImages([]);
    setLocation(null);
    setAudioNotes(null);
    setDetectedCattle(null);
    setAiAnalysis(null);
    setReportSubmitted(false);
    setStep(1);
  };
  
  if (reportSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-green-600 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mr-2">
                <span className="text-green-600 font-bold text-xl">C</span>
              </div>
              <span className="text-2xl font-bold text-white">Cowish</span>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-12 flex-grow flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Report Submitted Successfully!</h2>
          <p className="text-xl text-gray-600 mb-6 max-w-lg">
            Your report has been sent to the nearest rescue team. They will be dispatched shortly.
          </p>
          
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Report ID:</span>
                <span className="font-medium">COW-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reported at:</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{location?.address || "Location not provided"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Urgency:</span>
                <span className="font-medium text-red-600">{aiAnalysis?.urgency || "Medium"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Response Time:</span>
                <span className="font-medium">{aiAnalysis?.estimatedResponseTime || "20-30 minutes"}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={createNewReport}
              className="px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition"
            >
              Report Another Case
            </button>
            <button
              className="px-6 py-3 border border-green-600 text-green-600 rounded-full font-medium hover:bg-green-50 transition"
            >
              Track This Report
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-green-600 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mr-2">
              <span className="text-green-600 font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold text-white">Cowish</span>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Report Stray Cattle</h1>
              
              {/* Progress Steps */}
              <div className="flex mb-8">
                <div className={`flex-1 ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <span className="font-medium">1</span>
                    </div>
                    <span className="font-medium">Photo & Location</span>
                  </div>
                  <div className="ml-4 h-1 bg-green-500"></div>
                </div>
                
                <div className={`flex-1 ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <span className="font-medium">2</span>
                    </div>
                    <span className="font-medium">AI Analysis</span>
                  </div>
                  <div className="ml-4 h-1 bg-green-500"></div>
                </div>
                
                <div className={`flex-1 ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <span className="font-medium">3</span>
                    </div>
                    <span className="font-medium">Submit</span>
                  </div>
                </div>
              </div>
              
              {/* Step 1: Photo & Location */}
              {step === 1 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Upload Photos</h2>
                    <p className="text-gray-600 mb-4">
                      Take clear photos of the stray cattle. Our AI will analyze them to assess the situation.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden h-40">
                          <img
                            src={image.preview}
                            alt={`Stray cattle ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-black bg-opacity-70 text-white rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          
                          {index === 0 && detectedCattle && (
                            <div className="absolute bottom-0 left-0 right-0 bg-green-600 bg-opacity-90 px-3 py-1 flex justify-between items-center">
                              <span className="text-white text-sm font-medium">Cow Detected</span>
                              <span className="text-white text-xs">{detectedCattle.confidence}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {images.length < 4 && (
                        <button
                          onClick={() => fileInputRef.current.click()}
                          className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 transition"
                        >
                          <Camera className="h-8 w-8 mb-2" />
                          <span>Add Photo</span>
                        </button>
                      )}
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Location</h2>
                    <p className="text-gray-600 mb-4">
                      Share your location so we can dispatch the nearest rescue team.
                    </p>
                    
                    {!location ? (
                      <button
                        onClick={detectLocation}
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition"
                      >
                        <MapPin className="h-5 w-5 mr-2 text-green-600" />
                        Detect My Current Location
                      </button>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 mr-2 text-green-600 mt-1" />
                          <div>
                            <h3 className="font-medium text-gray-800">{location.address}</h3>
                            {location.nearbyLandmarks && (
                              <p className="text-gray-600 text-sm">
                                Near: {location.nearbyLandmarks.join(", ")}
                              </p>
                            )}
                            {location.district && (
                              <p className="text-gray-600 text-sm">
                                {location.district}, {location.state}
                              </p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">
                              GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Add Voice Notes (Optional)</h2>
                    <p className="text-gray-600 mb-4">
                      Provide additional details through voice recording.
                    </p>
                    
                    {!audioNotes ? (
                      <button
                        onClick={toggleRecording}
                        className={`w-full py-3 px-4 border rounded-lg flex items-center justify-center transition ${
                          isRecording 
                            ? 'border-red-500 text-red-500 bg-red-50' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Mic className={`h-5 w-5 mr-2 ${isRecording ? 'text-red-500' : 'text-green-600'}`} />
                        {isRecording ? 'Recording... Tap to Stop' : 'Record Voice Note'}
                      </button>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <Mic className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-gray-800">{audioNotes}</span>
                        </div>
                        <button
                          onClick={() => setAudioNotes(null)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!detectedCattle || !location}
                      className={`px-6 py-3 rounded-full font-medium ${
                        detectedCattle && location
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      } transition`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 2: AI Analysis */}
              {step === 2 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Analysis Results</h2>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        <p className="text-blue-700 text-sm">
                          Our AI has analyzed your photos and location to assess the situation. Please review the findings below.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                          <h3 className="font-medium text-gray-800">Cattle Detection</h3>
                        </div>
                        <div className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Number of cattle:</span>
                              <span className="font-medium">{detectedCattle?.count || 1}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Breed:</span>
                              <span className="font-medium">{detectedCattle?.breed || "Unknown"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Condition:</span>
                              <span className="font-medium">{detectedCattle?.condition || "Unable to determine"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Traffic risk:</span>
                              <span className="font-medium text-red-600">{detectedCattle?.trafficRisk || "Medium"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Detection confidence:</span>
                              <span className="font-medium">{detectedCattle?.confidence || 95}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                          <h3 className="font-medium text-gray-800">Risk Assessment</h3>
                        </div>
                        <div className="p-4">
                          <div className="mb-4">
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600 text-sm">Urgency Score</span>
                              <span className="text-gray-600 text-sm font-medium">{aiAnalysis?.risk || 8.7}/10</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-red-600 h-2.5 rounded-full" 
                                style={{ width: `${(aiAnalysis?.risk || 8.7) * 10}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Urgency level:</span>
                              <span className="font-medium text-red-600">{aiAnalysis?.urgency || "High"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Nearby reports:</span>
                              <span className="font-medium">{aiAnalysis?.nearbyReports || 2} in last 24h</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Est. response time:</span>
                              <span className="font-medium">{aiAnalysis?.estimatedResponseTime || "15-20 minutes"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Recommendation:</span>
                              <span className="font-medium">{aiAnalysis?.recommendation || "Immediate response required"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Additional Details (Optional)</h2>
                    <p className="text-gray-600 mb-4">
                      Add any other information that might help the rescue team.
                    </p>
                    
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 h-32 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 transition"
                      placeholder="E.g., The cow appears to be heading towards the highway. There's a safe area nearby where it could be guided."
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3 border border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Submit */}
              {step === 3 && (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <p className="text-yellow-700 text-sm">
                        Please review your report before submitting. The nearest rescue team will be alerted immediately.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-medium text-gray-800">Report Summary</h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {images.map((image, index) => (
                          <div key={index} className="rounded-lg overflow-hidden h-32">
                            <img
                              src={image.preview}
                              alt={`Stray cattle ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                          <p className="text-gray-800">{location?.address}</p>
                          {location?.nearbyLandmarks && (
                            <p className="text-gray-600 text-sm">
                              Near: {location.nearbyLandmarks.join(", ")}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">AI Assessment</h4>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {aiAnalysis?.urgency || "High"} Urgency
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {detectedCattle?.count || 1} Cattle
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {detectedCattle?.trafficRisk || "High"} Traffic Risk
                            </span>
                          </div>
                        </div>
                        
                        {audioNotes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Voice Notes</h4>
                            <div className="flex items-center text-gray-800">
                              <Mic className="h-4 w-4 mr-2 text-gray-500" />
                              {audioNotes}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Estimated Response</h4>
                          <p className="text-gray-800">{aiAnalysis?.estimatedResponseTime || "15-20 minutes"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start mb-4">
                      <input 
                        type="checkbox" 
                        id="terms" 
                        className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 mt-0.5 mr-2" 
                      />
                      <label htmlFor="terms" className="text-gray-700 text-sm">
                        I confirm that this is a genuine report, and I understand that filing false reports may result in account restrictions.
                      </label>
                    </div>
                    
                    <div className="flex items-start">
                      <input 
                        type="checkbox" 
                        id="updates" 
                        className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 mt-0.5 mr-2" 
                        defaultChecked 
                      />
                      <label htmlFor="updates" className="text-gray-700 text-sm">
                        I would like to receive updates about this rescue operation.
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-3 border border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={submitReport}
                      disabled={isSubmitting}
                      className={`px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition flex items-center ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Why Report Stray Cattle?</h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Prevent Accidents</h3>
                  <p className="text-gray-600">
                    Stray cattle on roads can cause serious accidents, endangering both humans and animals. Quick reporting helps prevent these incidents.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Animal Welfare</h3>
                  <p className="text-gray-600">
                    Stray cattle are often malnourished, injured, or at risk of disease. Reporting helps them receive proper care and shelter.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Community Impact</h3>
                  <p className="text-gray-600">
                    Your quick actions make communities safer and healthier. Each report contributes to a more effective stray cattle management system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-4">
              <div className="inline-flex items-center">
                <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-bold text-gray-800">Cowish</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Protecting cattle and communities through technology
            </p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="text-gray-600 hover:text-green-600 transition">About Us</a>
              <a href="#" className="text-gray-600 hover:text-green-600 transition">Emergency Contacts</a>
              <a href="#" className="text-gray-600 hover:text-green-600 transition">FAQs</a>
              <a href="#" className="text-gray-600 hover:text-green-600 transition">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ReportingPortal;