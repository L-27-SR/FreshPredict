import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface Prediction {
  className: string;
  probability: number;
}

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/BWdOtEr88/";

export default function ImageClassifier() {
  const [model, setModel] = useState<tmImage.Model | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      setIsLoading(true);
      const modelURL = `${MODEL_URL}model.json`;
      const metadataURL = `${MODEL_URL}metadata.json`;
      const loadedModel = await window.tmImage.load(modelURL, metadataURL);
      setModel(loadedModel);
      setError('');
    } catch (err) {
      setError('Failed to load the AI model. Please try again later.');
      console.error('Failed to load model:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!model) {
      setError('Model not loaded. Please wait and try again.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file.');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB.');
      }

      const url = URL.createObjectURL(file);
      setImageUrl(url);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      const predictions = await model.predict(img);
      setPredictions(predictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setImageUrl('');
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, [model]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleImageUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  if (isLoading && !imageUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading AI Model...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-transparent bg-clip-text">
          Image Classifier
        </h1>
        <p className="text-gray-600 text-lg">
          Upload an image to classify it using our advanced AI model
        </p>
      </div>

      {error && (
        <div className="mb-8 animate-slide-up">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="relative">
        {!imageUrl ? (
          <div
            className={`upload-container bg-white rounded-xl shadow-lg p-12 text-center relative ${
              isDragging ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileInputChange}
            />
            <label
              htmlFor="file-upload"
              className="w-full h-full flex flex-col items-center cursor-pointer"
            >
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors duration-300">
                <Upload className="w-10 h-10 text-indigo-500" />
              </div>
              <p className="text-xl font-medium text-gray-700 mb-2">
                Drop your image here
              </p>
              <p className="text-sm text-gray-500">
                or click to select a file
              </p>
            </label>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg p-6 overflow-hidden">
              <img
                src={imageUrl}
                alt="Uploaded"
                className="w-full h-auto rounded-lg"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              </div>
            ) : (
              predictions.length > 0 && (
                <div className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xl font-medium text-gray-800">
                          {prediction.className}
                        </span>
                        <span className="text-lg font-semibold text-indigo-600">
                          {(prediction.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${prediction.probability * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setImageUrl('');
                  setPredictions([]);
                  setError('');
                }}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-lg hover:shadow-xl"
              >
                Upload Another Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}