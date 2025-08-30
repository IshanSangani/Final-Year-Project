/**
 * FFT Utility
 * Simple implementation of Fast Fourier Transform for audio processing
 * 
 * NOTE: For production use, consider using a more optimized FFT library 
 * such as 'fft-js' or 'fourier-transform' instead of this basic implementation.
 * 
 * Add these dependencies:
 * npm install fourier-transform
 */

// Simple Complex number class
class Complex {
  constructor(real, imag = 0) {
    this.real = real;
    this.imag = imag;
  }

  add(other) {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  subtract(other) {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  multiply(other) {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  magnitude() {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }
}

// Calculate FFT using Cooley-Tukey algorithm (recursive implementation)
function fft(signal) {
  const n = signal.length;
  
  // Base case
  if (n <= 1) {
    return signal;
  }
  
  // Recursive case: split even and odd
  const even = [];
  const odd = [];
  
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      even.push(signal[i]);
    } else {
      odd.push(signal[i]);
    }
  }
  
  // Recursively compute FFT on even and odd parts
  const evenFFT = fft(even);
  const oddFFT = fft(odd);
  
  // Combine results
  const result = new Array(n);
  
  for (let k = 0; k < n / 2; k++) {
    const angle = -2 * Math.PI * k / n;
    const twiddle = new Complex(Math.cos(angle), Math.sin(angle));
    const oddTerm = twiddle.multiply(oddFFT[k]);
    
    result[k] = evenFFT[k].add(oddTerm);
    result[k + n / 2] = evenFFT[k].subtract(oddTerm);
  }
  
  return result;
}

// Convert audio samples to FFT spectrum
const getSpectrum = (samples, fftSize = 1024) => {
  // Ensure samples length is a power of 2 by padding with zeros
  const paddedSamples = padToPowerOfTwo(samples, fftSize);
  
  // Apply window function to reduce spectral leakage
  const windowedSamples = applyHannWindow(paddedSamples);
  
  // Convert to complex numbers
  const complexSamples = windowedSamples.map(sample => new Complex(sample));
  
  // Compute FFT
  const spectrum = fft(complexSamples);
  
  // Get magnitudes (first half of spectrum, as the second half is symmetrical for real signals)
  return spectrum.slice(0, spectrum.length / 2).map(bin => bin.magnitude());
};

// Pad array to nearest power of 2
const padToPowerOfTwo = (array, targetLength) => {
  const result = new Array(targetLength).fill(0);
  for (let i = 0; i < array.length && i < targetLength; i++) {
    result[i] = array[i];
  }
  return result;
};

// Apply Hann window to reduce spectral leakage
const applyHannWindow = (array) => {
  return array.map((value, index) => {
    const multiplier = 0.5 * (1 - Math.cos(2 * Math.PI * index / (array.length - 1)));
    return value * multiplier;
  });
};

// Generate a spectrogram from audio buffer
const generateSpectrogram = (audioBuffer, fftSize = 1024, hopSize = 512) => {
  const numFrames = Math.floor((audioBuffer.length - fftSize) / hopSize) + 1;
  const spectrogram = [];
  
  // Process each frame
  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const frame = audioBuffer.slice(start, start + fftSize);
    const spectrum = getSpectrum(frame, fftSize);
    
    // Convert to dB scale and normalize
    const dbSpectrum = spectrum.map(value => {
      const db = 20 * Math.log10(value + 1e-10);
      return Math.max(0, Math.min(1, (db + 100) / 100)); // Normalize to [0,1]
    });
    
    spectrogram.push(dbSpectrum);
  }
  
  return spectrogram;
};

// Utility for basic audio analysis
const analyzeAudio = (audioBuffer) => {
  // Calculate basic statistics
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  
  for (const sample of audioBuffer) {
    min = Math.min(min, sample);
    max = Math.max(max, sample);
    sum += Math.abs(sample);
  }
  
  const range = max - min;
  const average = sum / audioBuffer.length;
  
  return {
    min,
    max,
    range,
    average,
  };
};

export default {
  getSpectrum,
  generateSpectrogram,
  analyzeAudio,
};
