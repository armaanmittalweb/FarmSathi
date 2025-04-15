import React, { useState } from 'react';
import { Sun, Cloud, MessageSquare, CreditCard, HelpCircle, Menu, X, ChevronDown, Mic } from 'lucide-react';
import farmSaathiImg from './assets/FarmSaathi.png';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState('english');

  // Color scheme based on the logo
  const colors = {
    orange: 'bg-orange-500',
    orangeHover: 'hover:bg-orange-600',
    orangeText: 'text-orange-500',
    green: 'bg-green-800',
    greenHover: 'hover:bg-green-900',
    greenText: 'text-green-800',
    lightBg: 'bg-orange-50'
  };

  const translations = {
    english: {
      nav: ['Home', 'Crop Advisory', 'Weather', 'Financial Help', 'Community'],
      hero: {
        title: 'Your Farming Assistant',
        subtitle: 'AI-powered support for better farming decisions',
        cta: 'Get Started',
        voice: 'Speak with Voice Assistant'
      },
      features: {
        title: 'How FarmSaathi Helps You',
        items: [
          {
            title: 'Crop Recommendations',
            desc: 'Get the best crop suggestions based on your local weather'
          },
          {
            title: 'Identify Plant Issues',
            desc: 'Upload photos to check for diseases and get solutions'
          },
          {
            title: 'Government Schemes',
            desc: 'Learn about loans, subsidies and support programs'
          },
          {
            title: 'Weather Updates',
            desc: 'Daily forecast and farming advice for your location'
          }
        ]
      },
      weatherSection: {
        title: 'Today\'s Weather Update',
        check: 'Check Weather'
      },
      supportSection: {
        title: 'Need Help?',
        desc: 'Talk to our support team in your language',
        cta: 'Get Support'
      }
    },
    hindi: {
      nav: ['होम', 'फसल सलाह', 'मौसम', 'वित्तीय सहायता', 'समुदाय'],
      hero: {
        title: 'आपका कृषि सहायक',
        subtitle: 'बेहतर खेती निर्णयों के लिए AI-संचालित समर्थन',
        cta: 'शुरू करें',
        voice: 'आवाज सहायक से बात करें'
      },
      features: {
        title: 'फार्मसाथी आपकी कैसे मदद करता है',
        items: [
          {
            title: 'फसल की सिफारिशें',
            desc: 'अपने स्थानीय मौसम के आधार पर सर्वोत्तम फसल सुझाव प्राप्त करें'
          },
          {
            title: 'पौधों की समस्याओं की पहचान',
            desc: 'रोगों की जांच के लिए फोटो अपलोड करें और समाधान प्राप्त करें'
          },
          {
            title: 'सरकारी योजनाएँ',
            desc: 'ऋण, सब्सिडी और सहायता कार्यक्रमों के बारे में जानें'
          },
          {
            title: 'मौसम अपडेट',
            desc: 'आपके स्थान के लिए दैनिक पूर्वानुमान और खेती की सलाह'
          }
        ]
      },
      weatherSection: {
        title: 'आज का मौसम अपडेट',
        check: 'मौसम देखें'
      },
      supportSection: {
        title: 'मदद चाहिए?',
        desc: 'अपनी भाषा में हमारी सहायता टीम से बात करें',
        cta: 'सहायता प्राप्त करें'
      }
    },
    punjabi: {
      nav: ['ਹੋਮ', 'ਫਸਲ ਸਲਾਹ', 'ਮੌਸਮ', 'ਵਿੱਤੀ ਸਹਾਇਤਾ', 'ਕਮਿਊਨਿਟੀ'],
      hero: {
        title: 'ਤੁਹਾਡਾ ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ',
        subtitle: 'ਬਿਹਤਰ ਖੇਤੀਬਾੜੀ ਫੈਸਲਿਆਂ ਲਈ AI-ਸੰਚਾਲਿਤ ਸਮਰਥਨ',
        cta: 'ਸ਼ੁਰੂ ਕਰੋ',
        voice: 'ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਨਾਲ ਗੱਲ ਕਰੋ'
      },
      features: {
        title: 'ਫਾਰਮਸਾਥੀ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰਦਾ ਹੈ',
        items: [
          {
            title: 'ਫਸਲ ਸਿਫਾਰਸ਼ਾਂ',
            desc: 'ਆਪਣੇ ਸਥਾਨਕ ਮੌਸਮ ਦੇ ਅਧਾਰ ਤੇ ਸਭ ਤੋਂ ਵਧੀਆ ਫਸਲ ਸੁਝਾਅ ਪ੍ਰਾਪਤ ਕਰੋ'
          },
          {
            title: 'ਪੌਦਿਆਂ ਦੀਆਂ ਸਮੱਸਿਆਵਾਂ ਦੀ ਪਛਾਣ',
            desc: 'ਬੀਮਾਰੀਆਂ ਦੀ ਜਾਂਚ ਲਈ ਫੋਟੋਆਂ ਅਪਲੋਡ ਕਰੋ ਅਤੇ ਹੱਲ ਪ੍ਰਾਪਤ ਕਰੋ'
          },
          {
            title: 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ',
            desc: 'ਕਰਜ਼ੇ, ਸਬਸਿਡੀ ਅਤੇ ਸਹਾਇਤਾ ਪ੍ਰੋਗਰਾਮਾਂ ਬਾਰੇ ਜਾਣੋ'
          },
          {
            title: 'ਮੌਸਮ ਅਪਡੇਟ',
            desc: 'ਤੁਹਾਡੇ ਸਥਾਨ ਲਈ ਰੋਜ਼ਾਨਾ ਪੂਰਵ ਅਨੁਮਾਨ ਅਤੇ ਖੇਤੀਬਾੜੀ ਸਲਾਹ'
          }
        ]
      },
      weatherSection: {
        title: 'ਅੱਜ ਦਾ ਮੌਸਮ ਅਪਡੇਟ',
        check: 'ਮੌਸਮ ਵੇਖੋ'
      },
      supportSection: {
        title: 'ਮਦਦ ਚਾਹੀਦੀ ਹੈ?',
        desc: 'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਸਾਡੀ ਸਹਾਇਤਾ ਟੀਮ ਨਾਲ ਗੱਲ ਕਰੋ',
        cta: 'ਸਹਾਇਤਾ ਪ੍ਰਾਪਤ ਕਰੋ'
      }
    }
  };

  const content = translations[language];

  return (
    <div className="min-h-screen font-sans">
      {/* Navigation */}
      <nav className={`${colors.green} shadow-lg text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center">
                  <img src={farmSaathiImg} alt="FarmSaathi Logo" className="w-11 h-11 rounded-full object-cover" />
                </div>
                <span className="ml-2 text-xl font-bold">FarmSaathi</span>
              </div>
              
              {/* Desktop Nav Links */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {content.nav.map((item, index) => (
                  <a 
                    key={index} 
                    href="#" 
                    className={`${index === 0 ? 'border-white' : 'border-transparent'} px-3 py-2 text-sm font-medium border-b-2 hover:border-orange-300`}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
            
            {/* Language Selector */}
            <div className="hidden md:flex items-center">
              <div className="relative inline-block text-left mr-4">
                <div>
                  <button 
                    type="button" 
                    className="inline-flex justify-center w-full rounded-md border border-white px-4 py-2 bg-green-700 text-sm font-medium shadow-sm hover:bg-green-600 focus:outline-none"
                    onClick={() => {}}
                  >
                    {language.charAt(0).toUpperCase() + language.slice(1)}
                    <ChevronDown className="ml-2 h-5 w-5" aria-hidden="true" />
                  </button>
                  <div className="absolute right-0 z-10 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu">
                      <button 
                        className={`${language === 'english' ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                        onClick={() => setLanguage('english')}
                      >
                        English
                      </button>
                      <button 
                        className={`${language === 'hindi' ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                        onClick={() => setLanguage('hindi')}
                      >
                        हिंदी
                      </button>
                      <button 
                        className={`${language === 'punjabi' ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                        onClick={() => setLanguage('punjabi')}
                      >
                        ਪੰਜਾਬੀ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <button className={`${colors.orange} ${colors.orangeHover} text-white px-4 py-2 rounded-md font-medium text-sm`}>
                Login / Register
              </button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-green-700 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {content.nav.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className={`${index === 0 ? 'bg-green-700' : ''} block px-3 py-2 text-base font-medium hover:bg-green-700`}
                >
                  {item}
                </a>
              ))}
              <div className="flex flex-col p-3 space-y-2">
                <div className="flex justify-between border-t border-green-700 pt-3">
                  <span className="text-sm text-gray-200">Select Language:</span>
                  <div className="flex space-x-2">
                    <button 
                      className={`px-2 py-1 text-xs rounded ${language === 'english' ? 'bg-white text-green-800' : 'bg-green-700'}`}
                      onClick={() => setLanguage('english')}
                    >
                      EN
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs rounded ${language === 'hindi' ? 'bg-white text-green-800' : 'bg-green-700'}`}
                      onClick={() => setLanguage('hindi')}
                    >
                      HI
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs rounded ${language === 'punjabi' ? 'bg-white text-green-800' : 'bg-green-700'}`}
                      onClick={() => setLanguage('punjabi')}
                    >
                      PA
                    </button>
                  </div>
                </div>
                <button className={`${colors.orange} ${colors.orangeHover} text-white px-4 py-2 rounded-md text-sm`}>
                  Login / Register
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Hero Section */}
      <div className={`${colors.lightBg} py-12 md:py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center">
            <div className="lg:w-1/2">
              <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${colors.greenText} mb-4`}>
                {content.hero.title}
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-6">
                {content.hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className={`${colors.green} ${colors.greenHover} text-white px-6 py-3 rounded-lg font-medium text-lg`}>
                  {content.hero.cta}
                </button>
                <button className="flex items-center justify-center px-6 py-3 border border-green-800 rounded-lg text-green-800 font-medium text-lg hover:bg-green-50">
                  <Mic className="mr-2 h-5 w-5" />
                  {content.hero.voice}
                </button>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 lg:w-1/2 flex justify-center">
              <img src={farmSaathiImg} alt="Farmer using FarmSaathi" className="rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-2xl md:text-3xl font-bold text-center ${colors.greenText} mb-12`}>
            {content.features.title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.features.items.map((feature, index) => {
              const icons = [<Sun className="h-10 w-10" />, <MessageSquare className="h-10 w-10" />, <CreditCard className="h-10 w-10" />, <Cloud className="h-10 w-10" />];
              
              return (
                <div key={index} className="rounded-lg p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className={`${colors.orangeText} mb-4`}>
                    {icons[index]}
                  </div>
                  <h3 className={`text-xl font-semibold ${colors.greenText} mb-2`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Weather Section */}
      <div className={`py-12 ${colors.green} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                {content.weatherSection.title}
              </h2>
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-white p-3 rounded-full">
                  <Sun className="h-8 w-8 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">28°C</p>
                  <p className="text-gray-200">Mostly Sunny</p>
                </div>
              </div>
              <button className={`${colors.orange} ${colors.orangeHover} px-6 py-3 rounded-lg font-medium`}>
                {content.weatherSection.check}
              </button>
            </div>
            <div className="mt-8 lg:mt-0 lg:w-1/2 bg-white bg-opacity-10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Weekly Forecast</h3>
              <div className="grid grid-cols-4 gap-4">
                {['Mon', 'Tue', 'Wed', 'Thu'].map((day, i) => (
                  <div key={i} className="text-center p-2">
                    <p className="font-medium">{day}</p>
                    <Sun className="h-6 w-6 mx-auto my-2" />
                    <p className="text-sm">{27 + i}°C</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Support Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className={`text-2xl md:text-3xl font-bold ${colors.greenText} mb-4`}>
              {content.supportSection.title}
            </h2>
            <p className="text-lg text-gray-600">
              {content.supportSection.desc}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl shadow-md p-6 max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
              <div className={`${colors.orange} p-3 rounded-full`}>
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="ml-4 text-xl font-medium text-gray-900">24/7 Support</h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <button className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                <span className="w-6 h-6 mr-2 rounded-full bg-blue-500 flex items-center justify-center text-white">?</span>
                Chat Support
              </button>
              <button className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                <Mic className="h-5 w-5 mr-2 text-green-600" />
                Voice Support
              </button>
            </div>
            
            <button className={`w-full ${colors.green} ${colors.greenHover} text-white py-3 px-4 rounded-lg font-medium`}>
              {content.supportSection.cta}
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className={`${colors.green} text-white py-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                  <img src="/api/placeholder/32/32" alt="FarmSaathi Logo" className="h-8 w-8" />
                </div>
                <span className="ml-2 text-xl font-bold">FarmSaathi</span>
              </div>
              <p className="mt-2 text-sm text-gray-300 max-w-md">
                AI-powered agricultural assistant designed to help farmers with personalized recommendations, support, and information.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider">Features</h3>
                <div className="mt-4 space-y-2">
                  <a href="#" className="text-sm text-gray-300 hover:text-white block">Crop Advisory</a>
                  <a href="#" className="text-sm text-gray-300 hover:text-white block">Weather Forecast</a>
                  <a href="#" className="text-sm text-gray-300 hover:text-white block">Financial Support</a>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider">Support</h3>
                <div className="mt-4 space-y-2">
                  <a href="#" className="text-sm text-gray-300 hover:text-white block">Help Center</a>
                  <a href="#" className="text-sm text-gray-300 hover:text-white block">Contact Us</a>
                  <a href="#" className="text-sm text-gray-300 hover:text-white block">FAQs</a>
                </div>
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <h3 className="text-sm font-semibold uppercase tracking-wider">Download App</h3>
                <div className="mt-4 flex space-x-3">
                  <a href="#" className="bg-white text-green-800 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100">
                    Android
                  </a>
                  <a href="#" className="bg-white text-green-800 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100">
                    iOS
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-green-700 pt-8 flex flex-col md:flex-row md:justify-between">
            <p className="text-sm text-gray-300">&copy; 2025 FarmSaathi. All rights reserved.</p>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-6">
                <a href="#" className="text-gray-300 hover:text-white">
                  Terms
                </a>
                <a href="#" className="text-gray-300 hover:text-white">
                  Privacy
                </a>
                <a href="#" className="text-gray-300 hover:text-white">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}