import React, { useEffect, useRef } from 'react';
import PhoneInputWithCountry from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './PhoneInput.css';

const PhoneInput = ({ 
  value, 
  onChange, 
  error, 
  className = '', 
  placeholder = 'Enter phone number',
  required = false,
  disabled = false 
}) => {
  const phoneInputRef = useRef(null);

  // Ensure dropdown is closed on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phoneInputRef.current) {
        // Find the country dropdown and ensure it's closed
        const dropdownButton = phoneInputRef.current.querySelector('.selected-flag');
        const countryList = phoneInputRef.current.querySelector('.country-list');
        
        if (countryList && countryList.style.display !== 'none') {
          countryList.style.display = 'none';
        }
        
        // Remove any open class that might be present
        if (dropdownButton) {
          dropdownButton.classList.remove('open');
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      ref={phoneInputRef}
      className={`phone-input-wrapper ${error ? 'has-error' : ''}`}
    >
      <PhoneInputWithCountry
        country={'in'} // Default to India
        value={value}
        onChange={onChange}
        inputProps={{
          name: 'phone',
          required: required,
          disabled: disabled,
          autoFocus: false,
          autoComplete: 'tel',
          className: error ? 'error' : ''
        }}
        containerClass={`phone-input-container ${className}`}
        inputClass="phone-input-field"
        buttonClass="phone-input-button"
        dropdownClass="phone-input-dropdown"
        placeholder={placeholder}
        enableSearch={true}
        searchPlaceholder="Search country..."
        disableSearchIcon={false}
        preferredCountries={['in', 'us', 'gb', 'ca', 'au', 'ae', 'de', 'fr', 'sg', 'jp', 'cn', 'nz']}
        specialLabel=""
        autoFormat={true}
        countryCodeEditable={false}
        // These props help prevent auto-opening
        disableDropdown={false}
        disabled={disabled}
      />
      
      {/* Helper text - At the bottom */}
      <p className="text-xs text-slate-500 mt-1" style={{ order: 3 }}>
        Preferably enter WhatsApp number
      </p>
      
      {/* Error message */}
      {error && (
        <div className="mt-1 flex items-center gap-1 text-red-500 text-xs" style={{ order: 4 }}>
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
