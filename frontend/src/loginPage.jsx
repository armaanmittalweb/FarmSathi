import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Mail, Phone, Eye, EyeOff, ArrowLeft, Globe } from 'lucide-react';
import farmSaathiImg from './assets/FarmSaathi.png';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState('english');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef(null);

  // Color scheme based on the logo (same as landing page)
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
      login: {
        title: 'Welcome Back',
        subtitle: 'Login to access your FarmSaathi account',
        emailPhone: 'Email / Phone Number',
        password: 'Password',
        forgotPassword: 'Forgot password?',
        loginButton: 'Login',
        noAccount: 'Don\'t have an account?',
        signupLink: 'Sign up',
        or: 'OR',
        googleLogin: 'Continue with Google',
        phoneLogin: 'Login with OTP'
      },
      signup: {
        title: 'Create Account',
        subtitle: 'Join FarmSaathi for smart farming assistance',
        fullName: 'Full Name',
        phone: 'Phone Number',
        email: 'Email Address',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        terms: 'I agree to the Terms and Conditions',
        signupButton: 'Sign Up',
        haveAccount: 'Already have an account?',
        loginLink: 'Login'
      },
      backToHome: 'Back to Home',
      showPassword: 'Show password',
      hidePassword: 'Hide password'
    },
    hindi: {
      login: {
        title: 'वापस स्वागत है',
        subtitle: 'अपने फार्मसाथी खाते तक पहुंचने के लिए लॉगिन करें',
        emailPhone: 'ईमेल / फोन नंबर',
        password: 'पासवर्ड',
        forgotPassword: 'पासवर्ड भूल गए?',
        loginButton: 'लॉगिन',
        noAccount: 'खाता नहीं है?',
        signupLink: 'साइन अप करें',
        or: 'या',
        googleLogin: 'Google के साथ जारी रखें',
        phoneLogin: 'OTP के साथ लॉगिन करें'
      },
      signup: {
        title: 'खाता बनाएं',
        subtitle: 'स्मार्ट खेती सहायता के लिए फार्मसाथी से जुड़ें',
        fullName: 'पूरा नाम',
        phone: 'फोन नंबर',
        email: 'ईमेल पता',
        password: 'पासवर्ड',
        confirmPassword: 'पासवर्ड की पुष्टि करें',
        terms: 'मैं नियमों और शर्तों से सहमत हूं',
        signupButton: 'साइन अप',
        haveAccount: 'पहले से खाता है?',
        loginLink: 'लॉगिन'
      },
      backToHome: 'होम पेज पर वापस जाएं',
      showPassword: 'पासवर्ड दिखाएं',
      hidePassword: 'पासवर्ड छिपाएं'
    },
    punjabi: {
      login: {
        title: 'ਵਾਪਸ ਸਵਾਗਤ ਹੈ',
        subtitle: 'ਆਪਣੇ ਫਾਰਮਸਾਥੀ ਖਾਤੇ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਲੌਗਇਨ ਕਰੋ',
        emailPhone: 'ਈਮੇਲ / ਫੋਨ ਨੰਬਰ',
        password: 'ਪਾਸਵਰਡ',
        forgotPassword: 'ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?',
        loginButton: 'ਲੌਗਇਨ',
        noAccount: 'ਖਾਤਾ ਨਹੀਂ ਹੈ?',
        signupLink: 'ਸਾਈਨ ਅੱਪ ਕਰੋ',
        or: 'ਜਾਂ',
        googleLogin: 'Google ਨਾਲ ਜਾਰੀ ਰੱਖੋ',
        phoneLogin: 'OTP ਨਾਲ ਲੌਗਇਨ ਕਰੋ'
      },
      signup: {
        title: 'ਖਾਤਾ ਬਣਾਓ',
        subtitle: 'ਸਮਾਰਟ ਖੇਤੀ ਸਹਾਇਤਾ ਲਈ ਫਾਰਮਸਾਥੀ ਨਾਲ ਜੁੜੋ',
        fullName: 'ਪੂਰਾ ਨਾਮ',
        phone: 'ਫੋਨ ਨੰਬਰ',
        email: 'ਈਮੇਲ ਪਤਾ',
        password: 'ਪਾਸਵਰਡ',
        confirmPassword: 'ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
        terms: 'ਮੈਂ ਨਿਯਮਾਂ ਅਤੇ ਸ਼ਰਤਾਂ ਨਾਲ ਸਹਿਮਤ ਹਾਂ',
        signupButton: 'ਸਾਈਨ ਅੱਪ',
        haveAccount: 'ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ?',
        loginLink: 'ਲੌਗਇਨ'
      },
      backToHome: 'ਹੋਮ ਪੇਜ ਤੇ ਵਾਪਸ ਜਾਓ',
      showPassword: 'ਪਾਸਵਰਡ ਦਿਖਾਓ',
      hidePassword: 'ਪਾਸਵਰਡ ਛੁਪਾਓ'
    }
  };

  const content = translations[language];

  // Function to toggle the language dropdown
  const toggleLangDropdown = () => {
    setLangDropdownOpen(!langDropdownOpen);
  };

  // Function to handle language selection
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setLangDropdownOpen(false);
  };

  // Click outside handler for language dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [langDropdownRef]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Logo and Language Selector */}
      <header className={`${colors.green} shadow-md py-4 px-6`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
              <img src={farmSaathiImg} alt="FarmSaathi Logo" className="w-9 h-9 rounded-full object-cover" />
            </div>
            <span className="ml-2 text-xl font-bold text-white">FarmSaathi</span>
          </div>
          
          {/* Language Selector */}
          <div className="relative inline-block text-left" ref={langDropdownRef}>
            <button 
              type="button" 
              className="inline-flex items-center justify-center rounded-md border border-white px-3 py-1.5 bg-green-700 text-sm font-medium text-white shadow-sm hover:bg-green-600 focus:outline-none"
              onClick={toggleLangDropdown}
            >
              <Globe className="h-4 w-4 mr-1" />
              {language.charAt(0).toUpperCase() + language.slice(1)}
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 z-10 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div className="py-1" role="menu">
                  <button 
                    className={`${language === 'english' ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                    onClick={() => handleLanguageChange('english')}
                  >
                    English
                  </button>
                  <button 
                    className={`${language === 'hindi' ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                    onClick={() => handleLanguageChange('hindi')}
                  >
                    हिंदी
                  </button>
                  <button 
                    className={`${language === 'punjabi' ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                    onClick={() => handleLanguageChange('punjabi')}
                  >
                    ਪੰਜਾਬੀ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Back to Home Link */}
      <div className="max-w-md mx-auto w-full px-4 mt-6">
        <a href="#" className="inline-flex items-center text-green-800 hover:text-green-700">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {content.backToHome}
        </a>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Toggle Tabs */}
            <div className="flex border-b">
              <button 
                className={`flex-1 py-4 font-medium text-center ${isLogin ? `${colors.greenText} border-b-2 border-green-800` : 'text-gray-500'}`}
                onClick={() => setIsLogin(true)}
              >
                {content.login.loginButton}
              </button>
              <button 
                className={`flex-1 py-4 font-medium text-center ${!isLogin ? `${colors.greenText} border-b-2 border-green-800` : 'text-gray-500'}`}
                onClick={() => setIsLogin(false)}
              >
                {content.signup.signupButton}
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6">
              {isLogin ? (
                <>
                  {/* Login Form */}
                  <div className="text-center mb-6">
                    <h2 className={`text-2xl font-bold ${colors.greenText}`}>{content.login.title}</h2>
                    <p className="text-gray-600 mt-1">{content.login.subtitle}</p>
                  </div>

                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{content.login.emailPhone}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                          type="text" 
                          className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                          placeholder={content.login.emailPhone}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">{content.login.password}</label>
                        <a href="#" className={`text-sm ${colors.orangeText} hover:underline`}>{content.login.forgotPassword}</a>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                          placeholder={content.login.password}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          aria-label={showPassword ? content.hidePassword : content.showPassword}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className={`w-full py-2 px-4 ${colors.green} ${colors.greenHover} text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    >
                      {content.login.loginButton}
                    </button>
                  </form>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">{content.login.or}</span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                      <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                          </g>
                        </svg>
                        {content.login.googleLogin}
                      </button>
                      <button className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium ${colors.orangeText} hover:bg-gray-50`}>
                        <Phone className="h-5 w-5 mr-2" />
                        {content.login.phoneLogin}
                      </button>
                    </div>
                  </div>

                  <p className="mt-6 text-center text-sm text-gray-600">
                    {content.login.noAccount}{' '}
                    <button 
                      onClick={() => setIsLogin(false)} 
                      className={`font-medium ${colors.orangeText} hover:underline`}
                    >
                      {content.login.signupLink}
                    </button>
                  </p>
                </>
              ) : (
                <>
                  {/* Signup Form */}
                  <div className="text-center mb-6">
                    <h2 className={`text-2xl font-bold ${colors.greenText}`}>{content.signup.title}</h2>
                    <p className="text-gray-600 mt-1">{content.signup.subtitle}</p>
                  </div>

                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{content.signup.fullName}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                          type="text" 
                          className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                          placeholder={content.signup.fullName}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{content.signup.phone}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                          type="tel" 
                          className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                          placeholder={content.signup.phone}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{content.signup.email}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                          type="email" 
                          className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                          placeholder={content.signup.email}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{content.signup.password}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                          placeholder={content.signup.password}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          aria-label={showPassword ? content.hidePassword : content.showPassword}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{content.signup.confirmPassword}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                          placeholder={content.signup.confirmPassword}
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input 
                        id="terms" 
                        name="terms" 
                        type="checkbox" 
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" 
                      />
                      <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                        {content.signup.terms}
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      className={`w-full py-2 px-4 ${colors.orange} ${colors.orangeHover} text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
                    >
                      {content.signup.signupButton}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm text-gray-600">
                    {content.signup.haveAccount}{' '}
                    <button 
                      onClick={() => setIsLogin(true)} 
                      className={`font-medium ${colors.greenText} hover:underline`}
                    >
                      {content.signup.loginLink}
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>&copy; 2025 FarmSaathi. All rights reserved.</p>
      </footer>
    </div>
  );
}