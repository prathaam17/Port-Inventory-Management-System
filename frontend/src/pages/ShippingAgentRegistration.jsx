import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { NotificationContext } from '../context/NotificationContext';
import {
  Building2,
  UserCheck,
  MapPin,
  Anchor,
  Briefcase,
  KeyRound,
  UploadCloud,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  AlertTriangle,
  FileText,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Menu
} from 'lucide-react';

const ShippingAgentRegistration = () => {
  const { triggerToast } = useContext(NotificationContext);
  const navigate = useNavigate();

  // Active section & visited tracking for stepper
  const [activeSection, setActiveSection] = useState(1);
  const [visitedSections, setVisitedSections] = useState({ 1: true, 2: false, 3: false, 4: false, 5: false });

  // Navigation helper
  const navigateToSection = (secNum) => {
    setActiveSection(secNum);
    setVisitedSections(prev => ({ ...prev, [secNum]: true }));
    setSectionsOpen(prev => ({
      ...prev,
      [secNum]: true
    }));

    setTimeout(() => {
      const el = document.getElementById(`section-${secNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Form sections open state
  const [sectionsOpen, setSectionsOpen] = useState({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false
  });

  // Toggle section visibility
  const toggleSection = (sectionIndex) => {
    setSectionsOpen(prev => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex]
    }));
  };

  // State: Form Data (Redundant fields removed)
  const [formData, setFormData] = useState({
    companyName: '',
    companyRegNo: '',
    companyType: 'Private Ltd',
    panNumber: '',
    gstin: '',
    licenseNumber: '',
    licenseExpiry: '',
    representativeName: '',
    representativeDesignation: '',
    representativeMobile: '',
    representativeEmail: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pinCode: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    isCertified: false
  });

  // State: Streamlined Upload Files
  const [files, setFiles] = useState({
    docCompanyReg: null,
    docPan: null,
    docGst: null,
    docLicense: null,
    docAuthLetter: null
  });

  // State: UI management
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  // Load draft cache on mount
  useEffect(() => {
    const draft = localStorage.getItem('nmpa_agent_reg_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsed }));
        triggerToast('Draft Loaded', 'Your previously saved registration draft has been restored.', 'info');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Form input change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear validation error on type
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // File drop/selection handler with progress simulation
  const handleFileChange = (fieldname, file) => {
    if (!file) return;

    // Filter file types with extension fallback
    const isAllowedExt = file.name && file.name.match(/\.(pdf|jpg|jpeg|png|webp|xls|xlsx|doc|docx)$/i);
    const isAllowedMime = file.type && (
      file.type.includes('pdf') ||
      file.type.includes('image') ||
      file.type.includes('excel') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('word') ||
      file.type.includes('document')
    );

    if (!isAllowedExt && !isAllowedMime) {
      triggerToast('Unsupported Format', 'Please upload PDF, Image, Word, or Excel documents.', 'error');
      return;
    }

    // Filter file size (Max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      triggerToast('File Too Large', 'Maximum file upload size is 10MB.', 'error');
      return;
    }

    // Set file state
    setFiles(prev => ({ ...prev, [fieldname]: file }));
    if (errors[fieldname]) {
      setErrors(prev => ({ ...prev, [fieldname]: null }));
    }

    // Simulate upload progress
    setUploadProgress(prev => ({ ...prev, [fieldname]: 10 }));
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[fieldname] || 10;
        if (current >= 100) {
          clearInterval(interval);
          return { ...prev, [fieldname]: 100 };
        }
        return { ...prev, [fieldname]: current + 30 };
      });
    }, 150);
  };

  // Delete/Clear file handler
  const handleRemoveFile = (fieldname) => {
    setFiles(prev => ({ ...prev, [fieldname]: null }));
    setUploadProgress(prev => ({ ...prev, [fieldname]: 0 }));
  };

  // Save Draft to LocalStorage
  const handleSaveDraft = () => {
    // Exclude password fields from cache
    const { password, confirmPassword, ...cacheSafeData } = formData;
    localStorage.setItem('nmpa_agent_reg_draft', JSON.stringify(cacheSafeData));
    triggerToast('Draft Saved', 'Your registration draft is saved locally.', 'success');
  };

  // Reset form inputs
  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear the entire registration form?')) {
      setFormData({
        companyName: '',
        companyRegNo: '',
        companyType: 'Private Ltd',
        panNumber: '',
        gstin: '',
        licenseNumber: '',
        licenseExpiry: '',
        representativeName: '',
        representativeDesignation: '',
        representativeMobile: '',
        representativeEmail: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pinCode: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        isCertified: false
      });
      setFiles({
        docCompanyReg: null,
        docPan: null,
        docGst: null,
        docLicense: null,
        docAuthLetter: null
      });
      setUploadProgress({});
      setErrors({});
      localStorage.removeItem('nmpa_agent_reg_draft');
      triggerToast('Form Cleared', 'Registration form and draft cache reset successfully.', 'info');
    }
  };

  // Validates a specific form section
  const validateSection = (sec) => {
    const secErrors = {};

    if (sec === 1) {
      if (!formData.companyName.trim()) secErrors.companyName = 'Company name is required';
      if (!formData.panNumber.trim()) secErrors.panNumber = 'PAN number is required';
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
        secErrors.panNumber = 'Invalid Indian PAN Format (e.g. ABCDE1234F)';
      }
      if (!formData.gstin.trim()) secErrors.gstin = 'GSTIN is required';
      else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin.toUpperCase())) {
        secErrors.gstin = 'Invalid GSTIN Format (e.g. 29ABCDE1234F1Z5)';
      }
    }

    if (sec === 2) {
      if (!formData.representativeName.trim()) secErrors.representativeName = 'Representative name is required';
      if (!formData.representativeDesignation.trim()) secErrors.representativeDesignation = 'Designation is required';
      if (!formData.representativeMobile.trim()) secErrors.representativeMobile = 'Mobile number is required';
      else if (!/^[6-9]\d{9}$/.test(formData.representativeMobile)) {
        secErrors.representativeMobile = 'Invalid 10-digit mobile number';
      }
      if (!formData.representativeEmail.trim()) secErrors.representativeEmail = 'Representative email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.representativeEmail)) {
        secErrors.representativeEmail = 'Invalid email address';
      }
      if (!formData.addressLine1.trim()) secErrors.addressLine1 = 'Address Line 1 is required';
      if (!formData.city.trim()) secErrors.city = 'City is required';
      if (!formData.state.trim()) secErrors.state = 'State is required';
      if (!formData.pinCode.trim()) secErrors.pinCode = 'PIN Code is required';
    }

    if (sec === 3) {
      if (!files.docCompanyReg) secErrors.docCompanyReg = 'Company Registration Certificate is required';
      if (!files.docPan) secErrors.docPan = 'Company PAN Card is required';
      if (!files.docGst) secErrors.docGst = 'GST Certificate is required';
      if (!files.docLicense) secErrors.docLicense = 'Shipping Agent License is required';
      if (!files.docAuthLetter) secErrors.docAuthLetter = 'Representative Authorization Letter is required';
    }

    if (sec === 4) {
      if (!formData.username.trim()) secErrors.username = 'Username is required';
      else if (formData.username.length < 4) secErrors.username = 'Username must be at least 4 characters';
      if (!formData.email.trim()) secErrors.email = 'Account Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        secErrors.email = 'Invalid email address';
      }
      if (!formData.password) secErrors.password = 'Password is required';
      else if (formData.password.length < 6) secErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) {
        secErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (sec === 5) {
      if (!formData.isCertified) secErrors.isCertified = 'You must accept NMPA declaration to submit';
    }

    return secErrors;
  };

  // Section flow navigation helper
  const nextSection = (curr) => {
    const secErrors = validateSection(curr);
    if (Object.keys(secErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...secErrors }));
      triggerToast('Incomplete Stage', `Stage ${curr} has missing required fields. Marked in red.`, 'warning');
    }
    const next = curr + 1;
    if (next <= 5) {
      navigateToSection(next);
    }
  };

  const prevSection = (curr) => {
    const prev = curr - 1;
    if (prev >= 1) {
      navigateToSection(prev);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all sections
    let allErrors = {};
    for (let i = 1; i <= 5; i++) {
      allErrors = { ...allErrors, ...validateSection(i) };
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      triggerToast('Submission Blocked', 'Please fix all errors and upload required documents before submitting.', 'error');
      // Find the first section with errors and open it
      for (let i = 1; i <= 5; i++) {
        const sectionErrors = validateSection(i);
        if (Object.keys(sectionErrors).length > 0) {
          setActiveSection(i);
          setSectionsOpen(prev => {
            const reset = { 1: false, 2: false, 3: false, 4: false, 5: false };
            reset[i] = true;
            return reset;
          });
          break;
        }
      }
      return;
    }

    setSubmitting(true);

    try {
      // Build form data payload
      const formPayload = new FormData();
      
      // Append standard fields
      Object.keys(formData).forEach(key => {
        formPayload.append(key, formData[key]);
      });

      // Append file attachments
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formPayload.append(key, files[key]);
        }
      });

      const res = await API.post('/registrations/register', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccessInfo(res.data);
      localStorage.removeItem('nmpa_agent_reg_draft'); // Clean draft on success
      triggerToast('Registration Filed', 'Your request has been successfully submitted to NMPA.', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Submission Failed', err.response?.data?.message || 'Error occurred during registration.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Render Success Screen
  if (successInfo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-955 flex flex-col justify-center items-center p-6 text-sans animate-in fade-in duration-300">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-10 rounded-[32px] shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-855 dark:text-white">Registration Submitted</h2>
            <p className="text-sm text-slate-400 font-light">
              Your application has been received and is currently in the verification pipeline.
            </p>
          </div>

          {/* Registration specs box */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl text-left space-y-3.5 text-xs text-slate-600 dark:text-slate-350">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">Request Details</span>
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/15 text-[10px] font-bold rounded-md uppercase tracking-widest">{successInfo.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-slate-400 text-[10px]">REGISTRATION ID</span>
                <strong className="text-sm font-mono text-sky-600 dark:text-sky-400 font-bold mt-0.5 block">{successInfo.registrationId}</strong>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px]">COMPANY NAME</span>
                <strong className="text-slate-800 dark:text-slate-100 font-bold mt-0.5 block truncate" title={formData.companyName}>{formData.companyName}</strong>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px]">REPRESENTATIVE</span>
                <span className="mt-0.5 block font-medium">{formData.representativeName}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px]">ASSOCIATED EMAIL</span>
                <span className="mt-0.5 block font-mono truncate" title={formData.email}>{formData.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-[#009fe3] hover:bg-[#008cc9] text-white font-bold rounded-xl text-xs tracking-wider uppercase transition shadow-lg shadow-sky-500/10 cursor-pointer"
            >
              Return to Login Terminal
            </button>
            <p className="text-[10px] text-slate-400 italic">
              Super admin will review documentation files and remarks. If approved, user credentials will automatically provision port access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Consolidated 5 logical steps definition matching user UI
  const sectionsList = [
    { num: 1, title: 'Company Profile' },
    { num: 2, title: 'Authorized Representative' },
    { num: 3, title: 'Mandatory Document Upload' },
    { num: 4, title: 'Account Credentials' },
    { num: 5, title: 'Declaration & Submit' }
  ];

  const handleAutoFillDemo = () => {
    setFormData({
      companyName: 'Oceanic Shipping & Logistics Pvt Ltd',
      companyRegNo: 'U74900KA2024PTC987654',
      companyType: 'Private Ltd',
      panNumber: 'ABCDE1234F',
      gstin: '29ABCDE1234F1Z5',
      licenseNumber: 'SA/NMPA/2026/088',
      representativeName: 'Rahul Sharma',
      representativeDesignation: 'Managing Director',
      representativeMobile: '9876543210',
      representativeEmail: 'rahul.sharma@oceanicship.com',
      addressLine1: 'Suite 402, Port Towers, Main Gate Road',
      addressLine2: 'Panambur Industrial Area',
      city: 'Mangalore',
      state: 'Karnataka',
      pinCode: '575010',
      username: 'oceanic_shipping',
      email: 'contact@oceanicship.com',
      password: 'password123',
      confirmPassword: 'password123',
      isCertified: true
    });
    setVisitedSections({ 1: true, 2: true, 3: true, 4: true, 5: true });
    setSectionsOpen({ 1: true, 2: true, 3: true, 4: true, 5: true });
    triggerToast('Demo Data Filled', 'Populated all required fields for test filing.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#002B49] text-white px-6 lg:px-12 py-4 flex flex-wrap items-center justify-between shadow-md border-b border-slate-800 sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 select-none">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-sky-300">
              <Anchor className="w-6 h-6" />
            </div>
            <span className="text-lg sm:text-xl font-black text-white tracking-wider uppercase font-sans">
              Port Inventory Management System
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoFillDemo}
            className="px-3.5 py-2 text-xs font-black text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 rounded-xl border border-amber-500/30 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>⚡</span> Auto Fill Demo Data
          </button>
          <button
            onClick={handleSaveDraft}
            className="px-3.5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition cursor-pointer"
          >
            Save as Draft
          </button>
          <button
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/10 transition cursor-pointer"
          >
            Reset Form
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-3.5 py-2 text-xs font-bold text-white/80 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </header>

      {/* Main Body (Full Screen Width) */}
      <main className="w-full px-6 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-screen">
        
        {/* Left Side: Vertical Stage Pipeline Indicator */}
        <aside className="lg:col-span-3 sticky top-36 hidden lg:block select-none">
          <div className="py-2 pr-2">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-6 pl-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#009fe3]"></span>
              Registration Process Stages
            </h3>
            
            {/* Vertical Timeline Pipeline */}
            <div className="relative border-l-2 border-slate-300 dark:border-slate-800 ml-4 space-y-4 pl-6">
              {sectionsList.map(sec => {
                const secErrors = validateSection(sec.num);
                const hasMissingFields = Object.keys(secErrors).length > 0;
                const wasVisited = visitedSections[sec.num] || activeSection > sec.num;

                const isActive = activeSection === sec.num;
                const isCompleted = !hasMissingFields && (wasVisited || activeSection > sec.num);
                const isMissing = hasMissingFields && wasVisited && !isActive;

                return (
                  <div key={sec.num} className="relative">
                    
                    {/* Circle Node Badge on Pipeline Line */}
                    <span className={`absolute -left-[37px] top-3.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isMissing
                        ? 'bg-rose-500 text-white ring-4 ring-rose-500/20 shadow-md'
                        : isActive 
                          ? 'bg-[#009fe3] text-white ring-4 ring-[#009fe3]/25 shadow-md scale-110' 
                          : isCompleted
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-white border-2 border-slate-300 text-slate-600'
                    }`}>
                      {isMissing ? '!' : isCompleted ? '✓' : sec.num}
                    </span>

                    {/* Stage Card Box */}
                    <button
                      type="button"
                      onClick={() => navigateToSection(sec.num)}
                      className={`w-full p-4 rounded-2xl text-left transition-all duration-200 border cursor-pointer ${
                        isMissing
                          ? 'bg-rose-50/80 border-rose-300 text-rose-900 font-extrabold shadow-sm'
                          : isActive 
                            ? 'bg-white dark:bg-slate-900 border-2 border-[#009fe3] text-[#009fe3] font-black shadow-md'
                            : isCompleted
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-700 font-bold hover:bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <span className={`block text-xs font-black uppercase tracking-wider mb-1 ${
                        isMissing ? 'text-rose-600 font-black' : 'opacity-80'
                      }`}>
                        Stage {sec.num} {
                          isMissing 
                            ? '(FIELDS NOT FILLED)' 
                            : isCompleted 
                              ? '(COMPLETED)' 
                              : isActive 
                                ? '(ACTIVE)' 
                                : ''
                        }
                      </span>
                      <span className="block text-sm md:text-base font-black tracking-tight leading-snug">
                        {sec.title}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Side: Step Forms */}
        <form onSubmit={handleSubmit} className="lg:col-span-9 space-y-6">
          
          {/* SECTION 1: COMPANY PROFILE */}
          <div id="section-1" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden scroll-mt-36">
            <button
              type="button" onClick={() => toggleSection(1)}
              className="w-full flex justify-between items-center p-6 font-bold text-slate-850 dark:text-white hover:bg-slate-50/50 text-left border-b border-slate-100 dark:border-slate-850"
            >
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">Section 1: Company Profile</h3>
                <p className="text-xs md:text-sm text-slate-400 font-normal mt-0.5">Corporate identities, registration codes, tax and customs license details</p>
              </div>
              {sectionsOpen[1] ? <ChevronUp className="w-6 h-6 text-slate-500" /> : <ChevronDown className="w-6 h-6 text-slate-500" />}
            </button>
            
            {sectionsOpen[1] && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-1 duration-200">
                <div>
                  <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Company Name *</label>
                  <input
                    type="text" name="companyName" value={formData.companyName} onChange={handleChange}
                    className={`w-full p-3.5 bg-slate-50 dark:bg-slate-955 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.companyName ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                    placeholder="e.g. Maritime Logistics Pvt Ltd"
                  />
                  {errors.companyName && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.companyName}</span>}
                </div>

                <div>
                  <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Company Registration No (CIN/LLPIN)</label>
                  <input
                    type="text" name="companyRegNo" value={formData.companyRegNo} onChange={handleChange}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900"
                    placeholder="e.g. U74900KA2020PTC123456"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Company Type</label>
                  <select
                    name="companyType" value={formData.companyType} onChange={handleChange}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none text-sm md:text-base font-bold text-slate-900"
                  >
                    <option value="Private Ltd">Private Ltd</option>
                    <option value="Public Ltd">Public Ltd</option>
                    <option value="LLP">LLP</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Proprietorship">Proprietorship</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-800 text-sm md:text-base mb-2">PAN Number *</label>
                  <input
                    type="text" name="panNumber" value={formData.panNumber} onChange={handleChange}
                    className={`w-full p-3.5 bg-slate-50 dark:bg-slate-955 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.panNumber ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                  />
                  {errors.panNumber && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.panNumber}</span>}
                </div>

                <div>
                  <label className="block font-black text-slate-800 text-sm md:text-base mb-2">GSTIN *</label>
                  <input
                    type="text" name="gstin" value={formData.gstin} onChange={handleChange}
                    className={`w-full p-3.5 bg-slate-50 dark:bg-slate-955 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.gstin ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    maxLength={15}
                  />
                  {errors.gstin && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.gstin}</span>}
                </div>

                <div>
                  <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Customs Broker / Shipping Agent License No</label>
                  <input
                    type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-800 rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900"
                    placeholder="e.g. CHA/NMPA/2024/099"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end pt-3">
                  <button
                    type="button" onClick={() => nextSection(1)}
                    className="px-8 py-3 bg-[#009fe3] hover:bg-[#0089c4] text-white rounded-xl font-black transition shadow-md cursor-pointer text-xs md:text-sm uppercase tracking-wider"
                  >
                    Next Step &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* SECTION 2: AUTHORIZED REPRESENTATIVE & OFFICE ADDRESS */}
          <div id="section-2" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden scroll-mt-36">
            <button
              type="button" onClick={() => toggleSection(2)}
              className="w-full flex justify-between items-center p-6 font-bold text-slate-850 dark:text-white hover:bg-slate-50/50 text-left border-b border-slate-100 dark:border-slate-850"
            >
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">Section 2: Representative & Office Address</h3>
                <p className="text-xs md:text-sm text-slate-400 font-normal mt-0.5">Primary representative KYC and legal corporate office coordinates</p>
              </div>
              {sectionsOpen[2] ? <ChevronUp className="w-6 h-6 text-slate-500" /> : <ChevronDown className="w-6 h-6 text-slate-500" />}
            </button>
            
            {sectionsOpen[2] && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-1 duration-200">
                <div className="md:col-span-2 bg-slate-50/50 dark:bg-slate-950 p-6 border border-slate-200 dark:border-slate-850 rounded-2xl mb-2">
                  <h4 className="font-black text-[#009fe3] text-base md:text-lg mb-4">Authorized Representative KYC</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Full Name *</label>
                      <input
                        type="text" name="representativeName" value={formData.representativeName} onChange={handleChange}
                        className={`w-full p-3.5 bg-white dark:bg-slate-900 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.representativeName ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                        placeholder="e.g. Rahul Sharma"
                      />
                      {errors.representativeName && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.representativeName}</span>}
                    </div>

                    <div>
                      <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Designation *</label>
                      <input
                        type="text" name="representativeDesignation" value={formData.representativeDesignation} onChange={handleChange}
                        className={`w-full p-3.5 bg-white dark:bg-slate-900 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.representativeDesignation ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                        placeholder="e.g. Managing Partner"
                      />
                      {errors.representativeDesignation && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.representativeDesignation}</span>}
                    </div>

                    <div>
                      <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Mobile Number *</label>
                      <input
                        type="tel" name="representativeMobile" value={formData.representativeMobile} onChange={handleChange}
                        className={`w-full p-3.5 bg-white dark:bg-slate-900 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.representativeMobile ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                        placeholder="e.g. 9876543210"
                        maxLength={10}
                      />
                      {errors.representativeMobile && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.representativeMobile}</span>}
                    </div>

                    <div>
                      <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Representative Email Address *</label>
                      <input
                        type="email" name="representativeEmail" value={formData.representativeEmail} onChange={handleChange}
                        className={`w-full p-3.5 bg-white dark:bg-slate-900 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.representativeEmail ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                        placeholder="e.g. rahul.sharma@domain.com"
                      />
                      {errors.representativeEmail && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.representativeEmail}</span>}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 bg-slate-50/50 dark:bg-slate-955 p-6 border border-slate-200 dark:border-slate-855 rounded-2xl">
                  <h4 className="font-black text-[#009fe3] text-base md:text-lg mb-4">Registered Office Address</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Address Line 1 *</label>
                      <input
                        type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange}
                        className={`w-full p-3.5 bg-white dark:bg-slate-900 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.addressLine1 ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                        placeholder="e.g. 1st Floor, Port Towers"
                      />
                      {errors.addressLine1 && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.addressLine1}</span>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Address Line 2</label>
                      <input
                        type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange}
                        className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900"
                        placeholder="e.g. Panambur Road, Mangalore"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-slate-800 text-sm md:text-base mb-2">City *</label>
                      <input
                        type="text" name="city" value={formData.city} onChange={handleChange}
                        className={`w-full p-3.5 bg-white dark:bg-slate-900 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.city ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                        placeholder="Mangalore"
                      />
                      {errors.city && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.city}</span>}
                    </div>

                    <div>
                      <label className="block font-black text-slate-800 text-sm md:text-base mb-2">State *</label>
                      <input
                        type="text" name="state" value={formData.state} onChange={handleChange}
                        className={`w-full p-3.5 bg-white dark:bg-slate-900 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.state ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                        placeholder="Karnataka"
                      />
                      {errors.state && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.state}</span>}
                    </div>

                    <div>
                      <label className="block font-black text-slate-800 text-sm md:text-base mb-2">PIN Code *</label>
                      <input
                        type="text" name="pinCode" value={formData.pinCode} onChange={handleChange}
                        className={`w-full p-3.5 bg-white dark:bg-slate-900 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.pinCode ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                        placeholder="575010"
                        maxLength={6}
                      />
                      {errors.pinCode && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.pinCode}</span>}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-between pt-3">
                  <button
                    type="button" onClick={() => prevSection(2)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold transition cursor-pointer text-xs md:text-sm uppercase tracking-wider"
                  >
                    Back
                  </button>
                  <button
                    type="button" onClick={() => nextSection(2)}
                    className="px-8 py-3 bg-[#009fe3] hover:bg-[#0089c4] text-white rounded-xl font-black transition shadow-md cursor-pointer text-xs md:text-sm uppercase tracking-wider"
                  >
                    Next Step &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: MANDATORY DOCUMENT UPLOADS */}
          <div id="section-3" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden scroll-mt-36">
            <button
              type="button" onClick={() => toggleSection(3)}
              className="w-full flex justify-between items-center p-6 font-bold text-slate-855 dark:text-white hover:bg-slate-50/50 text-left border-b border-slate-100 dark:border-slate-855"
            >
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">Section 3: Mandatory Document Uploads</h3>
                <p className="text-xs md:text-sm text-slate-400 font-normal mt-0.5">Attach legal certifications and authorizing documents (PDF, Image, Excel max 10MB)</p>
              </div>
              {sectionsOpen[3] ? <ChevronUp className="w-6 h-6 text-slate-500" /> : <ChevronDown className="w-6 h-6 text-slate-500" />}
            </button>
            
            {sectionsOpen[3] && (
              <div className="p-6 space-y-6 animate-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* File Dropzones list */}
                  {[
                    { field: 'docCompanyReg', label: 'Company Registration / Incorporation Certificate *' },
                    { field: 'docPan', label: 'Company PAN Card Copy *' },
                    { field: 'docGst', label: 'GST Registration Certificate *' },
                    { field: 'docLicense', label: 'Customs Broker / Shipping Agent License *' },
                    { field: 'docAuthLetter', label: 'Representative Authorization Letter *' }
                  ].map(docItem => {
                    const selectedFile = files[docItem.field];
                    const progress = uploadProgress[docItem.field];
                    
                    return (
                      <div key={docItem.field} className="space-y-2">
                        <label className="block font-black text-slate-800 text-sm md:text-base mb-2">{docItem.label}</label>
                        
                        {!selectedFile ? (
                          <label
                            htmlFor={`file-input-${docItem.field}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleFileChange(docItem.field, e.dataTransfer.files[0]);
                              }
                            }}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col justify-center items-center gap-2 bg-slate-50/50 hover:bg-slate-100 hover:border-[#009fe3] ${
                              errors[docItem.field] ? 'border-rose-400 bg-rose-50/10' : 'border-slate-300 dark:border-slate-800'
                            }`}
                          >
                            <p className="text-sm md:text-base text-slate-700 font-extrabold select-none pointer-events-none">
                              Drag & Drop file or <span className="text-[#009fe3] underline font-black">Browse</span>
                            </p>
                            <input
                              type="file"
                              id={`file-input-${docItem.field}`}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileChange(docItem.field, e.target.files[0]);
                                }
                              }}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                            />
                          </label>
                        ) : (
                          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-2xl flex items-center justify-between gap-3">
                            <div className="overflow-hidden">
                              <p className="font-extrabold text-slate-900 dark:text-slate-200 text-sm truncate pr-2" title={selectedFile.name}>{selectedFile.name}</p>
                              <span className="text-xs text-slate-400 font-mono">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {progress < 100 ? (
                                <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                  <div className="bg-[#009fe3] h-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                              ) : (
                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 font-extrabold text-xs rounded uppercase border border-emerald-500/20">Attached</span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(docItem.field)}
                                className="px-3 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded text-xs font-black transition cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                        {errors[docItem.field] && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors[docItem.field]}</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="md:col-span-2 flex justify-between pt-4 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button" onClick={() => prevSection(3)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold transition cursor-pointer text-xs md:text-sm uppercase tracking-wider"
                  >
                    Back
                  </button>
                  <button
                    type="button" onClick={() => nextSection(3)}
                    className="px-8 py-3 bg-[#009fe3] hover:bg-[#0089c4] text-white rounded-xl font-black transition shadow-md cursor-pointer text-xs md:text-sm uppercase tracking-wider"
                  >
                    Next Step &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: ACCOUNT CREDENTIALS */}
          <div id="section-4" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden scroll-mt-36">
            <button
              type="button" onClick={() => toggleSection(4)}
              className="w-full flex justify-between items-center p-6 font-bold text-slate-855 dark:text-white hover:bg-slate-50/50 text-left border-b border-slate-100 dark:border-slate-855"
            >
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">Section 4: Account Credentials</h3>
                <p className="text-xs md:text-sm text-slate-400 font-normal mt-0.5">Define terminal access username and secure password configurations</p>
              </div>
              {sectionsOpen[4] ? <ChevronUp className="w-6 h-6 text-slate-500" /> : <ChevronDown className="w-6 h-6 text-slate-500" />}
            </button>
            
            {sectionsOpen[4] && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-1 duration-200">
                <div>
                  <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Username *</label>
                  <input
                    type="text" name="username" value={formData.username} onChange={handleChange}
                    className={`w-full p-3.5 bg-slate-50 dark:bg-slate-955 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.username ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                    placeholder="e.g. nmpa_agent"
                  />
                  {errors.username && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.username}</span>}
                </div>

                <div>
                  <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Account Email Address *</label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    className={`w-full p-3.5 bg-slate-50 dark:bg-slate-955 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.email ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                    placeholder="e.g. raw.shipping@domain.com"
                  />
                  {errors.email && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.email}</span>}
                </div>

                <div>
                  <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Password *</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                      className={`w-full p-3.5 pr-12 bg-slate-50 dark:bg-slate-955 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.password ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 text-slate-500 hover:text-slate-900 cursor-pointer text-xs md:text-sm font-black uppercase"
                    >
                      {showPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.password}</span>}
                </div>

                <div>
                  <label className="block font-black text-slate-800 text-sm md:text-base mb-2">Confirm Password *</label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPass ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                      className={`w-full p-3.5 pr-12 bg-slate-50 dark:bg-slate-955 border rounded-xl focus:border-[#009fe3] focus:outline-none text-sm md:text-base font-bold text-slate-900 ${errors.confirmPassword ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800'}`}
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 text-slate-500 hover:text-slate-900 cursor-pointer text-xs md:text-sm font-black uppercase"
                    >
                      {showConfirmPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.confirmPassword}</span>}
                </div>

                <div className="md:col-span-2 flex justify-between pt-3">
                  <button
                    type="button" onClick={() => prevSection(4)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold transition cursor-pointer text-xs md:text-sm uppercase tracking-wider"
                  >
                    Back
                  </button>
                  <button
                    type="button" onClick={() => nextSection(4)}
                    className="px-8 py-3 bg-[#009fe3] hover:bg-[#0089c4] text-white rounded-xl font-black transition shadow-md cursor-pointer text-xs md:text-sm uppercase tracking-wider"
                  >
                    Next Step &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: DECLARATION & SUBMIT */}
          <div id="section-5" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden scroll-mt-36">
            <button
              type="button" onClick={() => toggleSection(5)}
              className="w-full flex justify-between items-center p-6 font-bold text-slate-855 dark:text-white hover:bg-slate-50/50 text-left border-b border-slate-100 dark:border-slate-855"
            >
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">Section 5: Declaration & Submit</h3>
                <p className="text-xs md:text-sm text-slate-400 font-normal mt-0.5">Certify document validity and submit request for super admin review</p>
              </div>
              {sectionsOpen[5] ? <ChevronUp className="w-6 h-6 text-slate-500" /> : <ChevronDown className="w-6 h-6 text-slate-500" />}
            </button>
            
            {sectionsOpen[5] && (
              <div className="p-6 space-y-6 animate-in slide-in-from-top-1 duration-200">
                <div className="p-5 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-2xl leading-normal">
                  <h4 className="font-black mb-1.5 text-base md:text-lg">Legal Notice & Declaration</h4>
                  <p className="font-medium text-xs md:text-sm leading-relaxed text-slate-700">
                    By submitting this registration request to the Port Inventory Management System, the applicant certifies under penalty of perjury that the company registration credentials, PAN, GST, and Shipping Agent customs license scans uploaded are authentic. Any misrepresentation will lead to permanent terminal blockage and blacklisting.
                  </p>
                </div>

                <div className="flex items-start gap-3.5 select-none">
                  <input
                    type="checkbox" name="isCertified" id="isCertified" checked={formData.isCertified} onChange={handleChange}
                    className="w-6 h-6 rounded border-slate-300 text-[#009fe3] focus:ring-[#009fe3] transition mt-0.5 cursor-pointer shrink-0"
                  />
                  <label htmlFor="isCertified" className="text-slate-900 dark:text-slate-200 font-black cursor-pointer leading-snug text-sm md:text-base">
                    I declare and certify that all details, numbers, and document files entered are correct and legitimate. *
                  </label>
                </div>
                {errors.isCertified && <span className="text-xs md:text-sm font-extrabold text-rose-600 mt-1.5 block">{errors.isCertified}</span>}

                <div className="flex justify-between pt-4">
                  <button
                    type="button" onClick={() => prevSection(5)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold transition cursor-pointer text-xs md:text-sm uppercase tracking-wider"
                  >
                    Back
                  </button>
                  <button
                    type="submit" disabled={submitting}
                    className="px-10 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl font-black tracking-wider text-sm md:text-base uppercase transition shadow-lg cursor-pointer"
                  >
                    {submitting ? 'Filing Request...' : 'Submit Registration'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </form>
      </main>
    </div>
  );
};

export default ShippingAgentRegistration;
