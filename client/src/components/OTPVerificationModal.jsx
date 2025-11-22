import React, { useState, useEffect } from 'react';
import { X, Phone, Loader } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function OTPVerificationModal({ isOpen, onClose, onVerified, mobile, purpose = 'payment' }) {
  const [mobileNumber, setMobileNumber] = useState(mobile || '');
  const [otp, setOtp] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (isOpen) {
      if (mobile) {
        const cleanedMobile = mobile.replace(/[\s-]/g, '');
        setMobileNumber(mobile);
        // Auto-send OTP if mobile number is provided and valid
        if (/^[6-9]\d{9}$/.test(cleanedMobile)) {
          // Use setTimeout to avoid calling during render and ensure state is updated
          const timer = setTimeout(async () => {
            const cleaned = mobile.replace(/[\s-]/g, '');
            if (!cleaned || !/^[6-9]\d{9}$/.test(cleaned)) {
              return;
            }

            setSendingOTP(true);
            try {
              const response = await API.post('/api/otp/generate', {
                identifier: cleaned,
                type: 'mobile',
                purpose: purpose
              });

              if (response.data.userNotFound) {
                toast.error('This mobile number is not registered. Please register first.');
                setSendingOTP(false);
                return;
              }

              // In development, OTP is returned in response
              if (response.data.otp) {
                toast.success(`OTP sent! Your OTP is: ${response.data.otp}`, { duration: 10000 });
              } else {
                toast.success('OTP sent to your mobile number');
              }
              setOtpSent(true);
              setResendCountdown(30);
            } catch (error) {
              if (error.response?.status === 404 || error.response?.data?.message?.includes('not registered')) {
                toast.error('This mobile number is not registered. Please register first.');
              } else {
                toast.error(error.response?.data?.message || 'Failed to send OTP');
              }
            } finally {
              setSendingOTP(false);
            }
          }, 100);
          return () => clearTimeout(timer);
        }
      } else {
        // Reset state when modal opens without mobile
        setMobileNumber('');
        setOtp('');
        setOtpSent(false);
        setOtpVerified(false);
      }
    }
  }, [isOpen, mobile, purpose]);

  const sendOTP = async () => {
    const cleanedMobile = mobileNumber.replace(/[\s-]/g, '');
    if (!mobileNumber || !/^[6-9]\d{9}$/.test(cleanedMobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setSendingOTP(true);
    try {
      const response = await API.post('/api/otp/generate', {
        identifier: cleanedMobile,
        type: 'mobile',
        purpose: purpose
      });

      // Check if user exists
      if (response.data.userNotFound) {
        toast.error('This mobile number is not registered. Please register first.');
        setSendingOTP(false);
        return;
      }

      // Show OTP in toast exactly like registration flow
      // In development, OTP is returned in response
      if (response.data.otp) {
        toast.success(`OTP sent! Your OTP is: ${response.data.otp}`, { duration: 10000 });
      } else {
        toast.success('OTP sent to your mobile number');
      }
      setOtpSent(true);
      setResendCountdown(30);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.data?.message?.includes('not registered')) {
        toast.error('This mobile number is not registered. Please register first.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to send OTP');
      }
    } finally {
      setSendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOTP(true);
    try {
      await API.post('/api/otp/verify', {
        identifier: mobileNumber.replace(/[\s-]/g, ''),
        otp: otp,
        type: 'mobile',
        purpose: purpose
      });

      toast.success('OTP verified successfully');
      setOtpVerified(true);
      if (onVerified) {
        onVerified(mobileNumber.replace(/[\s-]/g, ''));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleClose = () => {
    setMobileNumber(mobile || '');
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setSendingOTP(false);
    setVerifyingOTP(false);
     setResendCountdown(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Verify Your Account</h2>
            <button 
              onClick={handleClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={sendingOTP || verifyingOTP}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!otpSent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter your mobile number"
                      className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={10}
                    />
                  </div>
                  <button
                    onClick={sendOTP}
                    disabled={sendingOTP || !mobileNumber}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sendingOTP ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  We'll send an OTP to verify your account
                </p>
              </div>
            </div>
          ) : !otpVerified ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <p className="text-sm text-gray-500 mt-2">
                  OTP sent to {mobileNumber}
                </p>
                <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Didn’t receive the OTP?'}
                  </span>
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={sendingOTP || resendCountdown > 0}
                    className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={verifyingOTP}
                >
                  Change Number
                </button>
                <button
                  onClick={verifyOTP}
                  disabled={verifyingOTP || otp.length !== 6}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifyingOTP ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Successfully!</h3>
              <p className="text-gray-600 mb-6">You can now proceed with the payment</p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

