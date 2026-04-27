import { useState, useRef } from 'react';

export default function OTPInput({ length = 6, onComplete }) {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    const code = newOtp.join('');
    if (code.length === length && onComplete) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    if (pasted.length === length && onComplete) {
      onComplete(pasted);
    }
    const focusIndex = Math.min(pasted.length, length - 1);
    inputs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`
            w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold
            rounded-xl border-2 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-500
            ${digit ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-800'}
          `}
          id={`otp-input-${index}`}
        />
      ))}
    </div>
  );
}
