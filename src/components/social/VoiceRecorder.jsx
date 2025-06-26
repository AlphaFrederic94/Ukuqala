import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { uploadFile } from '../../lib/storageHelper';
import VoiceMessagePlayer from '../chat/VoiceMessagePlayer';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      stopRecording();
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);

      // Reset state
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);
      setRecordingTime(0);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);

        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(t('social.microphoneAccessDenied'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    setRecordingTime(0);
    onCancel();
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    setUploading(true);
    try {
      // Compress audio (convert to mp3 with lower bitrate)
      // Note: In a real app, you might want to use a library like lamejs for better compression

      // Upload to Supabase Storage using our helper function
      const fileName = `voice_message_${Date.now()}.webm`;
      const filePath = `chat/${user.id}/${fileName}`;

      const { url, error } = await uploadFile(audioBlob, filePath, {
        contentType: 'audio/webm',
        cacheControl: '3600'
      });

      if (error) throw error;
      if (!url) throw new Error('Failed to get URL for uploaded file');

      // Call the onSend callback with the audio URL
      onSend(url, {
        type: 'audio/webm',
        name: fileName,
        size: audioBlob.size,
        duration: recordingTime
      });

      // Clean up
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);
      setAudioBlob(null);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error uploading audio:', error);
      setError(t('social.errorUploadingAudio') + ': ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}

      {!isRecording && !audioUrl ? (
        <button
          onClick={startRecording}
          className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          aria-label={t('social.startRecording')}
        >
          <Mic className="w-5 h-5" />
        </button>
      ) : isRecording ? (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-500 font-medium">{formatTime(recordingTime)}</span>
          </div>

          <button
            onClick={stopRecording}
            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            aria-label={t('social.stopRecording')}
          >
            <Square className="w-5 h-5" />
          </button>
        </div>
      ) : audioUrl ? (
        <div className="flex items-center space-x-2">
          <div className="w-48">
            <VoiceMessagePlayer audioUrl={audioUrl} />
          </div>

          {uploading ? (
            <button
              disabled
              className="p-2 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
            </button>
          ) : (
            <>
              <button
                onClick={sendAudio}
                className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                aria-label={t('social.sendAudio')}
              >
                <Send className="w-5 h-5" />
              </button>

              <button
                onClick={cancelRecording}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label={t('social.discardAudio')}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default VoiceRecorder;
